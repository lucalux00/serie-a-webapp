import Stripe from 'stripe';
import { sql } from '@vercel/postgres';

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY non configurata');
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://tatticaepronostici.it').replace(/\/$/, '');
}

/**
 * Keeps the Stripe fields on the existing UUID-based users table.
 * This is idempotent and avoids relying on the legacy subscriptions table,
 * whose original migration used an incompatible integer user_id.
 */
export async function ensureStripeUserColumns() {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ`;
}

export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}
