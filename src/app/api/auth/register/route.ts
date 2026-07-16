import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { name, email, password, favoriteTeam } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
    }

    // Creazione tabella users se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        favorite_team VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Verifica se l'email esiste già
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return NextResponse.json({ error: 'Email già in uso' }, { status: 409 });
    }

    // Hash della password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Inserimento utente
    const result = await sql`
      INSERT INTO users (name, email, password_hash, favorite_team)
      VALUES (${name}, ${email}, ${passwordHash}, ${favoriteTeam || null})
      RETURNING id, name, email, favorite_team;
    `;

    const newUser = result.rows[0];

    // Generazione Token
    const token = await signJwt({ userId: newUser.id, email: newUser.email, name: newUser.name });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 giorni
    });

    return NextResponse.json({ success: true, user: { name: newUser.name, email: newUser.email } }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
