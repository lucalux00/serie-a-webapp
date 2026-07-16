import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !userId) {
      return NextResponse.json({ error: 'Mancano parametri obbligatori' }, { status: 400 });
    }

    // Crea tabella se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        preferences JSONB DEFAULT '{"matchStart": true, "goals": true, "cards": false}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(endpoint)
      );
    `;

    // Inserisce o aggiorna la sottoscrizione
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (
        ${userId}, 
        ${subscription.endpoint}, 
        ${subscription.keys.p256dh}, 
        ${subscription.keys.auth}
      )
      ON CONFLICT (endpoint) DO UPDATE 
      SET user_id = EXCLUDED.user_id,
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth;
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
