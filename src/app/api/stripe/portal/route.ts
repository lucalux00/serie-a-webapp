import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getSiteUrl, getStripe, ensureStripeUserColumns } from '@/lib/stripe';
import { getUserFromCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Accedi prima di gestire l’abbonamento.' }, { status: 401 });

  try {
    await ensureStripeUserColumns();
    const { rows } = await sql`SELECT stripe_customer_id FROM users WHERE id = ${user.userId} LIMIT 1`;
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) return NextResponse.json({ error: 'Nessun abbonamento Stripe trovato.' }, { status: 404 });

    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getSiteUrl()}/profilo`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('POST /api/stripe/portal error:', error);
    return NextResponse.json({ error: 'Impossibile aprire la gestione abbonamento.' }, { status: 500 });
  }
}
