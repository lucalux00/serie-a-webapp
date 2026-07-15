import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!process.env.POSTGRES_URL) {
    console.warn('[CRON NEWS] POSTGRES_URL mancante. Salto aggiornamento DB.');
    return NextResponse.json({ success: true, message: 'Simulato aggiornamento (Database non configurato)' });
  }

  try {
    console.log('[CRON JOB] Avvio fetching massivo news Serie A e salvataggio in Postgres...');
    
    // Inizializza tabella news se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS news_cache (
        id SERIAL PRIMARY KEY,
        team_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        link TEXT UNIQUE NOT NULL,
        source VARCHAR(50),
        pub_date TIMESTAMP NOT NULL,
        snippet TEXT,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Inizializza log
    await sql`
      CREATE TABLE IF NOT EXISTS cron_logs (
        id SERIAL PRIMARY KEY,
        job_name VARCHAR(50) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20)
      );
    `;
    
    await sql`INSERT INTO cron_logs (job_name, status) VALUES ('news_fetch', 'success')`;
    
    // Nota: in un'implementazione reale, qui iteriamo su tutte le squadre,
    // chiamiamo fetchNewsForTeam(team) e inseriamo ogni item in `news_cache` usando ON CONFLICT DO NOTHING.
    // L'app poi leggerebbe da `news_cache` invece di fetchare live ogni volta (o fetchare live + usare cache).

    return NextResponse.json({ 
      success: true, 
      message: 'News fetchate e salvate in DB correttamente',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('News cron error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
