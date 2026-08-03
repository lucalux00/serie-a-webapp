import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { canonicalRole } from '@/lib/fantaRoster';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [{ rows: players }, { rows: rosters }, { rows: lineups }] = await Promise.all([
    sql`SELECT id, name, team_id, position FROM players WHERE is_coach IS NOT TRUE AND is_staff IS NOT TRUE`,
    sql`SELECT id, player_name, team_name, role FROM fanta_rosters`,
    sql`SELECT id, player_name, team_name, role FROM fanta_lineups`,
  ]);
  let playersFixed = 0;
  let rostersFixed = 0;
  let lineupsFixed = 0;
  for (const player of players) { const role = canonicalRole(player.name, player.team_id); if (role && role !== player.position) { await sql`UPDATE players SET position = ${role} WHERE id = ${player.id}`; playersFixed++; } }
  for (const roster of rosters) { const role = canonicalRole(roster.player_name, roster.team_name); if (role && role !== roster.role) { await sql`UPDATE fanta_rosters SET role = ${role} WHERE id = ${roster.id}`; rostersFixed++; } }
  for (const lineup of lineups) { const role = canonicalRole(lineup.player_name, lineup.team_name); if (role && role !== lineup.role) { await sql`UPDATE fanta_lineups SET role = ${role} WHERE id = ${lineup.id}`; lineupsFixed++; } }
  return NextResponse.json({ success: true, playersFixed, rostersFixed, lineupsFixed });
}
