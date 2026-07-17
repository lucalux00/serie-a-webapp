import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchTerm = `%${q}%`;
    const { rows } = await sql`
      SELECT name, role, team_id as team 
      FROM players 
      WHERE name ILIKE ${searchTerm} 
        AND is_coach = false 
        AND is_staff = false
      ORDER BY name ASC
      LIMIT 10
    `;
    
    return NextResponse.json({ results: rows });
  } catch (error) {
    console.error('Player search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
