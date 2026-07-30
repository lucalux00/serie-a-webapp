import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getUserFromCookie();
  const { endpoint } = await request.json();
  if (!user || !endpoint) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND user_id = ${user.userId}`;
  return NextResponse.json({ success: true });
}
