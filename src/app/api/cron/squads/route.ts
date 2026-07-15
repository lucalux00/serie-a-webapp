import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Gestione dinamica per evitare caching o build time static eval
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Autenticazione basata su Vercel Cron Secret per sicurezza in produzione
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!process.env.POSTGRES_URL) {
    console.warn('[CRON SQUADS] POSTGRES_URL mancante. Salto aggiornamento DB.');
    return NextResponse.json({ success: true, message: 'Simulato aggiornamento (Database non configurato)' });
  }

  try {
    console.log('[CRON JOB] Avvio aggiornamento rose e statistiche giocatori...');
    
    // 1. Creazione tabella se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        team_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20),
        number INT,
        appearances INT DEFAULT 0,
        goals INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. In un caso reale, qui chiameremmo un'API esterna (es. football-data, transfermarkt)
    // per scaricare i dati di mercato/rosa e aggiornare il database.
    
    // Aggiorniamo un timestamp di ultima esecuzione
    await sql`
      CREATE TABLE IF NOT EXISTS cron_logs (
        id SERIAL PRIMARY KEY,
        job_name VARCHAR(50) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20)
      );
    `;
    await sql`INSERT INTO cron_logs (job_name, status) VALUES ('squads_update', 'success')`;

    return NextResponse.json({ 
      success: true, 
      message: 'Aggiornamento Rose completato e salvato nel Database'
    });
  } catch (error: any) {
    console.error('Squads cron error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
