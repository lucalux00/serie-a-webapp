import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ALL_TEAMS } from '@/data/teams';
import { configureWebPush, sendPush } from '@/lib/webPush';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type SubscriptionRow = { id: number; endpoint: string; p256dh: string; auth: string; favorite_team: string; preferences: { teamNews?: boolean; teamTransfers?: boolean }; };

async function reserveDelivery(subscriptionId: number, eventKey: string) {
  const result = await sql`INSERT INTO push_deliveries (subscription_id, event_key) VALUES (${subscriptionId}, ${eventKey}) ON CONFLICT DO NOTHING RETURNING id`;
  return (result.rowCount ?? 0) > 0;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!configureWebPush()) return NextResponse.json({ error: 'VAPID non configurato' }, { status: 503 });

  await sql`CREATE TABLE IF NOT EXISTS push_deliveries (id SERIAL PRIMARY KEY, subscription_id INTEGER NOT NULL, event_key TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(subscription_id, event_key))`;
  let sent = 0;
  const preferences = await sql`SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth, u.favorite_team FROM push_subscriptions ps JOIN users u ON u.id::text = ps.user_id WHERE u.favorite_team IS NOT NULL`;

  for (const sub of preferences.rows as SubscriptionRow[]) {
    const team = ALL_TEAMS.find((item) => item.id === sub.favorite_team);
    if (!team) continue;
    const term = `%${team.name}%`;
    const news = sub.preferences?.teamNews ? await sql`SELECT id, title FROM news WHERE type = 'live' AND created_at > NOW() - INTERVAL '25 minutes' AND (title || ' ' || COALESCE(snippet, '')) ILIKE ${term} ORDER BY id DESC LIMIT 3` : { rows: [] as Array<{ id: number; title: string }> };
    for (const item of news.rows) {
      if (!await reserveDelivery(sub.id, `news:${item.id}`)) continue;
      try { await sendPush(sub, { title: `${team.name}: nuova notizia`, body: item.title, url: '/notizie', tag: `news-${item.id}` }); sent++; } catch (error: unknown) { if (typeof error === 'object' && error && 'statusCode' in error && [404, 410].includes(Number(error.statusCode))) await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`; }
    }
    const transfers = sub.preferences?.teamTransfers ? await sql`SELECT id, player, type FROM transfers WHERE team_id = ${team.id} AND created_at > NOW() - INTERVAL '35 minutes' ORDER BY id DESC LIMIT 3` : { rows: [] as Array<{ id: number; player: string; type: string }> };
    for (const item of transfers.rows) {
      if (!await reserveDelivery(sub.id, `transfer:${item.id}`)) continue;
      try { await sendPush(sub, { title: `${team.name}: mercato`, body: `${item.type}: ${item.player}`, url: `/squadra/${team.id}?tab=mercato`, tag: `transfer-${item.id}` }); sent++; } catch (error: unknown) { if (typeof error === 'object' && error && 'statusCode' in error && [404, 410].includes(Number(error.statusCode))) await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`; }
    }
  }
  return NextResponse.json({ success: true, sent });
}
