import { NextResponse } from 'next/server';
import { fetchNewsForTeam } from '@/lib/news';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  const league = searchParams.get('league') || 'A';

  if (!team) {
    return NextResponse.json({ error: 'Team is required' }, { status: 400 });
  }

  try {
    // Prova a leggere da cache (pre-fetchato dal cron ogni 3 ore)
    try {
      if (process.env.POSTGRES_URL) {
        const cached = await sql`
          SELECT news_json, updated_at_updated FROM news_cache 
          WHERE team_id = ${team.toLowerCase()}
          LIMIT 1
        `;
        
        if (cached.rows && cached.rows.length > 0) {
          const newsData = JSON.parse(cached.rows[0].news_json);
          console.log(`[API NEWS] Cache hit for ${team}`);
          return NextResponse.json(newsData);
        }
      }
    } catch (cacheErr) {
      console.warn(`[API NEWS] Cache read failed for ${team}:`, cacheErr);
      // Continua con fetch live
    }

    // Fallback: fetch live dai feed RSS se cache non disponibile
    console.log(`[API NEWS] Fetching live news for ${team}`);
    const news = await fetchNewsForTeam(team, league);
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
