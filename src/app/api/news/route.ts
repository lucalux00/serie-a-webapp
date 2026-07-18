import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

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
    // Poiché Vercel Hobby non permette cron ogni 5 minuti, aggiorniamo "pigramente" 
    // se non ci sono nuove notizie da più di 5 minuti.
    try {
      const { rows: latest } = await sql`SELECT created_at FROM news ORDER BY created_at DESC LIMIT 1`;
      let shouldUpdate = false;
      
      if (latest.length === 0) {
        shouldUpdate = true;
      } else {
        const lastDate = new Date(latest[0].created_at).getTime();
        const now = Date.now();
        if (now - lastDate > 5 * 60 * 1000) { // 5 minuti
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        // Avviamo l'aggiornamento in background senza bloccare la risposta
        // (Next.js Edge/Serverless lo esegue "best-effort")
        fetch(new URL('/api/cron/news', request.url).toString()).catch(e => console.error("Lazy cron error", e));
      }
    } catch (lazyError) {
      console.warn("Lazy cron check failed", lazyError);
    }
    // --- END LAZY CRON ---

    let query;
    let teamFilter = team ? `%${team}%` : null;

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
