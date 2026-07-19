import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // --- LAZY CRON LOGIC ---
    // Avviamo l'aggiornamento in background senza bloccare la risposta
    // (Next.js Edge/Serverless lo esegue "best-effort")
    try {
      const { rows: latest } = await sql`SELECT match_date FROM daily_ai_predictions ORDER BY match_date DESC LIMIT 1`;
      let shouldUpdate = false;
      
      if (latest.length === 0) {
        shouldUpdate = true;
      } else {
        const lastDate = new Date(latest[0].match_date).getTime();
        const now = Date.now();
        // Se non abbiamo partite future nel db, potremmo dover aggiornare.
        if (lastDate < now) { 
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        // Usa request.url come base per la chiamata al cron
        fetch(new URL('/api/cron/pronostici', request.url).toString()).catch(e => console.error("Lazy cron error", e));
      }
    } catch (lazyError) {
      console.warn("Lazy cron check failed", lazyError);
    }
    // --- END LAZY CRON ---

    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const dateFrom = today.toISOString().split('T')[0];
    // Per Postgres usiamo ISO string con date filtering
    
    const { rows } = await sql`
      SELECT match_id as id, 
             home_team || ' - ' || away_team as match, 
             competition, 
             match_date as date, 
             quotes, 
             analysis 
      FROM daily_ai_predictions 
      WHERE match_date >= NOW() AND match_date <= NOW() + INTERVAL '3 days'
      ORDER BY match_date ASC
      LIMIT 10
    `;

    return NextResponse.json({ predictions: rows });

  } catch (error) {
    console.error("GET /api/pronostici/odierni error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
