import { NextResponse } from 'next/server';
// import { sql } from '@vercel/postgres'; // Decommentare quando si integra Stripe + DB

// GET /api/subscription/status
// Placeholder: restituisce sempre 'free'. 
// Quando integri Stripe:
//   1. Leggi il cookie di sessione per ottenere l'userId
//   2. Fai query su DB: SELECT plan, expires_at FROM subscriptions WHERE user_id = $1
//   3. Verifica con Stripe API che la subscription sia ancora attiva
//   4. Restituisci il risultato

export async function GET() {
  // TODO: integrare con Stripe + DB
  // Esempio di integrazione futura:
  // const session = await getServerSession(); 
  // const sub = await sql`SELECT * FROM subscriptions WHERE user_id = ${session.userId} LIMIT 1`;
  // const isPremium = sub.rows[0]?.plan === 'pro' && new Date(sub.rows[0].expires_at) > new Date();

  return NextResponse.json({
    isPremium: false,
    plan: 'free',
    expiresAt: null,
    // Quando Stripe è integrato, questi campi avranno valori reali:
    // stripeCustomerId: null,
    // stripeSubscriptionId: null,
  });
}
