import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 60; // Cache ISR: 60 secondi (visto che ora interroga il nostro DB)

export async function GET() {
  try {
    // 1. Fetch partite direttamente dal nostro database MLOps (Vercel Postgres)
    const { rows: allPicks } = await sql`
      SELECT id, match_name as match, pick, odds, match_date as commence_time, confidence_score
      FROM ml_predictions
      WHERE match_date > NOW()
      ORDER BY match_date ASC
      LIMIT 50
    `;

    // Se l'algoritmo non ha calcolato nulla o non ci sono partite future
    if (allPicks.length === 0) {
        return NextResponse.json({ 
            error: 'Nessuna previsione disponibile al momento. L\'algoritmo è in attesa di nuove partite.',
            singlePredictions: [],
            bollette: []
        }, { status: 200 });
    }

    // Convertiamo i valori numerici che Postgres potrebbe restituire come stringhe
    const formattedPicks = allPicks.map(p => ({
        ...p,
        odds: Number(p.odds)
    }));

    // 3. Creazione Singole Sicure (le 4 con la quota più bassa, indice di altissima probabilità)
    const singlePredictions = [...formattedPicks].sort((a: any, b: any) => a.odds - b.odds).slice(0, 4);

    // 4. Multiple
    const bollette = [];

    // Troviamo le partite che assomigliano alla Serie A o alle Coppe per categorizzarle (euristica per UI)
    const saPicks = formattedPicks.filter(p => p.match.includes('Juventus') || p.match.includes('Inter') || p.match.includes('Milan') || p.match.includes('Napoli') || p.match.includes('Roma') || p.match.includes('Lazio'));
    const euroPicks = formattedPicks.filter(p => !saPicks.includes(p));

    // Multipla Principale (Le top 4 più bilanciate)
    if (formattedPicks.length >= 4) {
      const selected = formattedPicks.slice(0, 4);
      const totalOdds = selected.reduce((acc: number, curr: any) => acc * curr.odds, 1);
      bollette.push({
        id: 'bolletta_main',
        title: 'La Multipla Algoritmica',
        type: 'principale',
        matches: selected,
        totalOdds: Math.round(totalOdds * 100) / 100
      });
    }

    // Raddoppio del Giorno
    if (formattedPicks.length >= 2) {
      // Cerchiamo due partite che combinate danno circa quota 2.0 (es. 1.4 x 1.4)
      const raddoppioMatches = [...formattedPicks].filter((p: any) => p.odds >= 1.25 && p.odds <= 1.6).slice(0, 2);
      if (raddoppioMatches.length === 2) {
        bollette.push({
          id: 'raddoppio',
          title: 'Il Raddoppio Statistico',
          type: 'raddoppio',
          matches: raddoppioMatches,
          totalOdds: Math.round(raddoppioMatches[0].odds * raddoppioMatches[1].odds * 100) / 100
        });
      }
    }

    // Multipla Azzardo (quote più alte)
    if (formattedPicks.length >= 8) {
      const mixed = [...formattedPicks].sort((a: any, b: any) => b.odds - a.odds).slice(0, 4); // Le 4 più alte
      const totalOdds = mixed.reduce((acc: number, curr: any) => acc * curr.odds, 1);
      bollette.push({
        id: 'bollettone',
        title: 'La Multipla Valore (Quote Alte)',
        type: 'alta',
        matches: mixed,
        totalOdds: Math.round(totalOdds * 100) / 100
      });
    }

    return NextResponse.json({ singlePredictions, bollette });

  } catch (error) {
    console.error("GET /api/pronostici error:", error);
    return NextResponse.json({ error: 'Errore nel recupero pronostici dal database' }, { status: 500 });
  }
}
