/**
 * /api/migrate/setup — Crea tutte le tabelle di sistema se non esistono.
 * NON usa DROP, è sicuro da eseguire su DB esistente.
 * Richiede CRON_SECRET come Bearer token.
 */
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ error: 'POSTGRES_URL non configurata' }, { status: 500 });
  }

  const results: string[] = [];

  try {
    // ── TABELLE ESISTENTI (safety check) ──────────────────────────────────

    // transfers — tabella principale del calciomercato
    await sql`
      CREATE TABLE IF NOT EXISTS transfers (
        id        SERIAL PRIMARY KEY,
        team_id   VARCHAR(100) NOT NULL,
        league    VARCHAR(10)  NOT NULL DEFAULT 'A',
        type      VARCHAR(50)  NOT NULL,
        player    VARCHAR(200) NOT NULL,
        other_team VARCHAR(200),
        fee       VARCHAR(100),
        date      VARCHAR(50),
        status    VARCHAR(50)  DEFAULT 'Rumor',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    results.push('✅ transfers: OK');

    // Aggiunge colonna league se non esiste (per DB già esistenti)
    await sql`
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS league VARCHAR(10) NOT NULL DEFAULT 'A';
    `;
    await sql`
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    `;
    await sql`
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS source_url TEXT;
    `;
    await sql`
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS source_name VARCHAR(120);
    `;
    results.push('✅ transfers: colonne league/created_at verificate');

    // news — unica tabella condivisa da Notizie e Smart Aggregator.
    await sql`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        link TEXT NOT NULL UNIQUE,
        pub_date TIMESTAMPTZ NOT NULL,
        source VARCHAR(100) NOT NULL,
        clean_title VARCHAR(500),
        time VARCHAR(50),
        snippet TEXT,
        ai_title VARCHAR(500),
        ai_summary TEXT,
        team VARCHAR(100),
        category VARCHAR(40),
        ai_processed_at TIMESTAMPTZ,
        type VARCHAR(50) DEFAULT 'live',
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS snippet TEXT`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS ai_title VARCHAR(500)`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS ai_summary TEXT`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS team VARCHAR(100)`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS category VARCHAR(40)`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ`;
    results.push('✅ news Smart Aggregator: schema verificato');

    // ── NUOVE TABELLE ─────────────────────────────────────────────────────

    // cron_lock — previene il loop infinito del lazy cron pronostici
    await sql`
      CREATE TABLE IF NOT EXISTS cron_lock (
        job_name   TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    results.push('✅ cron_lock: OK');

    // mercato_cron_log — hash dei titoli RSS per evitare chiamate Gemini duplicate
    await sql`
      CREATE TABLE IF NOT EXISTS mercato_cron_log (
        id           SERIAL PRIMARY KEY,
        titles_hash  TEXT NOT NULL,
        ai_called    BOOLEAN DEFAULT FALSE,
        inserted     INTEGER DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    results.push('✅ mercato_cron_log: OK');

    // spiegazione_rate_limit — protezione anti-abuse per /api/pronostici/spiegazione
    await sql`
      CREATE TABLE IF NOT EXISTS spiegazione_rate_limit (
        id         SERIAL PRIMARY KEY,
        ip         TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    // Indice per query rapide per IP
    await sql`
      CREATE INDEX IF NOT EXISTS idx_spiegazione_rl_ip ON spiegazione_rate_limit(ip, created_at);
    `;
    results.push('✅ spiegazione_rate_limit: OK');

    // daily_ai_predictions — previsioni AI Gemini per i prossimi match
    await sql`
      CREATE TABLE IF NOT EXISTS daily_ai_predictions (
        id          SERIAL PRIMARY KEY,
        match_id    INTEGER NOT NULL UNIQUE,
        home_team   VARCHAR(200) NOT NULL,
        away_team   VARCHAR(200) NOT NULL,
        match_date  TIMESTAMPTZ NOT NULL,
        competition VARCHAR(100),
        quotes      JSONB NOT NULL DEFAULT '[]',
        analysis    TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    results.push('✅ daily_ai_predictions: OK');

    // ml_explanations — cache spiegazioni testuali on-demand
    await sql`
      CREATE TABLE IF NOT EXISTS ml_explanations (
        match_id   TEXT PRIMARY KEY,
        analysis   TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    results.push('✅ ml_explanations: OK');

    // Aggiunge colonna is_premium alla tabella users (per la spiegazione pronostici premium)
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;
    `;
    results.push('✅ users.is_premium: colonna verificata');

    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
    `;
    results.push('Premium expiry column verified');

    // Pulizia log vecchi (>30 giorni) per non far crescere le tabelle
    await sql`DELETE FROM mercato_cron_log WHERE created_at < NOW() - INTERVAL '30 days';`;
    await sql`DELETE FROM spiegazione_rate_limit WHERE created_at < NOW() - INTERVAL '1 day';`;
    results.push('✅ Pulizia log vecchi: OK');

    return NextResponse.json({
      success: true,
      message: 'Setup completato — tutte le tabelle sono pronte',
      details: results,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error('[migrate/setup] Error:', error);
    return NextResponse.json({
      success: false,
      error: message,
      completedSteps: results,
    }, { status: 500 });
  }
}
