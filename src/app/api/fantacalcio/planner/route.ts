import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import { verifyJwt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TEAM_STRENGTH: Record<string, number> = {
  Inter: 95, Juventus: 92, Milan: 90, Napoli: 88, Atalanta: 88, Roma: 85,
  Lazio: 84, Fiorentina: 82, Bologna: 80, Torino: 78, Sassuolo: 75,
  Genoa: 75, Monza: 74, Lecce: 72, Udinese: 72, Verona: 70, Cagliari: 70,
  Como: 68, Parma: 68, Venezia: 65,
};

function strength(name: string) {
  const team = Object.keys(TEAM_STRENGTH).find((item) => name.toLowerCase().includes(item.toLowerCase()));
  return team ? TEAM_STRENGTH[team] : 70;
}

export async function GET() {
  const token = (await cookies()).get('auth-token')?.value;
  const user = token ? await verifyJwt(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows: userRows } = await sql`SELECT is_premium, to_jsonb(users)->>'premium_until' AS premium_until FROM users WHERE id = ${user.userId} LIMIT 1`;
  const admin = ['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com'].includes((user.email ?? '').toLowerCase());
  const premiumUntil = userRows[0]?.premium_until ? new Date(userRows[0].premium_until) : null;
  if (!admin && !(userRows[0]?.is_premium === true && (!premiumUntil || premiumUntil > new Date()))) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const { rows: roster } = await sql`SELECT DISTINCT team_name FROM fanta_rosters WHERE user_id = ${user.userId}`;
  const teams = roster.map((row) => String(row.team_name ?? '')).filter(Boolean);
  if (!teams.length) return NextResponse.json({ teams: [], fixtures: [] });

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ teams, fixtures: [], unavailable: true });

  const response = await fetch('https://api.football-data.org/v4/competitions/SA/matches?status=SCHEDULED', {
    headers: { 'X-Auth-Token': apiKey },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return NextResponse.json({ teams, fixtures: [], unavailable: true });

  const payload = await response.json() as { matches?: Array<{ utcDate: string; homeTeam: { name: string; shortName?: string }; awayTeam: { name: string; shortName?: string } }> };
  const fixtures = teams.flatMap((team) => (payload.matches ?? [])
    .filter((match) => [match.homeTeam.name, match.homeTeam.shortName, match.awayTeam.name, match.awayTeam.shortName].some((name) => name?.toLowerCase().includes(team.toLowerCase())))
    .slice(0, 5)
    .map((match) => {
      const isHome = [match.homeTeam.name, match.homeTeam.shortName].some((name) => name?.toLowerCase().includes(team.toLowerCase()));
      const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
      const difficulty = Math.max(1, Math.min(5, Math.round((strength(opponent) - 55) / 9)));
      return { team, opponent, isHome, date: match.utcDate, difficulty };
    }));

  return NextResponse.json({ teams, fixtures });
}
