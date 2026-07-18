import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const jwtUser = await getUserFromCookie();
    if (!jwtUser) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    // Controlla se l'utente è l'admin dal DB
    const { rows } = await sql`SELECT email FROM users WHERE id = ${jwtUser.userId}`;
    if (!rows[0] || (rows[0].email !== 'lucapinelli0000@gmail.com' && rows[0].email !== 'luca.pinelli0000@gmail.com')) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }

    const body = await request.json();
    const { player, team_id, other_team, fee, type, status } = body;

    if (!player || !team_id || !other_team || !fee || !type || !status) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    const date = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    await sql`
      INSERT INTO transfers (team_id, type, player, other_team, fee, status, date)
      VALUES (${team_id}, ${type}, ${player}, ${other_team}, ${fee}, ${status}, ${date})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/transfers error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
