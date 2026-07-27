import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { fetchNewsForTeam } from '@/lib/news';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function shouldRunCron(): boolean {
  const italianTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  const hour = italianTime.getHours();
  // Runs only 7 AM - midnight (7:00 - 23:59)
  return hour >= 7 && hour < 24;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!shouldRunCron()) {
    return NextResponse.json({ 
      success: true, 
      message: 'Outside business hours (7 AM - midnight)', 
      timestamp: new Date().toISOString() 
    });
  }

  if (!process.env.POSTGRES_URL) {
    console.warn('[CRON NEWS] POSTGRES_URL mancante.');
    return NextResponse.json({ success: true, message: 'Database non configurato' });
  }

  try {
    console.log('[CRON NEWS] Inizio fetch news per tutti i team...');
    
    // Crea tabella se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS news_cache (
        id SERIAL PRIMARY KEY,
        team_id VARCHAR(50) NOT NULL UNIQUE,
        news_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at_updated TIMESTAMP
      );
    `;

    const SERIE_A_TEAMS = [
      'Juventus', 'Inter', 'AC Milan', 'AS Roma', 'Napoli',
      'Fiorentina', 'Lazio', 'Atalanta', 'Torino', 'Sassuolo',
      'Bologna', 'Hellas Verona', 'Sampdoria', 'Monza', 'Udinese',
      'Salernitana', 'Frosinone', 'Genoa', 'Como', 'Lecce'
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const team of SERIE_A_TEAMS) {
      try {
        // Fetch notizie per il team
        const newsItems = await fetchNewsForTeam(team, 'A');
        
        if (newsItems && newsItems.length > 0) {
          // Salva in cache
          await sql`
            INSERT INTO news_cache (team_id, news_json, updated_at_updated)
            VALUES (${team.toLowerCase()}, ${JSON.stringify(newsItems)}, CURRENT_TIMESTAMP)
            ON CONFLICT (team_id) DO UPDATE SET
              news_json = EXCLUDED.news_json,
              updated_at_updated = CURRENT_TIMESTAMP
          `;
          successCount++;
        }
      } catch (err) {
        console.error(`Error fetching news for ${team}:`, err);
        errorCount++;
      }
    }

    console.log(`[CRON NEWS] Completato. Success: ${successCount}, Errors: ${errorCount}`);

    return NextResponse.json({ 
      success: true, 
      message: `News cached for ${successCount} teams`,
      successCount,
      errorCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('News cron error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
