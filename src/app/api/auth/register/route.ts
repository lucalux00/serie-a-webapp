import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { passwordIssues } from '@/lib/password';
import { getProSignupPromoState } from '@/lib/proSignupPromo';

export async function POST(request: Request) {
  try {
    const { name: rawName, email: rawEmail, password, favoriteTeam } = await request.json();
    const name = String(rawName || '').trim();
    const email = String(rawEmail || '').trim().toLowerCase();

    if (!name || !email || !password || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
    }
    const issues = passwordIssues(password, name, email);
    if (issues.length) return NextResponse.json({ error: issues[0] }, { status: 400 });

    // Creazione tabella users se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        favorite_team VARCHAR(50),
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_source TEXT`;

    // Verifica se l'email esiste già
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return NextResponse.json({ error: 'Email già in uso' }, { status: 409 });
    }

    // Hash della password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const signupPromo = getProSignupPromoState();

    // Inserimento utente e assegnazione atomica dell'accesso promozionale.
    const result = await sql`
      INSERT INTO users (
        name,
        email,
        password_hash,
        favorite_team,
        is_premium,
        premium_until,
        premium_source
      )
      VALUES (
        ${name},
        ${email},
        ${passwordHash},
        ${favoriteTeam || null},
        ${signupPromo.active},
        CASE WHEN ${signupPromo.active} THEN NOW() + INTERVAL '2 months' ELSE NULL END,
        CASE WHEN ${signupPromo.active} THEN ${signupPromo.code} ELSE NULL END
      )
      RETURNING id, name, email, favorite_team, is_premium, premium_until;
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

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      proAccess: newUser.is_premium ? {
        granted: true,
        source: signupPromo.code,
        expiresAt: new Date(newUser.premium_until).toISOString(),
        renewsAutomatically: false,
      } : { granted: false },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
