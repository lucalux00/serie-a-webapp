import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// Soglia: aggiorna le news se l'ultima inserita ha più di 30 minuti
// (evita loop di richieste e rispetta i rate limit dei feed RSS)
const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30 minuti

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const team = searchParams.get('team');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // --- LAZY CRON LOGIC ---
    // Il cron Vercel gira ogni ora (0 * * * *), ma come fallback
    // triggeriamo anche l'aggiornamento pigro se sono passati 30 minuti.
    try {
      const { rows: latest } = await sql`SELECT created_at FROM news ORDER BY created_at DESC LIMIT 1`;
      let shouldUpdate = false;

      if (latest.length === 0) {
        shouldUpdate = true;
      } else {
        const lastDate = new Date(latest[0].created_at).getTime();
        const now = Date.now();
        if (now - lastDate > UPDATE_INTERVAL_MS) {
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        // Fire-and-forget con auth header corretto.
        // NOTA: passiamo il CRON_SECRET — senza di esso la cron route risponde 401.
        const cronUrl = new URL('/api/cron/news', request.url).toString();
        const cronSecret = process.env.CRON_SECRET;
        fetch(cronUrl, {
          method: 'GET',
          headers: cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {},
        }).catch(e => console.error('[lazy-cron] Errore richiesta news:', e));
      }
    } catch (lazyError) {
      // Non blocca la risposta principale
      console.warn('[lazy-cron] Check fallito:', lazyError);
    }
    // --- END LAZY CRON ---

    let query;
    const teamFilter = team ? `%${team}%` : null;

    if (type && status && team) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type} AND status = ${status} AND (title ILIKE ${teamFilter} OR snippet ILIKE ${teamFilter})
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type && status) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type} AND status = ${status}
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type && team) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type} AND (title ILIKE ${teamFilter} OR snippet ILIKE ${teamFilter})
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type}
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (team) {
      query = sql`
        SELECT * FROM news 
        WHERE (title ILIKE ${teamFilter} OR snippet ILIKE ${teamFilter})
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT * FROM news 
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const { rows } = await query;

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
