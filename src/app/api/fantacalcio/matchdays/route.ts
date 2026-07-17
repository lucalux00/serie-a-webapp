import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT matchday, is_active, is_completed
      FROM fanta_matchdays
      ORDER BY matchday ASC
    `;
    
    // Troviamo l'ultima completata o la prima attiva
    let activeMatchday = rows.find(r => r.is_active)?.matchday;
    if (!activeMatchday) {
        const lastCompleted = [...rows].reverse().find(r => r.is_completed);
        activeMatchday = lastCompleted ? lastCompleted.matchday : 1;
    }

    return NextResponse.json({ 
        matchdays: rows,
        current_matchday: activeMatchday
    });
  } catch (error) {
    console.error('Error fetching matchdays:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
