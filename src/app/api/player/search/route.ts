import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ALL_TEAMS } from '@/data/teams';

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
      SELECT name, position as role, team_id as team 
      FROM players 
      WHERE name ILIKE ${searchTerm} 
        AND (is_coach IS NOT TRUE)
        AND (is_staff IS NOT TRUE)
      ORDER BY name ASC
      LIMIT 10
    `;
    
    const formattedRows = rows.map(r => ({
      ...r,
      team: ALL_TEAMS.find(t => t.id === r.team)?.name || r.team
    }));
    
    return NextResponse.json({ results: formattedRows });
  } catch (error) {
    console.error('Player search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
