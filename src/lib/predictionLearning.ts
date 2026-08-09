import "server-only";

import { sql } from "@vercel/postgres";
import { ensurePredictionSchema } from "@/lib/predictionSchema";

type StoredQuote = {
  tier?: string;
  type?: string;
  t?: string;
  pick?: string;
  p?: string;
  confidence?: number;
  c?: number;
};

type PendingPrediction = {
  id: number;
  match_id: number;
  match_date: string | Date;
  quotes: StoredQuote[] | string;
};

type ResultMatch = {
  id: number;
  status: string;
  score?: { fullTime?: { home?: number | null; away?: number | null } };
};

export type PredictionWeights = Record<string, number>;

export const DEFAULT_PREDICTION_WEIGHTS: PredictionWeights = {
  double_chance: 0.64,
  goals_over_1_5: 0.66,
  goals_under_3_5: 0.60,
  btts_yes: 0.54,
  draw: 0.39,
  goals_over_2_5: 0.47,
  result_over_1_5: 0.44,
  other: 0.50,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseQuotes(value: PendingPrediction["quotes"]): StoredQuote[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function predictionMarketKey(type: string, pick: string) {
  const value = normalized(`${type} ${pick}`);
  if (value.includes("1x") || value.includes("x2") || value.includes("doppia chance")) return "double_chance";
  if (value.includes("entramb") || value.includes("gol/no gol") || value.includes("both teams")) return "btts_yes";
  if (value.includes("under 3.5")) return "goals_under_3_5";
  if (value.includes("over 2.5")) return "goals_over_2_5";
  if (value.includes("over 1.5") && /(^|\s)[12]\s*\+/.test(value)) return "result_over_1_5";
  if (value.includes("over 1.5")) return "goals_over_1_5";
  if (value.includes("pareggio") || normalized(pick) === "x") return "draw";
  return "other";
}

export function evaluatePredictionPick(pick: string, homeScore: number, awayScore: number): boolean | null {
  const value = normalized(pick);
  const total = homeScore + awayScore;

  if (/^1\s*\+/.test(value)) {
    const totalRule = evaluatePredictionPick(value.replace(/^1\s*\+\s*/, ""), homeScore, awayScore);
    return totalRule === null ? null : homeScore > awayScore && totalRule;
  }
  if (/^2\s*\+/.test(value)) {
    const totalRule = evaluatePredictionPick(value.replace(/^2\s*\+\s*/, ""), homeScore, awayScore);
    return totalRule === null ? null : awayScore > homeScore && totalRule;
  }
  if (value.includes("1x")) return homeScore >= awayScore;
  if (value.includes("x2")) return awayScore >= homeScore;
  if (value === "12") return homeScore !== awayScore;
  if (value === "1" || value.includes("vittoria casa")) return homeScore > awayScore;
  if (value === "2" || value.includes("vittoria ospite")) return awayScore > homeScore;
  if (value === "x" || value.includes("pareggio")) return homeScore === awayScore;
  if (value.includes("entrambi segnano") || value === "gol" || value === "yes") return homeScore > 0 && awayScore > 0;
  if (value.includes("no gol") || value.includes("non segnano") || value === "no") return homeScore === 0 || awayScore === 0;

  const totalMatch = value.match(/(over|under)\s*([0-9]+(?:\.[0-9]+)?)/);
  if (totalMatch) {
    const threshold = Number(totalMatch[2]);
    return totalMatch[1] === "over" ? total > threshold : total < threshold;
  }

  const rangeMatch = value.match(/([0-9]+)\s*[-–]\s*([0-9]+)\s*(?:gol)?/);
  if (rangeMatch) return total >= Number(rangeMatch[1]) && total <= Number(rangeMatch[2]);
  return null;
}

export async function getActivePredictionModel() {
  await ensurePredictionSchema();
  const { rows } = await sql`
    SELECT version, weights
    FROM prediction_model_weights
    ORDER BY active DESC, created_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  const storedWeights = row?.weights && typeof row.weights === "object" ? row.weights as PredictionWeights : {};
  return {
    version: String(row?.version || "baseline-v1"),
    weights: { ...DEFAULT_PREDICTION_WEIGHTS, ...storedWeights },
  };
}

export function calibratedConfidence(
  type: string,
  pick: string,
  baseConfidence: number,
  weights: PredictionWeights,
) {
  const learned = weights[predictionMarketKey(type, pick)] ?? weights.other ?? 0.5;
  return Math.round(clamp((baseConfidence * 0.35) + (learned * 100 * 0.65), 30, 88));
}

async function fetchFinishedMatches(apiKey: string, pending: PendingPrediction[]) {
  if (pending.length === 0) return new Map<number, ResultMatch>();
  const earliest = pending.reduce((value, row) => {
    const date = new Date(row.match_date).getTime();
    return Math.min(value, date);
  }, Date.now());
  const dateFrom = new Date(Math.max(earliest - 86_400_000, Date.now() - 21 * 86_400_000)).toISOString().slice(0, 10);
  const dateTo = new Date().toISOString().slice(0, 10);
  const start = new Date(`${dateFrom}T00:00:00.000Z`);
  const end = new Date(`${dateTo}T00:00:00.000Z`);
  const ranges: Array<{ from: string; to: string }> = [];
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += 7 * 86_400_000) {
    ranges.push({
      from: new Date(cursor).toISOString().slice(0, 10),
      to: new Date(Math.min(cursor + 6 * 86_400_000, end.getTime())).toISOString().slice(0, 10),
    });
  }

  const payloads = await Promise.all(ranges.map(async (range) => {
    const response = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${range.from}&dateTo=${range.to}`, {
      headers: { "X-Auth-Token": apiKey },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`football-data results ${response.status}`);
    return response.json() as Promise<{ matches?: ResultMatch[] }>;
  }));
  const matches = payloads.flatMap((payload) => payload.matches || []);
  return new Map(matches.filter((match) => match.status === "FINISHED").map((match) => [match.id, match]));
}

async function recalibrateWeights() {
  const { rows: latestRows } = await sql`
    SELECT version, weights, created_at
    FROM prediction_model_weights
    ORDER BY active DESC, created_at DESC
    LIMIT 1
  `;
  const latest = latestRows[0];
  if (latest && new Date(latest.created_at).getTime() > Date.now() - 6 * 86_400_000) return null;

  const { rows } = await sql`
    SELECT
      market_key,
      COUNT(*)::int AS samples,
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct
    FROM prediction_evaluations
    WHERE is_correct IS NOT NULL
      AND evaluated_at >= NOW() - INTERVAL '180 days'
    GROUP BY market_key
  `;
  const sampleSize = rows.reduce((sum, row) => sum + Number(row.samples || 0), 0);
  if (sampleSize < 8) return null;

  const current = {
    ...DEFAULT_PREDICTION_WEIGHTS,
    ...(latest?.weights && typeof latest.weights === "object" ? latest.weights as PredictionWeights : {}),
  };
  const metrics: Record<string, { samples: number; accuracy: number }> = {};
  for (const row of rows) {
    const key = String(row.market_key);
    const samples = Number(row.samples || 0);
    const correct = Number(row.correct || 0);
    const prior = current[key] ?? current.other;
    current[key] = Number(clamp((correct + prior * 12) / (samples + 12), 0.25, 0.88).toFixed(4));
    metrics[key] = { samples, accuracy: Number((correct / samples).toFixed(4)) };
  }

  const version = `cal-${new Date().toISOString().slice(0, 10)}`;
  await sql`UPDATE prediction_model_weights SET active = FALSE WHERE active = TRUE`;
  await sql`
    INSERT INTO prediction_model_weights (version, weights, metrics, sample_size, active)
    VALUES (${version}, ${JSON.stringify(current)}, ${JSON.stringify(metrics)}, ${sampleSize}, TRUE)
    ON CONFLICT (version) DO UPDATE SET
      weights = EXCLUDED.weights,
      metrics = EXCLUDED.metrics,
      sample_size = EXCLUDED.sample_size,
      active = TRUE
  `;
  return version;
}

export async function runPredictionLearningPipeline(apiKey: string) {
  await ensurePredictionSchema();
  const { rows: runRows } = await sql`
    INSERT INTO prediction_learning_runs DEFAULT VALUES
    RETURNING id
  `;
  const runId = Number(runRows[0].id);
  const errors: string[] = [];
  let processedMatches = 0;
  let evaluatedPicks = 0;

  try {
    const { rows } = await sql<PendingPrediction>`
      SELECT id, match_id, match_date, quotes
      FROM daily_ai_predictions
      WHERE result_ingested_at IS NULL
        AND match_date < NOW() - INTERVAL '90 minutes'
        AND match_date >= NOW() - INTERVAL '21 days'
      ORDER BY match_date ASC
      LIMIT 250
    `;
    const finishedMatches = await fetchFinishedMatches(apiKey, rows);

    for (const prediction of rows) {
      const result = finishedMatches.get(prediction.match_id);
      const homeScore = result?.score?.fullTime?.home;
      const awayScore = result?.score?.fullTime?.away;
      if (typeof homeScore !== "number" || typeof awayScore !== "number") continue;

      const actualResult = `${homeScore}-${awayScore}`;
      const quotes = parseQuotes(prediction.quotes);
      let primaryIsCorrect: boolean | null = null;

      for (const [index, quote] of quotes.entries()) {
        const pick = String(quote.pick || quote.p || "").trim();
        if (!pick) continue;
        const tier = String(quote.tier || `quote-${index + 1}`);
        const type = String(quote.type || quote.t || "Esito");
        const confidence = clamp(Number(quote.confidence ?? quote.c ?? 50), 1, 99);
        const isCorrect = evaluatePredictionPick(pick, homeScore, awayScore);
        const probability = confidence / 100;
        const brierScore = isCorrect === null ? null : (probability - (isCorrect ? 1 : 0)) ** 2;
        if (tier === "safe" || primaryIsCorrect === null) primaryIsCorrect = isCorrect;

        const evaluationInsert = await sql`
          INSERT INTO prediction_evaluations
            (prediction_id, tier, market_key, pick, confidence, actual_result, is_correct, brier_score, error_message)
          VALUES
            (${prediction.id}, ${tier}, ${predictionMarketKey(type, pick)}, ${pick}, ${confidence},
             ${actualResult}, ${isCorrect}, ${brierScore}, ${isCorrect === null ? "Mercato non supportato dal valutatore" : null})
          ON CONFLICT (prediction_id, tier) DO NOTHING
        `;
        evaluatedPicks += evaluationInsert.rowCount || 0;
      }

      const resultUpdate = await sql`
        UPDATE daily_ai_predictions
        SET final_home_score = ${homeScore},
            final_away_score = ${awayScore},
            primary_is_correct = ${primaryIsCorrect},
            result_ingested_at = NOW()
        WHERE id = ${prediction.id}
          AND result_ingested_at IS NULL
      `;
      processedMatches += resultUpdate.rowCount || 0;
    }

    const weightsVersion = await recalibrateWeights();
    await sql`
      UPDATE prediction_learning_runs
      SET completed_at = NOW(), status = 'COMPLETED', processed_matches = ${processedMatches},
          evaluated_picks = ${evaluatedPicks}, weights_version = ${weightsVersion}, errors = ${JSON.stringify(errors)}
      WHERE id = ${runId}
    `;
    return { processedMatches, evaluatedPicks, weightsVersion, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto";
    errors.push(message);
    await sql`
      UPDATE prediction_learning_runs
      SET completed_at = NOW(), status = 'FAILED', processed_matches = ${processedMatches},
          evaluated_picks = ${evaluatedPicks}, errors = ${JSON.stringify(errors)}
      WHERE id = ${runId}
    `;
    throw error;
  }
}
