import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'A';
  
  try {
    // Legge i trasferimenti direttamente dal DB invece di fare scraping in tempo reale
    const { rows: transfers } = await sql`
      SELECT 
        id, 
        'A' as league, 
        status, 
        type, 
        (SELECT name FROM teams WHERE id = t.team_id) as team, 
        player, 
        other_team as "fromTo", 
        fee, 
        date
      FROM transfers t
      ORDER BY id DESC
      LIMIT 50
    `;

    // Se non ci sono dati, ritorna array vuoto
    return NextResponse.json({ transfers: transfers || [] });

    return NextResponse.json({ transfers });

  } catch (error: any) {
    console.error("Live Mercato DB Error:", error.message);
    return NextResponse.json({ transfers: [] });
  }
}
