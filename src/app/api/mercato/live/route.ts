import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'A';
  
  try {
    // Legge i trasferimenti direttamente dal DB invece di fare scraping in tempo reale
    // Filtro per la finestra di mercato attuale (Luglio 2026)
    const { rows: transfers } = await sql`
      SELECT 
        id, 
        'A' as league, 
        status, 
        type, 
        UPPER(SUBSTR(team_id, 1, 1)) || SUBSTR(team_id, 2) as team, 
        player, 
        other_team as "fromTo", 
        fee, 
        date
      FROM transfers t
      WHERE TO_DATE(date, 'DD Mon YYYY') >= TO_DATE('01 Jul 2026', 'DD Mon YYYY')
      ORDER BY id DESC
      LIMIT 100
    `;

    // Se non ci sono dati, ritorna array vuoto
    return NextResponse.json({ transfers: transfers || [] });

    return NextResponse.json({ transfers });

  } catch (error: any) {
    console.error("Live Mercato DB Error:", error.message);
    return NextResponse.json({ transfers: [] });
  }
}
