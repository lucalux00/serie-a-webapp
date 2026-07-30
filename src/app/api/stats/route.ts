import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

async function ensureStatsTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_visits (
      visitor_id TEXT PRIMARY KEY,
      first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS app_installs (
      visitor_id TEXT PRIMARY KEY,
      installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(request: Request) {
  try {
    const { visitorId } = await request.json();
    if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 100) {
      return NextResponse.json({ error: 'Identificativo visita non valido' }, { status: 400 });
    }

    await ensureStatsTables();
    await sql`
      INSERT INTO site_visits (visitor_id)
      VALUES (${visitorId})
      ON CONFLICT (visitor_id) DO UPDATE SET last_seen = NOW()
    `;

    const [{ count }] = (await sql`SELECT COUNT(*)::int AS count FROM site_visits`).rows;
    const [{ online }] = (await sql`
      SELECT COUNT(*)::int AS online FROM site_visits
      WHERE last_seen > NOW() - INTERVAL '5 minutes'
    `).rows;
    return NextResponse.json({ total: count, online });
  } catch (error) {
    console.error('Stats tracking error:', error);
    return NextResponse.json({ total: 0, online: 0 }, { status: 200 });
  }
}
