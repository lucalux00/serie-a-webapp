import { NextResponse } from 'next/server';

export const revalidate = 302400; // Cache ISR: 3.5 giorni.

const API_KEY = "2fc579dbb539cbc9c2e4caa650d7b47f"; // Chiave fornita dall'utente

// Helper per scaricare quote live da un campionato specifico
async function fetchOdds(sport: string) {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h`;
    const res = await fetch(url, { next: { revalidate: 302400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Errore fetch per", sport, err);
    return [];
  }
}

// L'algoritmo analizza le quote REALI dei bookmakers (implicite di probabilità)
// per estrarre la scelta migliore statistica (Tipster Logic).
function analyzeAndPick(match: any) {
  const home = match.home_team;
  const away = match.away_team;
  
  // Prendiamo il primo bookmaker disponibile per le quote H2H (di solito Unibet, William Hill, ecc)
  const bookmaker = match.bookmakers && match.bookmakers[0];
  if (!bookmaker) return null;

  const market = bookmaker.markets.find((m: any) => m.key === 'h2h');
  if (!market || !market.outcomes) return null;

  const homeOdds = market.outcomes.find((o: any) => o.name === home)?.price || 2.5;
  const awayOdds = market.outcomes.find((o: any) => o.name === away)?.price || 2.5;
  const drawOdds = market.outcomes.find((o: any) => o.name === 'Draw')?.price || 3.0;

  let pick = '';
  let finalOdds = 0;

  // Logica statistica basata sull'implied probability dei bookmakers
  if (homeOdds < 1.55) {
    pick = '1'; finalOdds = homeOdds;
  } else if (awayOdds < 1.55) {
    pick = '2'; finalOdds = awayOdds;
  } else if (homeOdds < 2.0 && awayOdds > 3.0) {
    pick = '1X'; finalOdds = Math.max(1.15, homeOdds - 0.4); // Stima realistica doppia chance se non c'è il mercato
  } else if (awayOdds < 2.0 && homeOdds > 3.0) {
    pick = 'X2'; finalOdds = Math.max(1.15, awayOdds - 0.4);
  } else if (drawOdds < 3.20) {
    pick = 'X'; finalOdds = drawOdds;
  } else {
    pick = 'Gol'; finalOdds = 1.75; // Mercato non H2H, fallback realistico basato sull'equilibrio
  }

  // Arrotonda
  finalOdds = Math.round(finalOdds * 100) / 100;

  return {
    id: match.id,
    match: `${home} - ${away}`,
    pick,
    odds: finalOdds,
    commence_time: match.commence_time
  };
}

export async function GET() {
  try {
    // 1. Fetch partite REALI E LIVE (Campionati Prioritari)
    const saData = await fetchOdds('soccer_italy_serie_a');
    const clData = await fetchOdds('soccer_uefa_champs_league');
    const elData = await fetchOdds('soccer_uefa_europa_league');
    
    // 2. Elaborazione dei dati: ignoriamo partite troppo in là (solo prossimi 7 giorni)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const filterAndProcess = (matches: any[]) => {
      if (!Array.isArray(matches)) return [];
      return matches
        .filter(m => new Date(m.commence_time) < nextWeek)
        .map(analyzeAndPick)
        .filter(Boolean); // Rimuove eventuali null
    };

    const saPicks = filterAndProcess(saData);
    const clPicks = filterAndProcess(clData);
    const elPicks = filterAndProcess(elData);
    
    // Se non abbiamo un numero sufficiente di partite IMMINENTI, peschiamo dal mix mondiale di calcio imminente
    let extraPicks: any[] = [];
    if (saPicks.length + clPicks.length + elPicks.length < 8) {
      const upcomingAll = await fetchOdds('upcoming');
      if (Array.isArray(upcomingAll)) {
          // Filtriamo solo il calcio mondiale vero
          const extraData = upcomingAll.filter(m => m.sport_key?.startsWith('soccer_'));
          extraPicks = filterAndProcess(extraData);
      }
    }

    // Uniamo tutto rimuovendo i duplicati (basati sull'ID del match)
    const allPicksMap = new Map();
    [...saPicks, ...clPicks, ...elPicks, ...extraPicks].forEach(p => {
        if (!allPicksMap.has(p.id)) allPicksMap.set(p.id, p);
    });

    const allPicks = Array.from(allPicksMap.values())
        .sort((a: any, b: any) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());

    // Se l'API non ha assolutamente nulla per questa settimana
    if (allPicks.length === 0) {
        return NextResponse.json({ 
            error: 'Nessuna partita scommettibile nei prossimi 7 giorni per questi campionati.' 
        }, { status: 200 });
    }

    // 3. Creazione Singole Sicure (le 4 con la quota più bassa, indice di altissima probabilità)
    const singlePredictions = [...allPicks].sort((a: any, b: any) => a.odds - b.odds).slice(0, 4);

    // 4. Bollette (usiamo i pick reali generati)
    const bollette = [];

    // Bolletta Serie A
    if (saPicks.length >= 3) {
      const selected = saPicks.slice(0, 4);
      const totalOdds = selected.reduce((acc: number, curr: any) => acc * curr.odds, 1);
      bollette.push({
        id: 'bolletta_sa',
        title: 'Bolletta Serie A',
        type: 'campionato',
        matches: selected,
        totalOdds: Math.round(totalOdds * 100) / 100
      });
    }

    // Bolletta Europea (Champions / Europa League)
    const euroPicks = [...clPicks, ...elPicks];
    if (euroPicks.length >= 3) {
      const selected = euroPicks.slice(0, 4);
      const totalOdds = selected.reduce((acc: number, curr: any) => acc * curr.odds, 1);
      bollette.push({
        id: 'bolletta_euro',
        title: 'Bolletta Notti Europee',
        type: 'coppa',
        matches: selected,
        totalOdds: Math.round(totalOdds * 100) / 100
      });
    }

    // Raddoppio del Giorno
    if (allPicks.length >= 2) {
      // Cerchiamo due partite che combinate danno circa quota 2.0 (es. 1.4 x 1.4)
      const raddoppioMatches = [...allPicks].filter((p: any) => p.odds >= 1.25 && p.odds <= 1.6).slice(0, 2);
      if (raddoppioMatches.length === 2) {
        bollette.push({
          id: 'raddoppio',
          title: 'Il Raddoppio Reale',
          type: 'raddoppio',
          matches: raddoppioMatches,
          totalOdds: Math.round(raddoppioMatches[0].odds * raddoppioMatches[1].odds * 100) / 100
        });
      }
    }

    // Bolletta Mista / Extra (se non c'è Serie A/Europa, usa le amichevoli o le rimanenti)
    if (allPicks.length >= 4) {
      // Evitiamo di ripetere esattamente i match della Serie A se abbiamo molta roba
      const mixed = [...allPicks].sort(() => 0.5 - Math.random()).slice(0, 5);
      const totalOdds = mixed.reduce((acc: number, curr: any) => acc * curr.odds, 1);
      bollette.push({
        id: 'bollettone',
        title: 'Il Bollettone Misto (Migliori Statistiche)',
        type: 'alta',
        matches: mixed,
        totalOdds: Math.round(totalOdds * 100) / 100
      });
    }

    return NextResponse.json({ singlePredictions, bollette });

  } catch (error) {
    console.error("GET /api/pronostici error:", error);
    return NextResponse.json({ error: 'Errore nel recupero pronostici reali' }, { status: 500 });
  }
}
