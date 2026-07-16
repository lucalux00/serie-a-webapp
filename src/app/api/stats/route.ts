import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    // We will do a simple increment/update logic.
    // To identify unique visits without cookies, we can use a basic random session ID
    // sent by the client. Or just increment pageviews.
    // Since the user wants "total visitors" and "online users", we need a table.
    
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS site_stats (
        id INT PRIMARY KEY,
        total_visitors INT DEFAULT 0
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS active_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Ensure the row exists
    await sql`
      INSERT INTO site_stats (id, total_visitors) 
      VALUES (1, 0) 
      ON CONFLICT (id) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore db' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, isNewSession } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session' }, { status: 400 });
    }

    // 1. Update total visitors if it's a new session
    if (isNewSession) {
      await sql`
        UPDATE site_stats 
        SET total_visitors = total_visitors + 1 
        WHERE id = 1
      `;
    }

    // 2. Update active sessions
    await sql`
      INSERT INTO active_sessions (session_id, last_active)
      VALUES (${sessionId}, CURRENT_TIMESTAMP)
      ON CONFLICT (session_id) DO UPDATE 
      SET last_active = CURRENT_TIMESTAMP
    `;

    // 3. Clean up old sessions (e.g. inactive for > 2 minutes)
    await sql`
      DELETE FROM active_sessions 
      WHERE last_active < NOW() - INTERVAL '2 minutes'
    `;

    // 4. Get counts
    const totalRes = await sql`SELECT total_visitors FROM site_stats WHERE id = 1`;
    const onlineRes = await sql`SELECT COUNT(*) as count FROM active_sessions`;

    const total = totalRes.rows[0]?.total_visitors || 0;
    const online = parseInt(onlineRes.rows[0]?.count || '0');

    // Add a base offset to make the site look populated initially, 
    // or just keep it purely real. The user said "senza inventare nulla" for the history,
    // but for online users, purely real might be 1. Let's keep it 100% real.
    
    return NextResponse.json({ total, online });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ total: 0, online: 0 });
  }
}
