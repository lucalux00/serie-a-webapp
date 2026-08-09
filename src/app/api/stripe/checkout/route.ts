import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getSiteUrl, getStripe, ensureStripeUserColumns, isActiveSubscriptionStatus } from '@/lib/stripe';
import { getUserFromCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Accedi prima di attivare Fanta Pro.' }, { status: 401 });

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: 'Stripe non è ancora configurato: manca STRIPE_PRO_PRICE_ID.' }, { status: 503 });

  try {
    await ensureStripeUserColumns();
    const stripe = getStripe();
    const { rows } = await sql`
      SELECT email, stripe_customer_id, stripe_subscription_id, stripe_subscription_status
      FROM users WHERE id = ${user.userId} LIMIT 1
    `;
    const dbUser = rows[0];
    if (!dbUser) return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 });

    const existingStatus = dbUser.stripe_subscription_status as string | null;
    if (isActiveSubscriptionStatus(existingStatus) && dbUser.stripe_customer_id) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripe_customer_id,
        return_url: `${getSiteUrl()}/profilo`,
      });
      return NextResponse.json({ url: portal.url, mode: 'portal' });
    }

    const customer = dbUser.stripe_customer_id
      ? dbUser.stripe_customer_id
      : await stripe.customers.create({
          email: dbUser.email || user.email,
          name: user.name,
          metadata: { userId: String(user.userId) },
        });

    if (!dbUser.stripe_customer_id) {
      await sql`UPDATE users SET stripe_customer_id = ${customer.id} WHERE id = ${user.userId}`;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { name: 'auto', address: 'auto' },
      metadata: { userId: String(user.userId), plan: 'pro' },
      subscription_data: {
        metadata: { userId: String(user.userId), plan: 'pro' },
      },
      success_url: `${getSiteUrl()}/profilo?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getSiteUrl()}/profilo?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('POST /api/stripe/checkout error:', error);
    return NextResponse.json({ error: 'Impossibile avviare il checkout Stripe.' }, { status: 500 });
  }
}
