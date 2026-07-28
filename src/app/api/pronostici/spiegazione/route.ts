/**
 * GET /api/pronostici/spiegazione
 *
 * Genera (o restituisce dalla cache) l'analisi testuale HTML per un singolo pronostico.
 *
 * Protezioni:
 * - Riservato agli utenti PREMIUM (o admin): utenti free ricevono 403
 * - DB cache: ogni match_id viene generato una sola volta
 * - Rate limit: max 5 richieste/minuto per IP (contro abuse anche tra premium)
 * - Prompt ottimizzato: ~60 parole, output max 300 caratteri
 * - SDK centralizzato da lib/gemini.ts
 */
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { generateText } from '@/lib/gemini';
import { getUserFromCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');
    const matchStr = searchParams.get('match');
    const pick = searchParams.get('pick');

    if (!matchId || !matchStr || !pick) {
      return NextResponse.json({ error: 'Parametri mancanti (match_id, match, pick)' }, { status: 400 });
    }

    // ── CHECK PREMIUM ──────────────────────────────────────────────────────
    const jwtUser = await getUserFromCookie();

    if (!jwtUser) {
      return NextResponse.json(
        { error: 'premium_required', message: 'Accesso riservato agli utenti Premium. Effettua il login.' },
        { status: 403 }
      );
    }

    // Admin ha sempre accesso
    const isAdmin = ADMIN_EMAILS.includes(jwtUser.email);

    if (!isAdmin) {
      // Verifica is_premium nel DB users
      const { rows: userRows } = await sql`
        SELECT is_premium FROM users WHERE id = ${jwtUser.userId} LIMIT 1
      `;
      const isPremium = userRows[0]?.is_premium === true;

      if (!isPremium) {
        return NextResponse.json(
          { error: 'premium_required', message: 'Questa funzionalità è riservata agli utenti Premium.' },
          { status: 403 }
        );
      }
    }
    // ── FINE CHECK PREMIUM ─────────────────────────────────────────────────

    // ── RATE LIMIT per IP ─────────────────────────────────────────────────
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const { rows: recentCalls } = await sql`
      SELECT id FROM spiegazione_rate_limit
      WHERE ip = ${clientIp}
        AND created_at > NOW() - INTERVAL '1 minute'
    `;

    if (recentCalls.length >= 5) {
      return NextResponse.json(
        { analysis: '<p>Troppe richieste. Riprova tra qualche secondo.</p>', rateLimited: true },
        { status: 429 }
      );
    }

    // Registra questa richiesta
    await sql`INSERT INTO spiegazione_rate_limit (ip) VALUES (${clientIp})`;
    // ── FINE RATE LIMIT ───────────────────────────────────────────────────

    // 1. Check cache DB
    const { rows: cached } = await sql`
      SELECT analysis FROM ml_explanations WHERE match_id = ${matchId}
    `;

    if (cached.length > 0) {
      return NextResponse.json({ analysis: cached[0].analysis, cached: true });
    }

    // 2. Genera con Gemini — prompt compatto
    const prompt = `Sei un analista sportivo sintetico.
Partita: "${matchStr}" | Pronostico: "${pick}"
Scrivi 2 brevi paragrafi HTML (MAX 300 caratteri totali) in italiano che giustificano questa scelta.
Usa solo tag <p> e <strong>. Nessun markdown.`;

    const analysis = await generateText(prompt);

    // 3. Salva in cache (anche in caso di errore, per evitare loop di retry)
    const finalAnalysis = analysis || '<p>Analisi statistica temporaneamente non disponibile.</p>';

    await sql`
      INSERT INTO ml_explanations (match_id, analysis)
      VALUES (${matchId}, ${finalAnalysis})
      ON CONFLICT (match_id) DO NOTHING
    `;

    return NextResponse.json({ analysis: finalAnalysis, cached: false });

  } catch (error: any) {
    console.error('[spiegazione] Errore:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
