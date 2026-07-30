import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, preferences } = body;
    const user = await getUserFromCookie();

    if (!subscription || !user) {
      return NextResponse.json({ error: 'Mancano parametri obbligatori' }, { status: 400 });
    }

    // Crea tabella se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
          preferences JSONB NOT NULL DEFAULT '{"teamNews":true,"teamTransfers":true,"matchStart":true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(endpoint)
      );
    `;

    // Inserisce o aggiorna la sottoscrizione
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (
        ${user.userId},
        ${subscription.endpoint}, 
        ${subscription.keys.p256dh}, 
        ${subscription.keys.auth}
      )
      ON CONFLICT (endpoint) DO UPDATE 
      SET user_id = EXCLUDED.user_id,
          p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        preferences = ${JSON.stringify({
          teamNews: Boolean(preferences?.teamNews),
          teamTransfers: Boolean(preferences?.teamTransfers),
          matchStart: Boolean(preferences?.matchStart),
        })}::jsonb;
    `;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Subscription error:', error);
    const message = error instanceof Error ? error.message : 'Errore interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
