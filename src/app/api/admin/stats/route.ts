import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';

const ADMIN_EMAILS = ['lucapinelli0000@gmail.com', 'luca.pinelli0000@gmail.com'];

export async function GET() {
  try {
    const session = await getUserFromCookie();
    if (!session || !ADMIN_EMAILS.includes(session.email.toLowerCase())) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }

    await sql`CREATE TABLE IF NOT EXISTS site_visits (visitor_id TEXT PRIMARY KEY, first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS app_installs (visitor_id TEXT PRIMARY KEY, installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL PRIMARY KEY, user_id UUID, status TEXT NOT NULL DEFAULT 'inactive', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;

    const [visits, registrations, installs, subscriptions] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM site_visits`,
      sql`SELECT COUNT(*)::int AS count FROM users`,
      sql`SELECT COUNT(*)::int AS count FROM app_installs`,
      sql`SELECT COUNT(*)::int AS count FROM subscriptions WHERE status IN ('active', 'trialing')`,
    ]);

    return NextResponse.json({
      uniqueVisitors: visits.rows[0].count,
      registrations: registrations.rows[0].count,
      appInstalls: installs.rows[0].count,
      activeSubscriptions: subscriptions.rows[0].count,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Statistiche non disponibili' }, { status: 500 });
  }
}
