import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  const league = searchParams.get('league') || 'A';

  try {
    let newsQuery;
    
    if (team) {
      // Filtra le news per squadra (ricerca case-insensitive nel titolo e snippet)
      const teamQuery = `%${team}%`;
      newsQuery = await sql`
        SELECT title, link, pub_date as "pubDate", source, clean_title as "cleanTitle", snippet
        FROM news
        WHERE title ILIKE ${teamQuery} OR snippet ILIKE ${teamQuery}
        ORDER BY created_at DESC
        LIMIT 20
      `;
    } else {
      // Se non c'è il team specificato, prendi le ultime 20 in generale
      newsQuery = await sql`
        SELECT title, link, pub_date as "pubDate", source, clean_title as "cleanTitle", snippet
        FROM news
        ORDER BY created_at DESC
        LIMIT 20
      `;
    }

    const { rows: news } = newsQuery;
    
    // Per avere lo stesso formato di prima aggiungiamo un time
    const formattedNews = news.map(n => {
      let timeStr = '';
      try {
        if (n.pubDate) {
          const date = new Date(n.pubDate);
          timeStr = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {}
      
      return {
        ...n,
        time: timeStr || 'Oggi'
      };
    });

    return NextResponse.json(formattedNews);

  } catch (error) {
    console.error('Error fetching news from DB:', error);
    // Ritorna array vuoto come fallback
    return NextResponse.json([], { status: 200 });
  }
}
