import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import deepSquads from '@/data/deepSquads.json';
import { canonicalRole, cleanPlayerName } from '@/lib/fantaRoster';
import { getSerieAContext, sameTeam } from '@/lib/fantaData';

export const dynamic = 'force-dynamic';
type SquadCatalog = Record<string, { firstTeam: { players: Array<{ name: string; position: string }> } }>;
const squadCatalog = deepSquads as unknown as SquadCatalog;

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    const searchTerm = `%${q}%`;
    const [databaseResult, context] = await Promise.all([
      sql`SELECT name, position as role, team_id as team FROM players WHERE name ILIKE ${searchTerm} AND (is_coach IS NOT TRUE) AND (is_staff IS NOT TRUE) ORDER BY name ASC LIMIT 20`.catch(() => ({ rows: [] })),
      getSerieAContext(),
    ]);
    const localMatches = Object.entries(squadCatalog).flatMap(([teamId, squad]) => squad.firstTeam.players
      .filter((player) => normalize(player.name).includes(normalize(q)))
      .map((player) => ({ name: cleanPlayerName(player.name), role: player.position, team: teamId })));
    const candidates = [...databaseResult.rows, ...localMatches] as Array<{ name: string; role: string; team: string }>;
    const seen = new Set<string>();
    const results = candidates.flatMap((candidate) => {
      const currentTeam = context.activeTeams.find((team) => sameTeam(candidate.team, team));
      if (context.activeTeams.length && !currentTeam) return [];
      const displayName = cleanPlayerName(candidate.name);
      const role = canonicalRole(displayName, candidate.team);
      const key = normalize(displayName);
      if (!role || seen.has(key)) return [];
      seen.add(key);
      return [{ name: displayName, role, team: currentTeam || candidate.team, teamVerified: Boolean(currentTeam) }];
    }).slice(0, 12);
    return NextResponse.json({ results, source: context.sourceAvailable ? 'Listone filtrato sui club Serie A attuali' : 'Listone locale verificato', updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Player search error:', error);
    return NextResponse.json({ error: 'Ricerca giocatori temporaneamente non disponibile', results: [] }, { status: 500 });
  }
}
