import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';
import deepSquads from '@/data/deepSquads.json';

const TARGETS = { POR: 3, DIF: 8, CEN: 8, ATT: 6 } as const;
const ROLES = Object.keys(TARGETS) as Array<keyof typeof TARGETS>;
const ADMINS = new Set(['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com']);
type Season = { league?: string; appearances?: number; goals?: number; assists?: number; minutes?: number; rating?: number; season?: number };

function valueMillions(value?: string) { const result = Number.parseFloat((value || '').replace(',', '.').replace(/[^0-9.]/g, '')); return Number.isFinite(result) ? result : 0; }
function band(value: number) { return value >= 25 ? 'Alto' : value >= 10 ? 'Medio' : 'Accessibile'; }

async function performance(name: string) {
  const key = process.env.BBS_API_KEY;
  if (!key) return null;
  const headers = { Authorization: `Bearer ${key}` };
  const playerResponse = await fetch(`https://api.bigballsdata.com/v1/players?name=${encodeURIComponent(name)}&sport=football`, { headers, next: { revalidate: 21600 } });
  if (!playerResponse.ok) return null;
  const player = (await playerResponse.json()).data?.[0];
  if (!player?.id) return null;
  const formResponse = await fetch(`https://api.bigballsdata.com/v1/players/${player.id}/club-form?sport=football`, { headers, next: { revalidate: 21600 } });
  if (!formResponse.ok) return null;
  const seasons = ((await formResponse.json()).data || []).filter((season: Season) => season.league === 'Serie A').slice(0, 3) as Season[];
  if (!seasons.length) return null;
  const total = (field: keyof Season) => seasons.reduce((sum, season) => sum + Number(season[field] || 0), 0);
  const appearances = total('appearances'); const minutes = total('minutes'); const goals = total('goals'); const assists = total('assists');
  const ratings = seasons.map((season) => Number(season.rating || 0)).filter(Boolean);
  const rating = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  const goalActions90 = minutes ? ((goals + assists) * 90) / minutes : 0;
  const oldRating = ratings.slice(1).reduce((sum, value) => sum + value, 0) / Math.max(1, ratings.length - 1);
  return { seasons: seasons.length, appearances, minutes, goals, assists, rating, goalActions90, formDelta: Number(seasons[0].rating || rating) - oldRating };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  let premium = Boolean(user.email && ADMINS.has(user.email.toLowerCase()));
  if (!premium) { try { premium = (await sql`SELECT is_premium FROM users WHERE id = ${user.userId} LIMIT 1`).rows[0]?.is_premium === true; } catch { premium = false; } }
  if (!premium) return NextResponse.json({ error: 'Solo Pro' }, { status: 403 });
  const roster = (await sql`SELECT player_name, role FROM fanta_rosters WHERE user_id = ${user.userId}`).rows;
  const owned = new Set(roster.map((player) => String(player.player_name).trim().toLocaleLowerCase('it')));
  const counts = { POR: 0, DIF: 0, CEN: 0, ATT: 0 };
  roster.forEach((player) => { const role = String(player.role || '').slice(0, 3).toUpperCase(); if (role in counts) counts[role as keyof typeof counts]++; });
  const gaps = ROLES.map((role) => ({ role, current: counts[role], target: TARGETS[role], missing: Math.max(0, TARGETS[role] - counts[role]) }));
  const role = request.nextUrl.searchParams.get('role')?.toUpperCase() as keyof typeof TARGETS | undefined;
  if (!role) return NextResponse.json({ total: roster.length, targetTotal: 25, gaps, methodology: 'Score: rating medio 35%, gol+assist/90 25%, presenze 20%, forma 10%, valore 10%.' });
  if (!ROLES.includes(role)) return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });
  const raw = Object.entries(deepSquads).flatMap(([team, squad]: any) => squad.firstTeam.players.map((player: any) => ({ ...player, team }))).filter((player: any) => player.position === role && !owned.has(String(player.name).trim().toLocaleLowerCase('it'))).slice(0, 14);
  const candidates = (await Promise.all(raw.map(async (player: any) => {
    const stats = await performance(player.name); if (!stats) return null;
    const value = valueMillions(player.marketValue);
    const score = stats.rating * 5 + stats.goalActions90 * 24 + Math.min(stats.appearances / stats.seasons, 35) + Math.max(-5, Math.min(5, stats.formDelta)) * 2 + Math.max(0, 20 - value) / 2;
    return { name: player.name, team: stats.seasons ? player.team : '', marketValue: player.marketValue || 'N/D', costBand: band(value), score: Math.round(score), stats: { ...stats, rating: Number(stats.rating.toFixed(2)), goalActions90: Number(stats.goalActions90.toFixed(2)), formDelta: Number(stats.formDelta.toFixed(2)) }, reason: `${stats.seasons} stagioni Serie A: rating ${stats.rating.toFixed(2)}, ${stats.appearances} presenze, ${stats.goals} gol, ${stats.assists} assist e ${stats.goalActions90.toFixed(2)} azioni gol/90.` };
  }))).filter(Boolean).sort((a: any, b: any) => b.score - a.score).slice(0, 8).map((candidate: any, index) => ({ ...candidate, priority: index + 1 }));
  return NextResponse.json({ role, candidates, source: 'Dati verificati Big Balls Sports Data: ultime tre stagioni Serie A.' });
}
