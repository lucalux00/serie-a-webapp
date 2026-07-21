import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET /api/banners — ritorna tutti i banner attivi (per il frontend)
export async function GET() {
  try {
    const result = await sql`
      SELECT id, title, message, link, link_label as "linkLabel", type, is_active as "isActive", 
             start_date as "startDate", end_date as "endDate", created_at as "createdAt"
      FROM banners
      ORDER BY created_at DESC
    `;
    return NextResponse.json(result.rows);
  } catch {
    // Se la tabella non esiste ancora, ritorna array vuoto
    return NextResponse.json([]);
  }
}

// POST /api/banners — crea un nuovo banner (solo admin)
export async function POST(req: NextRequest) {
  try {
    const { title, message, link, linkLabel, type, isActive, startDate, endDate } = await req.json();

    if (!message || !type) {
      return NextResponse.json({ error: 'message e type sono obbligatori' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO banners (title, message, link, link_label, type, is_active, start_date, end_date)
      VALUES (${title ?? null}, ${message}, ${link ?? null}, ${linkLabel ?? null}, ${type}, ${isActive ?? true}, ${startDate ?? null}, ${endDate ?? null})
      RETURNING id, title, message, link, link_label as "linkLabel", type, is_active as "isActive", start_date as "startDate", end_date as "endDate", created_at as "createdAt"
    `;
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/banners error:', err);
    return NextResponse.json({ error: 'Errore durante la creazione del banner' }, { status: 500 });
  }
}
