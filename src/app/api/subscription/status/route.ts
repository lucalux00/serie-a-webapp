import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ isPremium: false, plan: null, expiresAt: null });
  }

  if (isAdminEmail(user.email)) {
    return NextResponse.json({ isPremium: true, plan: 'pro', expiresAt: null });
  }

  try {
    const { rows } = await sql`
      SELECT is_premium FROM users WHERE id = ${user.userId} LIMIT 1
    `;
    const isPremium = rows[0]?.is_premium === true;

    return NextResponse.json({
      isPremium,
      plan: isPremium ? 'pro' : 'free',
      expiresAt: null,
    });
  } catch (error) {
    console.error('GET /api/subscription/status error:', error);
    return NextResponse.json({ isPremium: false, plan: 'free', expiresAt: null });
  }
}
