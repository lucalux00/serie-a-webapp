import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';
import deepSquads from '@/data/deepSquads.json';

const ADMINS = new Set(['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com']);
const TARGETS = { POR: 3, DIF: 8, CEN: 8, ATT: 6 } as const;
const ROLES = Object.keys(TARGETS) as Array<keyof typeof TARGETS>;

type SquadPlayer = {
  name: string;
  position: string;
  marketValue?: string;
  status?: string;
  stats?: { appearances?: number; goals?: number };
};

function marketValueToMillions(value?: string) {
  const parsed = Number.parseFloat((value ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function costBand(value: number) {
  if (value >= 25) return 'Alto';
  if (value >= 10) return 'Medio';
  return 'Accessibile';
}

function continuity(appearances: number) {
  if (appearances >= 28) return { label: 'Alta', score: 3 };
  if (appearances >= 16) return { label: 'Buona', score: 2 };
  return { label: 'Da verificare', score: 1 };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  let premium = Boolean(user.email && ADMINS.has(user.email.trim().toLowerCase()));
  if (!premium) {
    try {
      const { rows } = await sql`SELECT is_premium FROM users WHERE id = ${user.userId} LIMIT 1`;
      premium = rows[0]?.is_premium === true;
    } catch {
      premium = false;
    }
  }
  if (!premium) return NextResponse.json({ error: 'Solo Pro' }, { status: 403 });

  const { rows } = await sql`SELECT player_name, role FROM fanta_rosters WHERE user_id = ${user.userId}`;
  const counts = { POR: 0, DIF: 0, CEN: 0, ATT: 0 };
  const owned = new Set(rows.map((player) => String(player.player_name ?? '').trim().toLocaleLowerCase('it')));
  rows.forEach((player) => {
    const role = String(player.role || 'CEN').slice(0, 3).toUpperCase();
    if (role in counts) counts[role as keyof typeof counts]++;
  });

  const gaps = ROLES.map((role) => ({ role, current: counts[role], target: TARGETS[role], missing: Math.max(0, TARGETS[role] - counts[role]) }));
  const requestedRole = request.nextUrl.searchParams.get('role')?.toUpperCase();
  if (!requestedRole) {
    const total = rows.length;
    return NextResponse.json({ total, targetTotal: 25, coverage: Math.round(Math.min(total / 25, 1) * 100), gaps, priorities: gaps.filter((gap) => gap.missing > 0).sort((a, b) => b.missing - a.missing).slice(0, 3) });
  }
  if (!ROLES.includes(requestedRole as keyof typeof TARGETS)) return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });

  const candidates = Object.entries(deepSquads)
    .flatMap(([team, squad]) => (squad.firstTeam.players as SquadPlayer[]).map((player) => ({ ...player, team })))
    .filter((player) => player.position === requestedRole && !owned.has(player.name.trim().toLocaleLowerCase('it')))
    .map((player) => {
      const value = marketValueToMillions(player.marketValue);
      const appearances = player.stats?.appearances ?? 0;
      const form = continuity(appearances);
      // Equilibrio tra affidabilità e sostenibilità: non favorisce automaticamente il più costoso.
      const priorityScore = form.score * 20 + Math.min(appearances, 38) + Math.max(0, 28 - value);
      return {
        name: player.name,
        team: player.team,
        marketValue: player.marketValue ?? 'N/D',
        costBand: costBand(value),
        continuity: form.label,
        appearances,
        priorityScore: Math.round(priorityScore),
        reason: `${form.label} continuità (${appearances} presenze) e fascia di valore ${costBand(value).toLowerCase()}.`,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.name.localeCompare(b.name, 'it'))
    .slice(0, 8)
    .map(({ priorityScore, ...candidate }, index) => ({ ...candidate, priority: index + 1 }));

  return NextResponse.json({ role: requestedRole, candidates, source: 'Rosa Serie A: valore di mercato e continuità (presenze).' });
}
