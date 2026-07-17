import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyJwt } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJwt(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { rows } = await sql`
      SELECT id, player_name as "playerName", team_name as "teamName", role
      FROM fanta_rosters
      WHERE user_id = ${payload.userId}
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json({ roster: rows });
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJwt(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, player_name, team_name, role, id } = body;

    if (action === 'add') {
      if (!player_name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
      
      const { rows } = await sql`
        INSERT INTO fanta_rosters (user_id, player_name, team_name, role)
        VALUES (${payload.userId}, ${player_name}, ${team_name || ''}, ${role || 'CEN'})
        ON CONFLICT (user_id, player_name) DO NOTHING
        RETURNING id, player_name as "playerName", team_name as "teamName", role
      `;
      return NextResponse.json({ player: rows[0] || null });
    } 
    else if (action === 'remove') {
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
      
      await sql`
        DELETE FROM fanta_rosters
        WHERE id = ${id} AND user_id = ${payload.userId}
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating roster:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
