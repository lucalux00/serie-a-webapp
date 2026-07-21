import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET /api/migrate/banners
// Crea la tabella banners e la tabella subscriptions se non esistono.
// Idempotente: usa CREATE TABLE IF NOT EXISTS, può essere chiamata più volte senza problemi.

export async function GET() {
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ error: 'POSTGRES_URL non impostata.' }, { status: 500 });
  }

  try {
    // Tabella banners
    await sql`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        message TEXT NOT NULL,
        link VARCHAR(500),
        link_label VARCHAR(100),
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        is_active BOOLEAN NOT NULL DEFAULT true,
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Tabella subscriptions (pronta per Stripe)
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(20) NOT NULL DEFAULT 'free',
        stripe_customer_id VARCHAR(200),
        stripe_subscription_id VARCHAR(200),
        status VARCHAR(50) NOT NULL DEFAULT 'inactive',
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

    // Inserisci un banner di esempio (se la tabella era vuota)
    const existing = await sql`SELECT COUNT(*) FROM banners`;
    if (parseInt(existing.rows[0].count) === 0) {
      await sql`
        INSERT INTO banners (title, message, link, link_label, type, is_active)
        VALUES (
          '⚡ AI Pro',
          'Sblocca statistiche avanzate AI per il tuo Fantacalcio!',
          '/fantacalcio',
          'Scopri',
          'promo',
          true
        )
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Tabelle banners e subscriptions create con successo.',
    });
  } catch (err) {
    console.error('Migration banners error:', err);
    return NextResponse.json(
      { error: 'Errore durante la migrazione', detail: String(err) },
      { status: 500 }
    );
  }
}
