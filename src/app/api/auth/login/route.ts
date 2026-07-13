import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password sono obbligatori' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    const result = await sql`
      SELECT id, name, email, favorite_team 
      FROM users 
      WHERE email = ${email} AND password_hash = ${passwordHash}
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Credenziali non valide o utente inesistente.' }, { status: 401 });
    }

    const user = result.rows[0];
    return NextResponse.json({ user }, { status: 200 });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
