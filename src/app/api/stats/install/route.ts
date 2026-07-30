import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const { visitorId } = await request.json();
    if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 100) {
      return NextResponse.json({ error: 'Identificativo installazione non valido' }, { status: 400 });
    }
    await sql`
      CREATE TABLE IF NOT EXISTS app_installs (
        visitor_id TEXT PRIMARY KEY,
        installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`INSERT INTO app_installs (visitor_id) VALUES (${visitorId}) ON CONFLICT (visitor_id) DO NOTHING`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('App install tracking error:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
