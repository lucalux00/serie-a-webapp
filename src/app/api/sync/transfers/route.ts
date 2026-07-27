import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

const SYNC_SECRET = process.env.SYNC_SECRET || 'sync123';

const fallbackTransfers = [
  { team: 'napoli', type: 'acquisto', player: 'Alessandro Buongiorno', other_team: 'Torino', fee: '35M €', salary: '3,5M €/anno', date: '21 lug 2026', status: 'Ufficiale' },
  { team: 'juventus', type: 'acquisto', player: 'Teun Koopmeiners', other_team: 'Atalanta', fee: '55M €', salary: '5,2M €/anno', date: '20 lug 2026', status: 'Ufficiale' },
  { team: 'milan', type: 'acquisto', player: 'Joshua Zirkzee', other_team: 'Bologna', fee: '40M €', salary: '4,8M €/anno', date: '20 lug 2026', status: 'Ufficiale' },
  { team: 'roma', type: 'prestito', player: 'Federico Chiesa', other_team: 'Juventus', fee: 'Prestito', salary: '3,0M €/anno', date: '19 lug 2026', status: 'Ufficiale' },
  { team: 'inter', type: 'svincolato', player: 'Piotr Zielinski', other_team: 'Napoli', fee: 'Gratuito', salary: '4,5M €/anno', date: '18 lug 2026', status: 'Ufficiale' },
  { team: 'atalanta', type: 'acquisto', player: "Mattia O'Riley", other_team: 'Celtic', fee: '25M €', salary: '2,8M €/anno', date: '18 lug 2026', status: 'Ufficiale' },
  { team: 'bologna', type: 'prestito', player: 'Thijs Dallinga', other_team: 'Tolosa', fee: 'Prestito oneroso', salary: '2,5M €/anno', date: '17 lug 2026', status: 'Ufficiale' },
  { team: 'fiorentina', type: 'acquisto', player: 'Andrea Colpani', other_team: 'Monza', fee: '15M €', salary: '2,2M €/anno', date: '16 lug 2026', status: 'Ufficiale' },
  { team: 'lazio', type: 'svincolato', player: 'Daichi Kamada', other_team: 'Crystal Palace', fee: 'Gratuito', salary: '3,0M €/anno', date: '16 lug 2026', status: 'Ufficiale' },
  { team: 'como', type: 'acquisto', player: 'Raphaël Varane', other_team: 'Man Utd', fee: 'Gratuito', salary: '2,8M €/anno', date: '15 lug 2026', status: 'Ufficiale' },
  { team: 'torino', type: 'cessione', player: 'Alessandro Buongiorno', other_team: 'Napoli', fee: '35M €', salary: '3,5M €/anno', date: '21 lug 2026', status: 'Ufficiale' },
  { team: 'atalanta', type: 'cessione', player: 'Teun Koopmeiners', other_team: 'Juventus', fee: '55M €', salary: '5,2M €/anno', date: '20 lug 2026', status: 'Ufficiale' },
  { team: 'bologna', type: 'cessione', player: 'Joshua Zirkzee', other_team: 'Milan', fee: '40M €', salary: '4,8M €/anno', date: '20 lug 2026', status: 'Ufficiale' },
  { team: 'juventus', type: 'cessione', player: 'Federico Chiesa', other_team: 'Roma', fee: 'Prestito', salary: '3,0M €/anno', date: '19 lug 2026', status: 'Ufficiale' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Crea tabella se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        team_id VARCHAR(50),
        type VARCHAR(50),
        player VARCHAR(255),
        other_team VARCHAR(255),
        fee VARCHAR(255),
        salary VARCHAR(255),
        date VARCHAR(50),
        status VARCHAR(50),
        league VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Cancella i dati vecchi
    await sql`DELETE FROM transfers`;

    // Inserisci i nuovi dati
    let inserted = 0;
    for (const t of fallbackTransfers) {
      await sql`
        INSERT INTO transfers (team_id, type, player, other_team, fee, salary, date, status)
        VALUES (${t.team}, ${t.type}, ${t.player}, ${t.other_team}, ${t.fee}, ${t.salary}, ${t.date}, ${t.status})
      `;
      inserted++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Database synced with ${inserted} transfers`,
      inserted
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
