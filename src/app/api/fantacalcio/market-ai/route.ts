import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';
import deepSquads from '@/data/deepSquads.json';
import { canonicalRole } from '@/lib/fantaRoster';

const TARGETS = { POR: 3, DIF: 8, CEN: 8, ATT: 6 } as const;
const ROLES = Object.keys(TARGETS) as Array<keyof typeof TARGETS>;
const ADMINS = new Set(['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com']);
type Season = { league?: string; appearances?: number; goals?: number; assists?: number; minutes?: number; rating?: number };
type CatalogPlayer = { name: string; position: string; marketValue?: string; team: string };

function valueMillions(value?: string) { const result = Number.parseFloat((value || '').replace(',', '.').replace(/[^0-9.]/g, '')); return Number.isFinite(result) ? result : 0; }
function costBand(value: number) { return value >= 20 ? 'Premium' : value >= 7 ? 'Equilibrato' : 'Low-cost'; }
function roleLabel(role: string) { return ({ POR: 'portiere', DIF: 'difensore', CEN: 'centrocampista', ATT: 'attaccante' } as Record<string, string>)[role] || 'profilo'; }

function uniqueByTeam(players: CatalogPlayer[], count: number) {
  const used = new Set<string>();
  return players.filter((player) => { if (used.has(player.team)) return false; used.add(player.team); return true; }).slice(0, count);
}

function catalogCandidate(player: CatalogPlayer, category: 'top' | 'value' | 'sleepers') {
  const value = valueMillions(player.marketValue);
  const reason = category === 'top'
    ? `Profilo di prima fascia (${player.marketValue || 'valore non disponibile'}): priorità se hai budget e cerchi un titolare di livello.`
    : category === 'value'
      ? `Fascia valore equilibrata (${player.marketValue || 'valore non disponibile'}): soluzione per alzare il reparto senza concentrare tutto il budget.`
      : `Scommessa low-cost (${player.marketValue || 'valore non disponibile'}): costo contenuto e margine di crescita, da acquistare solo dopo aver verificato minutaggio e concorrenza.`;
  return { name: player.name, team: player.team, role: player.position, marketValue: player.marketValue || 'N/D', costBand: costBand(value), score: category === 'top' ? 90 : category === 'value' ? 76 : 64, priority: 0, reason, category, stats: null, source: 'Listone interno aggiornato' };
}

async function performance(name: string) {
  const key = process.env.BBS_API_KEY;
  if (!key) return null;
  const headers = { Authorization: `Bearer ${key}` };
  try {
    const playerResponse = await fetch(`https://api.bigballsdata.com/v1/players?name=${encodeURIComponent(name)}&sport=football`, { headers, next: { revalidate: 21600 } });
    const player = playerResponse.ok ? (await playerResponse.json()).data?.[0] : null;
    if (!player?.id) return null;
    const formResponse = await fetch(`https://api.bigballsdata.com/v1/players/${player.id}/club-form?sport=football`, { headers, next: { revalidate: 21600 } });
    if (!formResponse.ok) return null;
    const seasons = ((await formResponse.json()).data || []).filter((season: Season) => season.league === 'Serie A').slice(0, 3) as Season[];
    if (!seasons.length) return null;
    const total = (field: keyof Season) => seasons.reduce((sum, season) => sum + Number(season[field] || 0), 0);
    const appearances = total('appearances'); const minutes = total('minutes'); const goals = total('goals'); const assists = total('assists');
    const ratings = seasons.map((season) => Number(season.rating || 0)).filter(Boolean);
    const rating = ratings.reduce((sum, item) => sum + item, 0) / ratings.length;
    const goalActions90 = minutes ? ((goals + assists) * 90) / minutes : 0;
    return { seasons: seasons.length, appearances, minutes, goals, assists, rating: Number(rating.toFixed(2)), goalActions90: Number(goalActions90.toFixed(2)) };
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  let premium = Boolean(user.email && ADMINS.has(user.email.toLowerCase()));
  if (!premium) { try { const row = (await sql`SELECT is_premium, to_jsonb(users)->>'premium_until' AS premium_until FROM users WHERE id = ${user.userId} LIMIT 1`).rows[0]; premium = row?.is_premium === true && (!row?.premium_until || new Date(row.premium_until) > new Date()); } catch { premium = false; } }
  if (!premium) return NextResponse.json({ error: 'Solo Pro' }, { status: 403 });

  const rosterRows = (await sql`SELECT player_name, team_name, role FROM fanta_rosters WHERE user_id = ${user.userId}`).rows as Array<{ player_name: string; team_name: string | null; role: string | null }>;
  const roster = rosterRows.map((player) => ({ ...player, role: canonicalRole(player.player_name, player.team_name || '') }));
  const owned = new Set(roster.map((player) => String(player.player_name).trim().toLocaleLowerCase('it')));
  const counts = { POR: 0, DIF: 0, CEN: 0, ATT: 0 };
  roster.forEach((player) => { if (player.role && player.role in counts) counts[player.role as keyof typeof counts]++; });
  const gaps = ROLES.map((role) => ({ role, current: counts[role], target: TARGETS[role], missing: Math.max(0, TARGETS[role] - counts[role]) }));
  const catalog = Object.entries(deepSquads).flatMap(([team, squad]: any) => squad.firstTeam.players.map((player: any) => ({ name: player.name, position: player.position, marketValue: player.marketValue, team }))).filter((player: CatalogPlayer) => ROLES.includes(player.position as keyof typeof TARGETS) && !owned.has(player.name.trim().toLocaleLowerCase('it')) && valueMillions(player.marketValue) > 0) as CatalogPlayer[];
  const role = request.nextUrl.searchParams.get('role')?.toUpperCase() as keyof typeof TARGETS | undefined;

  if (!role) {
    const sortedDesc = [...catalog].sort((a, b) => valueMillions(b.marketValue) - valueMillions(a.marketValue));
    const top = uniqueByTeam(sortedDesc.filter((player) => valueMillions(player.marketValue) >= 20), 4).map((player) => catalogCandidate(player, 'top'));
    const value = uniqueByTeam(sortedDesc.filter((player) => { const amount = valueMillions(player.marketValue); return amount >= 7 && amount < 20; }), 4).map((player) => catalogCandidate(player, 'value'));
    const sleepers = uniqueByTeam(sortedDesc.filter((player) => { const amount = valueMillions(player.marketValue); return amount > 0 && amount < 7; }), 4).map((player) => catalogCandidate(player, 'sleepers'));
    return NextResponse.json({ total: roster.length, targetTotal: 25, gaps, methodology: 'Fasce valore: priorità di investimento, equilibrio di budget e scommesse low-cost. Verifica sempre titolarità e regolamento della tua lega.', picks: { top, value, sleepers }, source: 'Listone interno aggiornato: valori di mercato, ruolo e squadra.' });
  }

  if (!ROLES.includes(role)) return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });
  const pool = catalog.filter((player) => player.position === role).sort((a, b) => valueMillions(b.marketValue) - valueMillions(a.marketValue)).slice(0, 12);
  const candidates = (await Promise.all(pool.map(async (player) => {
    const stats = await performance(player.name);
    const value = valueMillions(player.marketValue);
    const category = value >= 20 ? 'top' : value >= 7 ? 'value' : 'sleepers';
    const base = catalogCandidate(player, category);
    if (!stats) return base;
    const score = stats.rating * 5 + stats.goalActions90 * 24 + Math.min(stats.appearances / stats.seasons, 35) + Math.max(0, 20 - value) / 2;
    return { ...base, score: Math.round(score), stats, reason: `${base.reason} Dati Serie A: rating ${stats.rating}, ${stats.appearances} presenze, ${stats.goals} gol e ${stats.assists} assist.` };
  }))).sort((a, b) => b.score - a.score).slice(0, 8).map((candidate, index) => ({ ...candidate, priority: index + 1 }));
  return NextResponse.json({ role, candidates, source: 'Dati di listone; quando disponibili, statistiche Big Balls Sports Data delle ultime stagioni Serie A.', roleHint: `Confronta i ${roleLabel(role)} per fascia costo e motivazione prima di aggiungerli alla rosa.` });
}
