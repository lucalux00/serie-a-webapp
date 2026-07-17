import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyJwt(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const matchday = searchParams.get('matchday');
    if (!matchday) return NextResponse.json({ error: 'Missing matchday' }, { status: 400 });

    const { rows } = await sql`
      SELECT id, player_name, team_name, role, position_type, bench_order
      FROM fanta_lineups
      WHERE user_id = ${String(payload.userId)} AND matchday = ${matchday}
      ORDER BY 
        CASE position_type WHEN 'titolare' THEN 1 ELSE 2 END,
        bench_order ASC
    `;
    
    return NextResponse.json({ lineup: rows });
  } catch (error) {
    console.error('Error fetching lineup:', error);
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
    const { matchday, lineup } = body;
    // lineup is an array of objects: { player_name, team_name, role, position_type, bench_order }

    if (!matchday || !lineup || !Array.isArray(lineup)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Check if matchday is active and not completed
    const matchdayCheck = await sql`SELECT is_active, is_completed FROM fanta_matchdays WHERE matchday = ${matchday}`;
    if (matchdayCheck.rows.length === 0 || matchdayCheck.rows[0].is_completed) {
      return NextResponse.json({ error: 'Matchday chiusa, impossibile modificare.' }, { status: 400 });
    }

    // Begin Transaction
    const client = await sql.connect();
    try {
        await client.sql`BEGIN`;
        
        // Delete existing lineup for this matchday
        await client.sql`DELETE FROM fanta_lineups WHERE user_id = ${String(payload.userId)} AND matchday = ${matchday}`;
        
        // Insert new lineup
        for (const player of lineup) {
            await client.sql`
                INSERT INTO fanta_lineups (user_id, matchday, player_name, team_name, role, position_type, bench_order)
                VALUES (${String(payload.userId)}, ${matchday}, ${player.player_name}, ${player.team_name}, ${player.role}, ${player.position_type}, ${player.bench_order || null})
            `;
        }
        
        await client.sql`COMMIT`;
    } catch (e) {
        await client.sql`ROLLBACK`;
        throw e;
    } finally {
        client.release();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving lineup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
