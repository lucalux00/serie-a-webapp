/**
 * GET /api/pronostici/odierni
 *
 * Restituisce i pronostici AI per i prossimi 3 giorni.
 *
 * LAZY CRON (fixed):
 * - Attiva il cron pronostici solo se NON esistono già partite future nel DB
 * - Impone un cooldown di 60 minuti tramite la tabella cron_lock
 * - Passa il CRON_SECRET per autenticare la chiamata interna
 */
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // ── LAZY CRON — con cooldown e protezione anti-loop ──────────────────
    try {
      // 1. Ci sono già partite FUTURE nel DB?
      const { rows: futureMatches } = await sql`
        SELECT id FROM daily_ai_predictions
        WHERE match_date >= NOW()
        LIMIT 1
      `;

      if (futureMatches.length === 0) {
        // 2. È passata più di 1 ora dall'ultimo tentativo?
        const { rows: lockRows } = await sql`
          SELECT created_at FROM cron_lock
          WHERE job_name = 'pronostici'
            AND created_at > NOW() - INTERVAL '60 minutes'
        `;

        if (lockRows.length === 0) {
          // 3. Acquisisci il lock PRIMA di chiamare il cron
          await sql`
            INSERT INTO cron_lock (job_name, created_at)
            VALUES ('pronostici', NOW())
            ON CONFLICT (job_name) DO UPDATE SET created_at = NOW()
          `;

          // 4. Avvia il cron in background con autenticazione corretta
          const cronSecret = process.env.CRON_SECRET || '';
          fetch(new URL('/api/cron/pronostici', request.url).toString(), {
            headers: { Authorization: `Bearer ${cronSecret}` },
          }).catch((e) => console.error('[odierni] Lazy cron fire-and-forget error:', e));

          console.log('[odierni] Lazy cron pronostici avviato (nessuna partita futura in DB)');
        } else {
          console.log('[odierni] Lazy cron skippato: cooldown attivo');
        }
      }
    } catch (lazyError) {
      // Non bloccare la risposta per errori nel lazy cron
      console.warn('[odierni] Lazy cron check fallito:', lazyError);
    }
    // ── FINE LAZY CRON ────────────────────────────────────────────────────

    // Restituisci i pronostici per i prossimi 3 giorni
    const { rows } = await sql`
      SELECT
        match_id   AS id,
        home_team || ' - ' || away_team AS match,
        competition,
        match_date AS date,
        quotes,
        analysis
      FROM daily_ai_predictions
      WHERE match_date >= NOW()
        AND match_date <= NOW() + INTERVAL '3 days'
      ORDER BY match_date ASC
      LIMIT 10
    `;

    return NextResponse.json({ predictions: rows });

  } catch (error: any) {
    console.error('[odierni] Errore:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
