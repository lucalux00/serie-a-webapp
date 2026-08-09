import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sql } from '@vercel/postgres';
import { ensureStripeUserColumns, getStripe, isActiveSubscriptionStatus } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const userId = subscription.metadata?.userId;
  const priceId = subscription.items.data[0]?.price?.id || null;
  const periodEndSeconds = subscription.items.data[0]?.current_period_end;
  const periodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null;
  const isPremium = isActiveSubscriptionStatus(subscription.status);

  if (userId) {
    await sql`
      UPDATE users
      SET stripe_customer_id = ${customerId},
          stripe_subscription_id = ${subscription.id},
          stripe_subscription_status = ${subscription.status},
          stripe_price_id = ${priceId},
          is_premium = ${isPremium},
          premium_until = ${periodEnd}
      WHERE id = ${userId}
    `;
    return;
  }

  await sql`
    UPDATE users
    SET stripe_subscription_id = ${subscription.id},
        stripe_subscription_status = ${subscription.status},
        stripe_price_id = ${priceId},
        is_premium = ${isPremium},
        premium_until = ${periodEnd}
    WHERE stripe_customer_id = ${customerId}
  `;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET non configurata.' }, { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Firma Stripe mancante.' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Stripe webhook signature error:', error);
    return NextResponse.json({ error: 'Firma webhook non valida.' }, { status: 400 });
  }

  try {
    await ensureStripeUserColumns();
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (userId && customerId) {
          await sql`UPDATE users SET stripe_customer_id = ${customerId}, stripe_subscription_id = ${subscriptionId || null} WHERE id = ${userId}`;
        }
        if (subscriptionId) await syncSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook ${event.type} error:`, error);
    return NextResponse.json({ error: 'Errore durante la sincronizzazione dell’abbonamento.' }, { status: 500 });
  }
}
