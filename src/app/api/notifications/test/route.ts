import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { sql } from '@vercel/postgres';

webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function POST(request: Request) {
  try {
    const { userId, title, body, icon, url } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId richiesto' }, { status: 400 });
    }

    // Prendi le sottoscrizioni dell'utente
    const subscriptions = await sql`
      SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}
    `;

    if (subscriptions.rowCount === 0) {
      return NextResponse.json({ error: 'Nessuna sottoscrizione trovata' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: title || 'Nuovo Aggiornamento!',
      body: body || 'Hai una nuova notifica.',
      icon: icon || '/icon-192x192.png',
      url: url || '/'
    });

    const sendPromises = subscriptions.rows.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      return webpush.sendNotification(pushSubscription, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Sottoscrizione scaduta o rimossa
            return sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
          } else {
            console.error('Errore invio notifica:', err);
          }
        });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, count: subscriptions.rowCount });
  } catch (error: any) {
    console.error('Test notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
