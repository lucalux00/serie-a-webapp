/**
 * GET /api/migrate/cleanup-transfers
 * Rimuove i record "sporchi" nella tabella transfers dove il campo player
 * contiene interi titoli di notizie (lunghezza > 60 caratteri).
 * Eseguire una sola volta dopo il fix del cron mercato.
 */
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Rimuove record dove "player" sembra un titolo di notizia (>60 chars o contiene "Calciomercato")
    const result = await sql`
      DELETE FROM transfers
      WHERE LENGTH(player) > 60
         OR player ILIKE '%calciomercato%'
         OR player ILIKE '%ufficiale:%'
         OR player ILIKE '%serie a%'
         OR player ILIKE '%serie b%'
      RETURNING id, player
    `;

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
      rows: result.rows.map(r => ({ id: r.id, player: r.player.slice(0, 50) + '...' })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
