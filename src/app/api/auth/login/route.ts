import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
    }

    // Ricerca utente
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    // Verifica password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    // Generazione Token
    const token = await signJwt({ userId: user.id, email: user.email, name: user.name });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 giorni
    });

    return NextResponse.json({ success: true, user: { name: user.name, email: user.email, isAdmin: user.email === 'lucapinelli0000@gmail.com' } }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
