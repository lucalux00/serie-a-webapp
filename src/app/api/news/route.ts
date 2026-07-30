import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// Soglia: aggiorna le news se l'ultima inserita ha più di 30 minuti
// (evita loop di richieste e rispetta i rate limit dei feed RSS)
// The Hobby plan only permits a daily Vercel cron. Active visitors keep the
// feed fresh between scheduled runs, while the lock prevents a request storm.
const UPDATE_INTERVAL_MS = 15 * 60 * 1000;

function newsFingerprint(item: { clean_title?: string | null; title?: string | null }) {
  return (item.clean_title || item.title || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const team = searchParams.get('team');
    const includeRefreshStatus = searchParams.get('meta') === '1';
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // --- LAZY CRON LOGIC ---
    // Il cron Vercel gira ogni ora (0 * * * *), ma come fallback
    // triggeriamo anche l'aggiornamento pigro se sono passati 30 minuti.
    try {
      const { rows: latest } = await sql`
        SELECT created_at FROM cron_lock WHERE job_name = 'news_refresh' LIMIT 1
      `;
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
        const { rows: lockRows } = await sql`
          INSERT INTO cron_lock (job_name, created_at)
          VALUES ('news', NOW())
          ON CONFLICT (job_name) DO UPDATE SET created_at = NOW()
          WHERE cron_lock.created_at < NOW() - INTERVAL '5 minutes'
          RETURNING created_at
        `;

        if (lockRows.length > 0) {
        // Fire-and-forget con auth header corretto.
        // NOTA: passiamo il CRON_SECRET — senza di esso la cron route risponde 401.
        const cronUrl = new URL('/api/cron/news', request.url).toString();
        const cronSecret = process.env.CRON_SECRET;
        fetch(cronUrl, {
          method: 'GET',
          headers: cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {},
        }).catch(e => console.error('[lazy-cron] Errore richiesta news:', e));
        }
      }
    } catch (lazyError) {
      // Non blocca la risposta principale
      console.warn('[lazy-cron] Check fallito:', lazyError);
    }
    // --- END LAZY CRON ---

    const requestedLimit = Math.min(Math.max(limit, 1), 100);
    // Deduplication happens after the database query, so fetch a buffer first.
    const queryLimit = Math.min(requestedLimit * 4, 200);
    let query;
    const teamFilter = team ? `%${team}%` : null;

    if (type && status && team) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type} AND status = ${status} AND (title ILIKE ${teamFilter} OR snippet ILIKE ${teamFilter})
        ORDER BY pub_date DESC 
        LIMIT ${queryLimit} OFFSET ${offset}
      `;
    } else if (type && status) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type} AND status = ${status}
        ORDER BY pub_date DESC 
        LIMIT ${queryLimit} OFFSET ${offset}
      `;
    } else if (type && team) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type} AND (title ILIKE ${teamFilter} OR snippet ILIKE ${teamFilter})
        ORDER BY pub_date DESC 
        LIMIT ${queryLimit} OFFSET ${offset}
      `;
    } else if (type) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type}
        ORDER BY pub_date DESC 
        LIMIT ${queryLimit} OFFSET ${offset}
      `;
    } else if (team) {
      query = sql`
        SELECT * FROM news 
        WHERE (title ILIKE ${teamFilter} OR snippet ILIKE ${teamFilter})
        ORDER BY pub_date DESC 
        LIMIT ${queryLimit} OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT * FROM news 
        ORDER BY pub_date DESC 
        LIMIT ${queryLimit} OFFSET ${offset}
      `;
    }

    const { rows } = await query;
    // Le fonti possono pubblicare lo stesso lancio con URL diversi: il database
    // deduplica per link, mentre l'interfaccia deve mostrare una sola pillola.
    const seenNews = new Set<string>();
    const uniqueRows = rows.filter((item) => {
      const fingerprint = newsFingerprint(item);
      if (!fingerprint || seenNews.has(fingerprint)) return false;
      seenNews.add(fingerprint);
      return true;
    }).slice(0, requestedLimit);

    if (includeRefreshStatus) {
      const { rows: refreshRows } = await sql`
        SELECT created_at FROM cron_lock WHERE job_name = 'news_refresh' LIMIT 1
      `;
      return NextResponse.json({ items: uniqueRows, refreshedAt: refreshRows[0]?.created_at || null });
    }

    return NextResponse.json(uniqueRows);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
