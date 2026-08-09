import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';
import deepSquads from '@/data/deepSquads.json';
import { canonicalRole, cleanPlayerName } from '@/lib/fantaRoster';
import { enrichFantaPlayers, getSerieAContext, sameTeam } from '@/lib/fantaData';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TARGETS = { POR: 3, DIF: 8, CEN: 8, ATT: 6 } as const;
const ROLES = Object.keys(TARGETS) as Array<keyof typeof TARGETS>;
const ADMINS = new Set(['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com']);
type CatalogPlayer = { name: string; position: string; marketValue?: string; team: string };
type Category = 'top' | 'value' | 'sleepers';
type SquadCatalog = Record<string, { firstTeam: { players: Array<{ name: string; position: string; marketValue?: string }> } }>;
const squadCatalog = deepSquads as unknown as SquadCatalog;

function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').replace(/[^a-z0-9]/g, '');
}

function valueMillions(value?: string) {
  const result = Number.parseFloat((value || '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(result) ? result : 0;
}

function costBand(value: number) {
  return value >= 20 ? 'Premium' : value >= 7 ? 'Equilibrato' : 'Low-cost';
}

function roleLabel(role: string) {
  return ({ POR: 'portieri', DIF: 'difensori', CEN: 'centrocampisti', ATT: 'attaccanti' } as Record<string, string>)[role] || 'profili';
}

function uniqueByTeam(players: CatalogPlayer[], count: number) {
  const usedTeams = new Set<string>();
  const usedPlayers = new Set<string>();
  return players.filter((player) => {
    const name = normalizeName(player.name);
    if (usedTeams.has(player.team) || usedPlayers.has(name)) return false;
    usedTeams.add(player.team);
    usedPlayers.add(name);
    return true;
  }).slice(0, count);
}

function baseCandidate(player: CatalogPlayer, category: Category) {
  const value = valueMillions(player.marketValue);
  const reason = category === 'top'
    ? `Profilo di prima fascia: priorità se cerchi un titolare di livello e il budget lo consente.`
    : category === 'value'
      ? `Equilibrio tra qualità, continuità potenziale e investimento sul reparto.`
      : `Occasione low-cost da valutare con attenzione a minutaggio, concorrenza e calendario.`;
  return {
    name: player.name,
    team: player.team,
    role: player.position,
    marketValue: player.marketValue || 'N/D',
    costBand: costBand(value),
    priority: 0,
    reason,
    category,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    let premium = Boolean(user.email && ADMINS.has(user.email.toLowerCase()));
    if (!premium) {
      const row = (await sql`SELECT is_premium, to_jsonb(users)->>'premium_until' AS premium_until FROM users WHERE id = ${user.userId} LIMIT 1`).rows[0];
      premium = row?.is_premium === true && (!row?.premium_until || new Date(row.premium_until) > new Date());
    }
    if (!premium) return NextResponse.json({ error: 'Solo Pro' }, { status: 403 });

    const [rosterResult, context] = await Promise.all([
      sql`SELECT player_name, team_name, role FROM fanta_rosters WHERE user_id = ${user.userId}`,
      getSerieAContext(),
    ]);
    const roster = (rosterResult.rows as Array<{ player_name: string; team_name: string | null; role: string | null }>).map((player) => ({ ...player, role: canonicalRole(player.player_name, player.team_name || '') }));
    const owned = new Set(roster.map((player) => normalizeName(player.player_name)));
    const counts = { POR: 0, DIF: 0, CEN: 0, ATT: 0 };
    roster.forEach((player) => { if (player.role && player.role in counts) counts[player.role as keyof typeof counts]++; });
    const gaps = ROLES.map((role) => ({ role, current: counts[role], target: TARGETS[role], missing: Math.max(0, TARGETS[role] - counts[role]) }));

    const allCatalog = Object.entries(squadCatalog).flatMap(([teamId, squad]) => {
      const currentTeam = context.activeTeams.find((team) => sameTeam(teamId, team));
      if (context.activeTeams.length && !currentTeam) return [];
      return squad.firstTeam.players.map((player) => ({ name: cleanPlayerName(player.name), position: player.position, marketValue: player.marketValue, team: currentTeam || teamId }));
    }) as CatalogPlayer[];
    const seen = new Set<string>();
    const catalog = allCatalog.filter((player) => {
      const key = normalizeName(player.name);
      if (!ROLES.includes(player.position as keyof typeof TARGETS) || owned.has(key) || valueMillions(player.marketValue) <= 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const role = request.nextUrl.searchParams.get('role')?.toUpperCase() as keyof typeof TARGETS | undefined;

    if (role && !ROLES.includes(role)) return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });
    if (role) {
      const pool = catalog.filter((player) => player.position === role).sort((left, right) => valueMillions(right.marketValue) - valueMillions(left.marketValue)).slice(0, 8);
      const candidates = (await enrichFantaPlayers(pool.map((player) => baseCandidate(player, valueMillions(player.marketValue) >= 20 ? 'top' : valueMillions(player.marketValue) >= 7 ? 'value' : 'sleepers')), context))
        .map((candidate, index) => ({ ...candidate, priority: index + 1 }));
      return NextResponse.json({
        role,
        candidates,
        source: 'Calendario e classifica football-data.org; statistiche individuali Big Balls Sports Data quando disponibili.',
        roleHint: `Confronta gli ${roleLabel(role)} per rendimento stimato, minutaggio, bonus, avversario e costo.`,
        updatedAt: new Date().toISOString(),
      });
    }

    const sorted = [...catalog].sort((left, right) => valueMillions(right.marketValue) - valueMillions(left.marketValue));
    const groups: Record<Category, CatalogPlayer[]> = {
      top: uniqueByTeam(sorted.filter((player) => valueMillions(player.marketValue) >= 20), 3),
      value: uniqueByTeam(sorted.filter((player) => { const value = valueMillions(player.marketValue); return value >= 7 && value < 20; }), 3),
      sleepers: uniqueByTeam(sorted.filter((player) => { const value = valueMillions(player.marketValue); return value > 0 && value < 7; }), 3),
    };
    const enriched = await enrichFantaPlayers((Object.keys(groups) as Category[]).flatMap((category) => groups[category].map((player) => baseCandidate(player, category))), context);
    const picks = {
      top: enriched.filter((candidate) => candidate.category === 'top'),
      value: enriched.filter((candidate) => candidate.category === 'value'),
      sleepers: enriched.filter((candidate) => candidate.category === 'sleepers'),
    };
    const statsCoverage = enriched.length ? Math.round((enriched.filter((candidate) => candidate.stats).length / enriched.length) * 100) : 0;
    const fixtureCoverage = enriched.length ? Math.round((enriched.filter((candidate) => candidate.fixture).length / enriched.length) * 100) : 0;
    return NextResponse.json({
      total: roster.length,
      targetTotal: 25,
      gaps,
      methodology: 'Profili del listone filtrati sui club della Serie A attuale e ordinati con calendario, avversario, fattore campo, minutaggio, rating e trend bonus quando disponibili.',
      picks,
      coverage: { statisticsPercent: statsCoverage, fixturePercent: fixtureCoverage },
      source: 'football-data.org e Big Balls Sports Data; valore di mercato dal listone interno.',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market AI error:', error);
    return NextResponse.json({ error: 'Scouting board temporaneamente non disponibile' }, { status: 500 });
  }
}
