import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'live' or 'mercato'
    const status = searchParams.get('status'); // 'ufficiale', 'trattativa', 'published'
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    let query;
    if (type && status) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type} AND status = ${status}
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type) {
      query = sql`
        SELECT * FROM news 
        WHERE type = ${type}
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT * FROM news 
        ORDER BY pub_date DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const { rows } = await query;

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
