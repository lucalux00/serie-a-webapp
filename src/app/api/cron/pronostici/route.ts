import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateGeminiPrediction(matchStr: string, competition: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  
  const prompt = `Sei un esperto analista di calcio, bookmaker e scienziato dei dati.
Analizza la seguente partita: ${matchStr} (${competition}).

REGOLA FONDAMENTALE: Non inventare MAI statistiche, infortuni o eventi inesistenti. Basati SOLO su dati reali e probabilità matematiche legate allo stato di forma noto delle squadre.

Genera un JSON rigoroso con esattamente questa struttura:
{
  "quotes": [
    { "type": "Esito Finale (1X2)", "pick": "1, X o 2", "odds": 1.85 },
    { "type": "Under/Over 2.5", "pick": "Over 2.5 o Under 2.5", "odds": 1.90 },
    { "type": "Goal/No Goal", "pick": "Goal o No Goal", "odds": 1.75 },
    { "type": "Risultato Esatto", "pick": "es. 2-1", "odds": 8.50 },
    { "type": "Multigol", "pick": "es. 2-4", "odds": 1.50 },
    { "type": "Primo Tempo", "pick": "1, X o 2", "odds": 2.10 }
  ],
  "analysis": "Testo HTML dell'analisi. Spiega in modo dettagliato, tecnico ed entusiasmante il perché di queste scelte, usando i paragrafi <p> e liste <ul> se necessario. Includi informazioni tattiche e di forma REALI."
}
Rendi le quote (odds) realistiche e scrivi un'analisi corposa e professionale in italiano.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Non c'è più bisogno di pulire il JSON dai backtick perché responseMimeType garantisce un JSON valido.
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error("Gemini Error during cron generation:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    if (!FOOTBALL_API_KEY) throw new Error("Manca FOOTBALL_DATA_API_KEY");

    // Prendi le partite da oggi a +3 giorni
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = threeDaysFromNow.toISOString().split('T')[0];

    // Competitions: SA (Serie A), PL (Premier League), PD (La Liga), BL1 (Bundesliga), CL (Champions)
    const response = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&competitions=SA,PL,PD,BL1,CL`, {
      headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error("Errore API Football-Data");
    }

    const data = await response.json();
    let matches = data.matches || [];

    // Limitiamo a massimo 4 partite per non sovraccaricare Gemini o l'API in un singolo run
    matches = matches.slice(0, 4);

    if (matches.length === 0) {
      return NextResponse.json({ message: 'No matches to process' });
    }

    let insertedCount = 0;

    for (const m of matches) {
      const matchId = m.id;
      const homeTeam = m.homeTeam.name;
      const awayTeam = m.awayTeam.name;
      const matchDate = m.utcDate;
      const competition = m.competition.name;
      const matchStr = `${homeTeam} - ${awayTeam}`;

      // 1. Controlla Cache DB per vedere se l'abbiamo già calcolata
      const { rows } = await sql`SELECT id FROM daily_ai_predictions WHERE match_id = ${matchId}`;
      
      if (rows.length === 0) {
        // 2. Genera con Gemini
        const geminiData = await generateGeminiPrediction(matchStr, competition);
        
        if (geminiData && geminiData.quotes && geminiData.analysis) {
          // 3. Salva in DB
          await sql`
            INSERT INTO daily_ai_predictions (match_id, home_team, away_team, match_date, competition, quotes, analysis)
            VALUES (${matchId}, ${homeTeam}, ${awayTeam}, ${matchDate}, ${competition}, ${JSON.stringify(geminiData.quotes)}, ${geminiData.analysis})
            ON CONFLICT (match_id) DO NOTHING
          `;
          insertedCount++;
        } else {
          // Salva uno stato di fallimento per evitare loop infiniti nei prossimi run
          await sql`
            INSERT INTO daily_ai_predictions (match_id, home_team, away_team, match_date, competition, quotes, analysis)
            VALUES (${matchId}, ${homeTeam}, ${awayTeam}, ${matchDate}, ${competition}, '[]', '<p>Analisi non disponibile o generazione fallita.</p>')
            ON CONFLICT (match_id) DO NOTHING
          `;
        }
      }
    }

    return NextResponse.json({ success: true, inserted: insertedCount });

  } catch (error) {
    console.error("GET /api/cron/pronostici error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
