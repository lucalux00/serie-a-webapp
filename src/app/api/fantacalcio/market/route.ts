import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/auth';
import { canonicalRole } from '@/lib/fantaRoster';

const TARGET: Record<string, number> = { POR: 3, DIF: 8, CEN: 8, ATT: 6 };
const BASE_PRICE: Record<string, number> = { POR: 7, DIF: 10, CEN: 14, ATT: 20 };
const normalize = (value?: string) => {
  const v = (value || '').toUpperCase();
  if (v.startsWith('POR') || v === 'GK') return 'POR';
  if (v.startsWith('DIF') || v === 'DEF') return 'DIF';
  if (v.startsWith('CEN') || v === 'MID') return 'CEN';
  if (v.startsWith('ATT') || v === 'FWD') return 'ATT';
  return null;
};

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    const user = token ? await verifyJwt(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const budget = Math.max(1, Math.min(500, Number(new URL(request.url).searchParams.get('budget') || 100)));
    const { rows: rawRoster } = await sql`SELECT player_name AS "playerName", team_name AS "teamName", role FROM fanta_rosters WHERE user_id = ${user.userId}`;
    const roster = rawRoster.map((player: any) => ({ ...player, role: canonicalRole(player.playerName, player.teamName) }));
    const inRoster = new Set(roster.map((p: any) => p.playerName.toLowerCase()));
    const counts = Object.fromEntries(Object.keys(TARGET).map((role) => [role, 0])) as Record<string, number>;
    roster.forEach((p: any) => { const role = normalize(p.role); if (role) counts[role]++; });
    const { rows } = await sql`
      SELECT p.name, p.position, p.role, COALESCE(t.name, p.team_id) AS "teamName"
      FROM players p LEFT JOIN teams t ON t.id = p.team_id
      WHERE COALESCE(p.is_coach, false) = false AND COALESCE(p.is_staff, false) = false LIMIT 600
    `;
    const suggestions = Object.keys(TARGET).map((role) => {
      const missing = Math.max(0, TARGET[role] - counts[role]);
      const suggestions = rows.map((p: any) => ({ ...p, role: canonicalRole(p.name, p.teamName) })).filter((p: any) => p.role === role && !inRoster.has(p.name.toLowerCase())).slice(0, 7).map((p: any, index: number) => {
        const tier = index < 2 ? 'A' : index < 5 ? 'B' : 'C';
        const estimatedPrice = Math.min(budget, Math.max(1, Math.round((budget / 100) * ((BASE_PRICE[role] ?? 8) + index * 3))));
        return { ...p, tier, estimatedPrice, rationale: missing ? `Copre una lacuna: hai ${counts[role]}/${TARGET[role]} ${role} in rosa.` : `Aumenta la profondità del reparto (${counts[role]} già in rosa).`, statsStatus: 'Presenze, media voto sulle ultime 3 stagioni e media gol saranno visualizzate solo dopo l’importazione da una fonte verificata.' };
      });
      return { role, missing, current: counts[role], target: TARGET[role], suggestions };
    });
    return NextResponse.json({ budget, suggestions, methodology: 'Priorità: lacune della rosa → ruolo → fasce compatibili con il budget. Nessuna statistica non verificata viene inventata.' });
  } catch (error) {
    console.error('Fanta market error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
