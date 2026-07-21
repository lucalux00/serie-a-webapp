import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LEAGUES = ['A', 'B', 'PL', 'LL', 'BL', 'L1'];

export async function GET(request: Request) {
  try {
    // Verifica autorizzazione (Vercel invia automaticamente il CRON_SECRET come Bearer token)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    console.log('[Cron Classifica] Avvio warm-up cache per tutti i campionati...');

    // Scalda la cache per tutti i campionati principali in parallelo
    const results = await Promise.allSettled(
      LEAGUES.map(async (league) => {
        const url = `${baseUrl}/api/classifiche?league=${league}&type=standings`;
        const res = await fetch(url, { cache: 'no-store' });
        return { league, status: res.status, ok: res.ok };
      })
    );

    const summary = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return { league: LEAGUES[i], error: r.reason?.message ?? 'unknown error' };
    });

    const successCount = summary.filter((s: any) => s.ok).length;
    console.log(`[Cron Classifica] Cache warmed: ${successCount}/${LEAGUES.length} campionati.`);

    return NextResponse.json({
      success: true,
      message: `Cache classifica aggiornata per ${successCount}/${LEAGUES.length} campionati`,
      timestamp: new Date().toISOString(),
      details: summary,
    });
  } catch (err: any) {
    console.error('[Cron Classifica Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
