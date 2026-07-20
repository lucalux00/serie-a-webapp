/**
 * GET /api/mercato/live
 *
 * Restituisce i trasferimenti dal DB.
 *
 * Query params:
 *   ?league=A|B|PL|LL|BL|L1|ALL  — filtra per lega (default: A)
 *   ?team_id=napoli               — filtra per squadra specifica (per TeamHub)
 *   ?limit=100                    — numero max risultati
 *
 * Note: i dati vengono popolati dal cron /api/cron/mercato (giornaliero).
 */
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league  = searchParams.get('league') || 'A';
  const teamId  = searchParams.get('team_id') || null;
  const limit   = Math.min(parseInt(searchParams.get('limit') || '100'), 200);

  try {
    let rows: any[];

    if (teamId) {
      // Modalità squadra specifica (usata da TeamHubClient)
      const result = await sql`
        SELECT
          id,
          league,
          status,
          type,
          team_id,
          INITCAP(REPLACE(team_id, '-', ' ')) AS team,
          player,
          other_team  AS "fromTo",
          fee,
          date,
          created_at
        FROM transfers
        WHERE team_id = ${teamId}
        ORDER BY id DESC
        LIMIT ${limit}
      `;
      rows = result.rows;
    } else if (league === 'ALL') {
      // Tutte le leghe (per stats/admin)
      const result = await sql`
        SELECT
          id,
          league,
          status,
          type,
          team_id,
          INITCAP(REPLACE(team_id, '-', ' ')) AS team,
          player,
          other_team AS "fromTo",
          fee,
          date,
          created_at
        FROM transfers
        ORDER BY id DESC
        LIMIT ${limit}
      `;
      rows = result.rows;
    } else {
      // Singola lega (comportamento default)
      const result = await sql`
        SELECT
          id,
          league,
          status,
          type,
          team_id,
          INITCAP(REPLACE(team_id, '-', ' ')) AS team,
          player,
          other_team AS "fromTo",
          fee,
          date,
          created_at
        FROM transfers
        WHERE league = ${league}
        ORDER BY id DESC
        LIMIT ${limit}
      `;
      rows = result.rows;
    }

    return NextResponse.json({ transfers: rows });

  } catch (error: any) {
    console.error('[mercato/live] Errore DB:', error.message);
    return NextResponse.json({ transfers: [] });
  }
}
