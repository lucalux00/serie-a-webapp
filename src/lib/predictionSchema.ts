import "server-only";

import { sql } from "@vercel/postgres";

let schemaPromise: Promise<void> | null = null;

export function ensurePredictionSchema() {
  if (!schemaPromise) {
    schemaPromise = setupPredictionSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

async function setupPredictionSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS daily_ai_predictions (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL UNIQUE,
      home_team VARCHAR(200) NOT NULL,
      away_team VARCHAR(200) NOT NULL,
      match_date TIMESTAMPTZ NOT NULL,
      competition VARCHAR(100),
      quotes JSONB NOT NULL DEFAULT '[]',
      analysis TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS competition_code VARCHAR(20)`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS matchday INTEGER`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS stage VARCHAR(80)`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS status VARCHAR(20)`;
  await sql`UPDATE daily_ai_predictions SET status = 'PUBLISHED' WHERE status IS NULL`;
  await sql`ALTER TABLE daily_ai_predictions ALTER COLUMN status SET DEFAULT 'DRAFT'`;
  await sql`ALTER TABLE daily_ai_predictions ALTER COLUMN status SET NOT NULL`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS published_by TEXT`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS model_version VARCHAR(80) NOT NULL DEFAULT 'baseline-v1'`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS weights_snapshot JSONB NOT NULL DEFAULT '{}'`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS final_home_score INTEGER`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS final_away_score INTEGER`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS primary_is_correct BOOLEAN`;
  await sql`ALTER TABLE daily_ai_predictions ADD COLUMN IF NOT EXISTS result_ingested_at TIMESTAMPTZ`;

  await sql`CREATE INDEX IF NOT EXISTS idx_daily_predictions_schedule ON daily_ai_predictions (competition_code, match_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_predictions_review ON daily_ai_predictions (status, match_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_predictions_results ON daily_ai_predictions (result_ingested_at, match_date)`;

  await sql`
    CREATE TABLE IF NOT EXISTS prediction_evaluations (
      id BIGSERIAL PRIMARY KEY,
      prediction_id INTEGER NOT NULL REFERENCES daily_ai_predictions(id) ON DELETE CASCADE,
      tier VARCHAR(20) NOT NULL,
      market_key VARCHAR(80) NOT NULL,
      pick TEXT NOT NULL,
      confidence NUMERIC(5,2),
      actual_result VARCHAR(20) NOT NULL,
      is_correct BOOLEAN,
      brier_score NUMERIC(8,6),
      error_message TEXT,
      evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(prediction_id, tier)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_prediction_evaluations_market ON prediction_evaluations (market_key, evaluated_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS prediction_model_weights (
      id BIGSERIAL PRIMARY KEY,
      version VARCHAR(80) NOT NULL UNIQUE,
      weights JSONB NOT NULL,
      metrics JSONB NOT NULL DEFAULT '{}',
      sample_size INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_prediction_model_weights_active ON prediction_model_weights (active, created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS prediction_learning_runs (
      id BIGSERIAL PRIMARY KEY,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
      processed_matches INTEGER NOT NULL DEFAULT 0,
      evaluated_picks INTEGER NOT NULL DEFAULT 0,
      weights_version VARCHAR(80),
      errors JSONB NOT NULL DEFAULT '[]'
    )
  `;

  await sql`
    CREATE OR REPLACE FUNCTION protect_prediction_content()
    RETURNS trigger AS $$
    BEGIN
      IF NEW.match_id IS DISTINCT FROM OLD.match_id
        OR NEW.home_team IS DISTINCT FROM OLD.home_team
        OR NEW.away_team IS DISTINCT FROM OLD.away_team
        OR NEW.match_date IS DISTINCT FROM OLD.match_date
        OR NEW.competition IS DISTINCT FROM OLD.competition
        OR NEW.competition_code IS DISTINCT FROM OLD.competition_code
        OR NEW.matchday IS DISTINCT FROM OLD.matchday
        OR NEW.stage IS DISTINCT FROM OLD.stage
        OR NEW.quotes IS DISTINCT FROM OLD.quotes
        OR NEW.analysis IS DISTINCT FROM OLD.analysis
        OR NEW.model_version IS DISTINCT FROM OLD.model_version
        OR NEW.weights_snapshot IS DISTINCT FROM OLD.weights_snapshot
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
      THEN
        RAISE EXCEPTION 'Prediction content is immutable after creation';
      END IF;
      IF NEW.status NOT IN ('DRAFT', 'PUBLISHED') THEN
        RAISE EXCEPTION 'Invalid prediction status';
      END IF;
      IF OLD.status = 'PUBLISHED' AND NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Published predictions cannot return to draft';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'daily_ai_predictions_immutable') THEN
        CREATE TRIGGER daily_ai_predictions_immutable
        BEFORE UPDATE ON daily_ai_predictions
        FOR EACH ROW EXECUTE FUNCTION protect_prediction_content();
      END IF;
    END $$
  `;
}
