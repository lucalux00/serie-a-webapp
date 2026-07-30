import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';
import { fetchAllNewsForCron } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const isCronRequest = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    let isAdmin = false;
    if (!isCronRequest) {
      const user = await getUserFromCookie();
      const { rows: admins } = user
        ? await sql`SELECT email FROM users WHERE id = ${user.userId}`
        : { rows: [] as Array<{ email: string }> };
      isAdmin = ['lucapinelli0000@gmail.com', 'luca.pinelli0000@gmail.com'].includes(admins[0]?.email || '');
    }

    if (!isCronRequest && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cron: Avvio fetch delle notizie...');
    const newsItems = await fetchAllNewsForCron();
    console.log(`Cron: Trovate ${newsItems.length} notizie dopo deduplicazione.`);

    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS snippet TEXT`;

    let inserted = 0;
    let skipped = 0;
    for (const item of newsItems) {
      const publishedAt = new Date(item.pubDate);
      if (Number.isNaN(publishedAt.getTime())) {
        skipped++;
        console.warn('[news] Articolo ignorato: data non valida', item.link);
        continue;
      }
      try {
        const res = await sql`
        INSERT INTO news (title, link, pub_date, source, clean_title, time, snippet, type, status)
        VALUES (
          ${item.title}, 
          ${item.link}, 
          ${publishedAt.toISOString()},
          ${item.source}, 
          ${item.cleanTitle}, 
          ${item.time}, 
          ${item.snippet || null},
          'live',
          'published'
        )
        ON CONFLICT (link) DO NOTHING
        RETURNING id;
        `;
        if ((res.rowCount ?? 0) > 0) inserted++;
      } catch (itemError) {
        skipped++;
        console.error('[news] Articolo ignorato: errore di salvataggio', item.link, itemError);
      }
    }

    // Memorizza il controllo riuscito anche quando tutti gli articoli erano già presenti.
    try {
      await sql`
      INSERT INTO cron_lock (job_name, created_at)
      VALUES ('news_refresh', NOW())
      ON CONFLICT (job_name) DO UPDATE SET created_at = NOW()
      `;
    } catch (lockError) {
      console.error('[news] Impossibile aggiornare cron_lock', lockError);
    }

    console.log(`Cron: Inserite ${inserted} nuove notizie nel DB; ignorate ${skipped}.`);

    return NextResponse.json({
      success: true,
      message: 'News fetch and update completed',
      fetched: newsItems.length,
      inserted,
      skipped,
      refreshedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: 'Failed to fetch news', details: error.message }, { status: 500 });
  }
}
