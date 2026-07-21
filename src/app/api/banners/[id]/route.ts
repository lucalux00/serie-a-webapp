import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// PUT /api/banners/[id] — aggiorna un banner
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title, message, link, linkLabel, type, isActive, startDate, endDate } = await req.json();

    const result = await sql`
      UPDATE banners
      SET 
        title = ${title ?? null},
        message = ${message},
        link = ${link ?? null},
        link_label = ${linkLabel ?? null},
        type = ${type},
        is_active = ${isActive},
        start_date = ${startDate ?? null},
        end_date = ${endDate ?? null}
      WHERE id = ${id}
      RETURNING id, title, message, link, link_label as "linkLabel", type, is_active as "isActive", start_date as "startDate", end_date as "endDate"
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Banner non trovato' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/banners/[id] error:', err);
    return NextResponse.json({ error: 'Errore aggiornamento banner' }, { status: 500 });
  }
}

// DELETE /api/banners/[id] — elimina un banner
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM banners WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/banners/[id] error:', err);
    return NextResponse.json({ error: 'Errore eliminazione banner' }, { status: 500 });
  }
}
