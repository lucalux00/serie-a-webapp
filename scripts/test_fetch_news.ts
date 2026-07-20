import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from '@vercel/postgres';
import { fetchAllNewsForCron } from '../src/lib/news';

async function run() {
  try {
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
          ${new Date(item.pubDate).toISOString()}, 
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
  } catch (error: any) {
    console.error('Cron Error:', error);
  }
}
run();
