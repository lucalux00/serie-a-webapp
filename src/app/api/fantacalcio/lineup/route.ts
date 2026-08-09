import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { canonicalRole } from '@/lib/fantaRoster';
import { getSerieAContext } from '@/lib/fantaData';

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
    
    return NextResponse.json({ lineup: rows.map((row) => ({ ...row, role: canonicalRole(row.player_name, row.team_name) || 'N/D', roleVerified: Boolean(canonicalRole(row.player_name, row.team_name)) })) });
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
    const normalizedLineup = lineup.map((player) => ({ ...player, role: canonicalRole(player.player_name, player.team_name || '') }));
    if (normalizedLineup.some((player) => !player.role)) {
      return NextResponse.json({ error: 'Uno o più giocatori non hanno un ruolo verificato.' }, { status: 422 });
    }

    const starters = normalizedLineup.filter((player) => player.position_type === 'titolare');
    const bench = normalizedLineup.filter((player) => player.position_type === 'panchina');
    const uniquePlayers = new Set(normalizedLineup.map((player) => String(player.player_name).trim().toLocaleLowerCase('it')));
    if (starters.length !== 11 || bench.length > 7 || uniquePlayers.size !== normalizedLineup.length) {
      return NextResponse.json({ error: 'Formazione non valida: servono 11 titolari, massimo 7 riserve e nessun duplicato.' }, { status: 422 });
    }
    const roleCounts = starters.reduce<Record<string, number>>((counts, player) => {
      counts[player.role] = (counts[player.role] || 0) + 1;
      return counts;
    }, {});
    const validFormation = roleCounts.POR === 1 && roleCounts.DIF >= 3 && roleCounts.DIF <= 5 && roleCounts.CEN >= 3 && roleCounts.CEN <= 5 && roleCounts.ATT >= 1 && roleCounts.ATT <= 3;
    if (!validFormation) {
      return NextResponse.json({ error: 'Modulo non valido: 1 POR, 3-5 DIF, 3-5 CEN e 1-3 ATT.' }, { status: 422 });
    }

    const [matchdayCheck, context] = await Promise.all([
      sql`SELECT is_active, is_completed FROM fanta_matchdays WHERE matchday = ${matchday}`,
      getSerieAContext(),
    ]);
    let canEdit = matchdayCheck.rows[0]?.is_active === true && matchdayCheck.rows[0]?.is_completed !== true;
    if (context.matches.length) {
      const currentMatches = context.matches.filter((item) => item.matchday === Number(matchday));
      const deadline = currentMatches.map((item) => new Date(item.utcDate).getTime()).filter(Number.isFinite).sort((left, right) => left - right)[0];
      canEdit = Number(matchday) === context.currentMatchday && Boolean(deadline && Date.now() < deadline);
    }
    if (!canEdit) {
      return NextResponse.json({ error: 'Matchday chiusa, impossibile modificare.' }, { status: 400 });
    }

    // Begin Transaction
    const client = await sql.connect();
    try {
        await client.sql`BEGIN`;
        
        // Delete existing lineup for this matchday
        await client.sql`DELETE FROM fanta_lineups WHERE user_id = ${String(payload.userId)} AND matchday = ${matchday}`;
        
        // Insert new lineup
        for (const player of normalizedLineup) {
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
