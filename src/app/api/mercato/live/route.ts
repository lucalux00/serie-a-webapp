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
import { dedupeTransfers, type TransferLike } from '@/lib/transfers';
import { ALL_TEAMS } from '@/data/teams';

export const dynamic = 'force-dynamic';

type TransferRow = TransferLike & {
  team?: string | null;
  league?: string | null;
  date?: string | null;
  source_url?: string | null;
  source_name?: string | null;
};

type MarketArticleRow = {
  id: number;
  title: string;
  summary: string;
  team: string;
  category: string;
  source: string;
  link: string;
  pub_date: string;
  created_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league  = searchParams.get('league') || 'A';
  const teamId  = searchParams.get('team_id') || null;
  const limit   = Math.min(parseInt(searchParams.get('limit') || '100'), 300);

  try {
    let rows: TransferRow[];

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
          created_at,
          source_url,
          source_name
        FROM transfers
        WHERE team_id = ${teamId}
        ORDER BY id DESC
        LIMIT ${limit}
      `;
      rows = result.rows as TransferRow[];
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
          created_at,
          source_url,
          source_name
        FROM transfers
        ORDER BY id DESC
        LIMIT ${limit}
      `;
      rows = result.rows as TransferRow[];
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
          created_at,
          source_url,
          source_name
        FROM transfers
        WHERE league = ${league}
        ORDER BY id DESC
        LIMIT ${limit}
      `;
      rows = result.rows as TransferRow[];
    }

    // Keep only movements tied to a known club in the requested competition.
    // This prevents ambiguous RSS extractions from polluting the public feed.
    const allowedTeamIds = new Set(
      ALL_TEAMS.filter((team) => teamId ? team.id === teamId : league === 'ALL' || team.league === league).map((team) => team.id)
    );
    const transfers = dedupeTransfers(rows).filter((transfer) =>
      typeof transfer.team_id === 'string' &&
      typeof transfer.type === 'string' &&
      allowedTeamIds.has(transfer.team_id) &&
      ['Acquisto', 'Cessione', 'Prestito', 'Trattativa'].includes(transfer.type)
    );

    // Lo Smart Aggregator riusa la tabella news: nessuna seconda copia degli
    // articoli e nessuna modifica al contratto `transfers` usato dai Team Hub.
    let articles: MarketArticleRow[] = [];
    try {
      const selectedTeam = teamId ? ALL_TEAMS.find((team) => team.id === teamId)?.name : null;
      const articleLimit = Math.min(limit, 300);
      const articleResult = selectedTeam
        ? await sql`
            SELECT id, ai_title AS title, ai_summary AS summary, team, category,
                   source, link, pub_date, created_at
            FROM news
            WHERE category IS NOT NULL AND team = ${selectedTeam}
            ORDER BY pub_date DESC
            LIMIT ${articleLimit}
          `
        : await sql`
            SELECT id, ai_title AS title, ai_summary AS summary, team, category,
                   source, link, pub_date, created_at
            FROM news
            WHERE category IS NOT NULL
            ORDER BY pub_date DESC
            LIMIT ${articleLimit}
          `;
      articles = articleResult.rows as MarketArticleRow[];
    } catch (newsError) {
      // Durante il primo avvio lo schema può non essere ancora migrato. I dati
      // trasferimenti storici continuano comunque a essere restituiti.
      console.warn('[mercato/live] News Smart Aggregator non ancora disponibili:', newsError);
    }

    return NextResponse.json({
      transfers,
      articles,
      total: transfers.length,
      articleTotal: articles.length,
      lastUpdated: articles[0]?.created_at || transfers[0]?.created_at || null,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error('[mercato/live] Errore DB:', message);
    return NextResponse.json({ transfers: [], articles: [] });
  }
}
