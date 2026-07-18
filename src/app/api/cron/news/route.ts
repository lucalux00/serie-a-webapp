import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { fetchAllNewsForCron } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cron: Avvio fetch delle notizie...');
    const newsItems = await fetchAllNewsForCron();
    console.log(`Cron: Trovate ${newsItems.length} notizie dopo deduplicazione.`);

    let inserted = 0;
    for (const item of newsItems) {
      const res = await sql`
        INSERT INTO news (title, link, pub_date, source, clean_title, time, snippet, type, status)
        VALUES (
          ${item.title}, 
          ${item.link}, 
          ${new Date(item.pubDate)}, 
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
      if ((res.rowCount ?? 0) > 0) {
        inserted++;
      }
    }

    console.log(`Cron: Inserite ${inserted} nuove notizie nel DB.`);

    return NextResponse.json({
      success: true,
      message: 'News fetch and update completed',
      fetched: newsItems.length,
      inserted
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: 'Failed to fetch news', details: error.message }, { status: 500 });
  }
}
