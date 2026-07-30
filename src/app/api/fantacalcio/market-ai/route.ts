import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';

const ADMINS = new Set(['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com']);
const TARGETS = { POR: 3, DIF: 8, CEN: 8, ATT: 6 } as const;

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  let premium = Boolean(user.email && ADMINS.has(user.email.trim().toLowerCase()));
  if (!premium) { try { const { rows } = await sql`SELECT is_premium FROM users WHERE id = ${user.userId} LIMIT 1`; premium = rows[0]?.is_premium === true; } catch {} }
  if (!premium) return NextResponse.json({ error: 'Solo Pro' }, { status: 403 });
  const { rows } = await sql`SELECT role FROM fanta_rosters WHERE user_id = ${user.userId}`;
  const counts = { POR: 0, DIF: 0, CEN: 0, ATT: 0 };
  rows.forEach((player) => { const role = String(player.role || 'CEN').slice(0, 3).toUpperCase(); if (role in counts) counts[role as keyof typeof counts]++; else counts.CEN++; });
  const gaps = Object.entries(TARGETS).map(([role, target]) => ({ role, current: counts[role as keyof typeof counts], target, missing: Math.max(0, target - counts[role as keyof typeof counts]) }));
  const total = rows.length;
  return NextResponse.json({ total, targetTotal: 25, coverage: Math.round(Math.min(total / 25, 1) * 100), gaps, priorities: gaps.filter((gap) => gap.missing > 0).sort((a, b) => b.missing - a.missing).slice(0, 3) });
}
