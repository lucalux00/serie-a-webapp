import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function hashPassword(password: string) {
  // Simple SHA-256 hash for demonstration. In a real prod app, use bcrypt or pbkdf2.
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    try {
      const result = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name}, ${email}, ${passwordHash})
        RETURNING id, name, email, favorite_team;
      `;
      
      const user = result.rows[0];
      return NextResponse.json({ user }, { status: 201 });
      
    } catch (dbError: any) {
      if (dbError.message.includes('unique constraint') || dbError.code === '23505') {
        return NextResponse.json({ error: 'Esiste già un account con questa email.' }, { status: 409 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
