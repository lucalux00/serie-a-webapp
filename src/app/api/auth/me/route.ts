import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import { ALL_TEAMS } from '@/data/teams';

export async function GET() {
  try {
    const jwtUser = await getUserFromCookie();
    if (!jwtUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { rows } = await sql`SELECT id, name, email, favorite_team FROM users WHERE id = ${jwtUser.userId}`;
    const dbUser = rows[0];
    if (!dbUser) return NextResponse.json({ authenticated: false }, { status: 401 });

    const favTeam = ALL_TEAMS.find(t => t.id === dbUser.favorite_team);

    return NextResponse.json({ 
      authenticated: true, 
      user: { 
        id: dbUser.id,
        name: dbUser.name, 
        email: dbUser.email,
        favoriteTeamId: dbUser.favorite_team,
        favoriteTeamName: favTeam ? favTeam.name : null
      } 
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const jwtUser = await getUserFromCookie();
    if (!jwtUser) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { favoriteTeamId } = await request.json();
    await sql`UPDATE users SET favorite_team = ${favoriteTeamId} WHERE id = ${jwtUser.userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/me error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
