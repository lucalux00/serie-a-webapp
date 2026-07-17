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

    // Retrieve the user's lineup for this matchday
    const lineupRes = await sql`
      SELECT player_name, role, position_type, bench_order
      FROM fanta_lineups
      WHERE user_id = ${String(payload.userId)} AND matchday = ${matchday}
    `;

    // Retrieve votes for these players
    const votesRes = await sql`
      SELECT player_name, base_vote, bonus_malus, final_vote, is_manual_override
      FROM fanta_player_votes
      WHERE user_id = ${String(payload.userId)} AND matchday = ${matchday}
    `;

    // Map votes to lineup
    const lineupWithVotes = lineupRes.rows.map(player => {
        const voteRecord = votesRes.rows.find(v => v.player_name === player.player_name);
        return {
            ...player,
            base_vote: voteRecord ? voteRecord.base_vote : null,
            bonus_malus: voteRecord ? voteRecord.bonus_malus : null,
            final_vote: voteRecord ? voteRecord.final_vote : null,
            is_manual_override: voteRecord ? voteRecord.is_manual_override : false
        };
    });

    return NextResponse.json({ lineup: lineupWithVotes });
  } catch (error) {
    console.error('Error fetching votes:', error);
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
    const { matchday, player_name, base_vote, bonus_malus, final_vote } = body;

    if (!matchday || !player_name) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await sql`
      INSERT INTO fanta_player_votes (user_id, matchday, player_name, base_vote, bonus_malus, final_vote, is_manual_override)
      VALUES (${String(payload.userId)}, ${matchday}, ${player_name}, ${base_vote}, ${bonus_malus}, ${final_vote}, true)
      ON CONFLICT (user_id, matchday, player_name) DO UPDATE SET
        base_vote = EXCLUDED.base_vote,
        bonus_malus = EXCLUDED.bonus_malus,
        final_vote = EXCLUDED.final_vote,
        is_manual_override = true
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving custom vote:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
