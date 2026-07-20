/**
 * GET /api/cron/pronostici
 *
 * Genera pronostici AI per i 4 match di cartello dei prossimi 3 giorni.
 * Usa DB cache (daily_ai_predictions) — non rigenera match già analizzati.
 *
 * Ottimizzazioni token:
 * - Prompt ridotto da ~350 a ~90 parole (risparmio ~73%)
 * - Analisi limitata a MAX 250 caratteri
 * - Top 4 match selezionati per priorità lega (CL > SA > PL > PD > BL1)
 * - SDK centralizzato da lib/gemini.ts
 */
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { generateJSON } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Priorità competizioni per selezione "top match"
const COMPETITION_PRIORITY: Record<string, number> = {
  'UEFA Champions League': 1,
  'UEFA Europa League': 2,
  'Serie A': 3,
  'Premier League': 4,
  'La Liga': 5,
  'Bundesliga': 6,
  'Ligue 1': 7,
};

interface GeminiPrediction {
  q: Array<{ t: string; p: string; o: number }>;
  a: string;
}

async function generatePrediction(matchStr: string, competition: string): Promise<GeminiPrediction | null> {
  // Prompt ottimizzato: ~90 parole invece di ~350, output JSON compatto
  const prompt = `Sei un esperto analista calcistico.
Analizza: ${matchStr} (${competition}).
IMPORTANTE: basati solo su dati reali e probabilità concrete. Non inventare statistiche.

Rispondi SOLO con questo JSON (nessun testo aggiuntivo):
{"q":[
  {"t":"1X2","p":"1 o X o 2","o":1.85},
  {"t":"O/U 2.5","p":"Over 2.5 o Under 2.5","o":1.90},
  {"t":"GG/NG","p":"GG o NG","o":1.75},
  {"t":"Esatto","p":"es. 2-1","o":8.50},
  {"t":"Multigol","p":"es. 2-4","o":1.50},
  {"t":"1° Tempo","p":"1 o X o 2","o":2.10}
],
"a":"MAX 250 CARATTERI: analisi tattica essenziale in italiano."}`;

  return generateJSON<GeminiPrediction>(prompt);
}

export async function GET(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fascia oraria: solo 07:00-23:59 ora italiana (UTC+2)
    const hourUTC = new Date().getUTCHours();
    const hourIT = (hourUTC + 2) % 24;
    if (hourIT < 7) {
      return NextResponse.json({ success: true, message: 'Fuori fascia oraria (07-24 IT), skip' });
    }

    const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    if (!FOOTBALL_API_KEY) {
      throw new Error('Manca FOOTBALL_DATA_API_KEY');
    }

    // Fetch partite prossimi 3 giorni da 5 competizioni principali
    const today = new Date();
    const threeDays = new Date();
    threeDays.setDate(today.getDate() + 3);
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = threeDays.toISOString().split('T')[0];

    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&competitions=SA,PL,PD,BL1,CL,EL`,
      {
        headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Errore API Football-Data: ${response.status}`);
    }

    const data = await response.json();
    let matches: any[] = data.matches || [];

    // Ordina per priorità lega e prendi i top 4 di cartello
    matches = matches
      .filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED')
      .sort((a: any, b: any) => {
        const pA = COMPETITION_PRIORITY[a.competition?.name] ?? 99;
        const pB = COMPETITION_PRIORITY[b.competition?.name] ?? 99;
        return pA - pB;
      })
      .slice(0, 4);

    if (matches.length === 0) {
      return NextResponse.json({ success: true, message: 'Nessun match disponibile nei prossimi 3 giorni' });
    }

    let insertedCount = 0;

    for (const m of matches) {
      const matchId = m.id;
      const homeTeam = m.homeTeam.name;
      const awayTeam = m.awayTeam.name;
      const matchDate = m.utcDate;
      const competition = m.competition.name;
      const matchStr = `${homeTeam} vs ${awayTeam}`;

      // Check cache DB — non rigenerare se già esiste
      const { rows } = await sql`
        SELECT id FROM daily_ai_predictions WHERE match_id = ${matchId}
      `;

      if (rows.length > 0) {
        console.log(`[cron/pronostici] Cache hit: ${matchStr} — skip Gemini`);
        continue;
      }

      // Genera con Gemini
      const geminiData = await generatePrediction(matchStr, competition);

      if (geminiData && Array.isArray(geminiData.q) && geminiData.a) {
        // Mappa formato compatto -> formato DB
        const quotes = geminiData.q.map((q) => ({
          type: q.t,
          pick: q.p,
          odds: q.o,
        }));

        await sql`
          INSERT INTO daily_ai_predictions
            (match_id, home_team, away_team, match_date, competition, quotes, analysis)
          VALUES
            (${matchId}, ${homeTeam}, ${awayTeam}, ${matchDate}, ${competition},
             ${JSON.stringify(quotes)}, ${geminiData.a})
          ON CONFLICT (match_id) DO NOTHING
        `;
        insertedCount++;
        console.log(`[cron/pronostici] ✅ Inserito: ${matchStr}`);
      } else {
        // Salva fallback per evitare loop infiniti nei run successivi
        await sql`
          INSERT INTO daily_ai_predictions
            (match_id, home_team, away_team, match_date, competition, quotes, analysis)
          VALUES
            (${matchId}, ${homeTeam}, ${awayTeam}, ${matchDate}, ${competition},
             '[]', '<p>Analisi temporaneamente non disponibile.</p>')
          ON CONFLICT (match_id) DO NOTHING
        `;
        console.warn(`[cron/pronostici] ⚠️ Fallback per: ${matchStr}`);
      }
    }

    return NextResponse.json({ success: true, processed: matches.length, inserted: insertedCount });

  } catch (error: any) {
    console.error('[cron/pronostici] Errore:', error);
    return NextResponse.json({ error: 'Errore interno', details: error.message }, { status: 500 });
  }
}
