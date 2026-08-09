import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import { verifyJwt } from '@/lib/auth';
import { findTeamFixtures, getSerieAContext } from '@/lib/fantaData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    const user = token ? await verifyJwt(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [{ rows: userRows }, { rows: roster }, context] = await Promise.all([
      sql`SELECT is_premium, to_jsonb(users)->>'premium_until' AS premium_until FROM users WHERE id = ${user.userId} LIMIT 1`,
      sql`SELECT DISTINCT team_name FROM fanta_rosters WHERE user_id = ${user.userId}`,
      getSerieAContext(),
    ]);
    const admin = ['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com'].includes((user.email ?? '').toLowerCase());
    const premiumUntil = userRows[0]?.premium_until ? new Date(userRows[0].premium_until) : null;
    if (!admin && !(userRows[0]?.is_premium === true && (!premiumUntil || premiumUntil > new Date()))) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

    const teams = roster.map((row) => String(row.team_name ?? '')).filter(Boolean);
    if (!teams.length) return NextResponse.json({ teams: [], fixtures: [], updatedAt: new Date().toISOString() });
    if (!context.sourceAvailable) return NextResponse.json({ teams, fixtures: [], unavailable: true, updatedAt: new Date().toISOString() });

    const fixtures = teams.flatMap((team) => findTeamFixtures(team, context, 5).map((fixture) => ({
      team,
      opponent: fixture.opponent,
      isHome: fixture.isHome,
      date: fixture.kickoff,
      matchday: fixture.matchday,
      difficulty: fixture.difficulty,
      difficultyPercent: fixture.difficultyPercent,
    })));
    return NextResponse.json({ teams, fixtures, source: context.calendarSource, strengthPeriod: context.strengthPeriod, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Planner error:', error);
    return NextResponse.json({ error: 'Planner temporaneamente non disponibile', fixtures: [] }, { status: 500 });
  }
}
