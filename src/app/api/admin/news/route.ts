import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const jwtUser = await getUserFromCookie();
    if (!jwtUser) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { rows } = await sql`SELECT email FROM users WHERE id = ${jwtUser.userId}`;
    if (!rows[0] || (rows[0].email !== 'lucapinelli0000@gmail.com' && rows[0].email !== 'luca.pinelli0000@gmail.com')) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, type, status, link } = body;

    if (!title || !type || !status) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    const pubDate = new Date();
    const time = pubDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const source = 'Redazione';
    const cleanTitle = title;
    
    // Genera un link fittizio se non fornito
    const finalLink = link || `https://serie-a-webapp.vercel.app/news/${Date.now()}`;

    await sql`
      INSERT INTO news (title, link, pub_date, source, clean_title, time, snippet, type, status)
      VALUES (${title}, ${finalLink}, ${pubDate.toISOString()}, ${source}, ${cleanTitle}, ${time}, ${content || null}, ${type}, ${status})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/news error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const jwtUser = await getUserFromCookie();
    if (!jwtUser) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    const { rows } = await sql`SELECT email FROM users WHERE id = ${jwtUser.userId}`;
    if (!rows[0] || (rows[0].email !== 'lucapinelli0000@gmail.com' && rows[0].email !== 'luca.pinelli0000@gmail.com')) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });

    const body = await request.json();
    const { id, title, content, type, status, link } = body;
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    await sql`
      UPDATE news
      SET title = ${title}, snippet = ${content}, type = ${type}, status = ${status}, link = ${link}
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/news error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const jwtUser = await getUserFromCookie();
    if (!jwtUser) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    const { rows } = await sql`SELECT email FROM users WHERE id = ${jwtUser.userId}`;
    if (!rows[0] || (rows[0].email !== 'lucapinelli0000@gmail.com' && rows[0].email !== 'luca.pinelli0000@gmail.com')) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    await sql`DELETE FROM news WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/news error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
