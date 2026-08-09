import { sql } from "@vercel/postgres";
import {
  LEAGUE_CONFIGS,
  createAffiliateLinks,
  createMultipleAffiliateLinks,
  type LeaguePredictions,
  type MultipleMatch,
  type MultiplePrediction,
  type MultipleType,
  type PredictionsResponse,
  type SinglePrediction,
} from "@/data/predictionsData";

type PredictionTier = "safe" | "balanced" | "high";

type StoredQuote = {
  tier?: PredictionTier;
  type?: string;
  t?: string;
  pick?: string;
  p?: string;
  odds?: number;
  o?: number;
  confidence?: number;
  c?: number;
};

type PredictionRow = {
  match_id: number;
  home_team: string;
  away_team: string;
  match_date: string | Date;
  competition: string;
  competition_code: string | null;
  matchday: number | null;
  stage: string | null;
  quotes: StoredQuote[] | string;
  analysis: string;
  created_at: string | Date;
  is_immediate: boolean;
};

type NormalizedQuote = {
  tier?: PredictionTier;
  type: string;
  pick: string;
  odds: number;
  confidence: number;
};

export async function ensurePredictionSchema() {
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
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_predictions_schedule ON daily_ai_predictions (competition_code, match_date)`;
}

function normalizeQuotes(rawQuotes: PredictionRow["quotes"]): NormalizedQuote[] {
  let quotes: StoredQuote[] = [];
  try {
    quotes = Array.isArray(rawQuotes) ? rawQuotes : JSON.parse(rawQuotes || "[]");
  } catch {
    quotes = [];
  }

  return quotes
    .map((quote) => ({
      tier: quote.tier,
      type: quote.type || quote.t || "Esito",
      pick: quote.pick || quote.p || "Analisi in aggiornamento",
      odds: Number(quote.odds ?? quote.o ?? 1.5),
      confidence: Number(quote.confidence ?? quote.c ?? 60),
    }))
    .filter((quote) => quote.pick && Number.isFinite(quote.odds) && quote.odds > 1);
}

function pickQuote(row: PredictionRow, tier: PredictionTier): NormalizedQuote {
  const quotes = normalizeQuotes(row.quotes);
  const explicit = quotes.find((quote) => quote.tier === tier);
  if (explicit) return explicit;

  if (quotes.length > 0) {
    const ordered = [...quotes].sort((a, b) => a.odds - b.odds);
    if (tier === "safe") return ordered[0];
    if (tier === "high") return ordered.at(-1) || ordered[0];
    return ordered[Math.floor(ordered.length / 2)];
  }

  const fallback = {
    safe: { type: "Multigol", pick: "2-4 gol", odds: 1.45, confidence: 62 },
    balanced: { type: "Gol/No Gol", pick: "Entrambe segnano", odds: 1.75, confidence: 55 },
    high: { type: "Totale gol", pick: "Over 2.5 gol", odds: 2.05, confidence: 46 },
  } satisfies Record<PredictionTier, Omit<NormalizedQuote, "tier">>;

  return fallback[tier];
}

function cleanAnalysis(analysis: string) {
  return analysis.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "Analisi statistica in aggiornamento.";
}

function toSingle(row: PredictionRow): SinglePrediction {
  const quote = pickQuote(row, "safe");
  return {
    id: String(row.match_id),
    match: `${row.home_team} - ${row.away_team}`,
    date: new Date(row.match_date).toISOString(),
    pick: quote.pick,
    odds: quote.odds,
    confidence: Math.min(99, Math.max(1, Math.round(quote.confidence))),
    analysis: cleanAnalysis(row.analysis),
    affiliateLinks: createAffiliateLinks(quote.odds),
  };
}

function createMultiple(type: MultipleType, rows: PredictionRow[], tier: PredictionTier): MultiplePrediction {
  const matches: MultipleMatch[] = rows.map((row) => {
    const quote = pickQuote(row, tier);
    return {
      match: `${row.home_team} - ${row.away_team}`,
      pick: quote.pick,
      odds: quote.odds,
    };
  });

  return {
    type,
    totalOdds: Number(matches.reduce((total, match) => total * match.odds, 1).toFixed(2)),
    matches,
    affiliateLinks: createMultipleAffiliateLinks(),
  };
}

function buildMultiples(rows: PredictionRow[]): MultiplePrediction[] {
  if (rows.length < 2) return [];
  const balancedRows = rows.slice(0, Math.min(3, rows.length));
  return [
    createMultiple("Raddoppio", rows.slice(0, 2), "safe"),
    createMultiple("Bilanciata", balancedRows, "balanced"),
    createMultiple("Alta Quota", balancedRows, "high"),
  ];
}

function formatStage(stage: string | null) {
  if (!stage) return "Prossimo turno";
  return stage.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function selectNextRound(rows: PredictionRow[]) {
  const ordered = [...rows].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  const first = ordered[0];
  if (!first) return [];
  if (first.matchday) return ordered.filter((row) => row.matchday === first.matchday).slice(0, 4);
  if (first.stage) return ordered.filter((row) => row.stage === first.stage).slice(0, 4);
  const cutoff = new Date(first.match_date).getTime() + 3 * 86_400_000;
  return ordered.filter((row) => new Date(row.match_date).getTime() <= cutoff).slice(0, 4);
}

function buildLeague(config: (typeof LEAGUE_CONFIGS)[number], allRows: PredictionRow[]): LeaguePredictions {
  const isImmediate = config.code === "IMMEDIATE";
  const matchingRows = isImmediate
    ? allRows.filter((row) => row.is_immediate).slice(0, 4)
    : selectNextRound(allRows.filter((row) => row.competition_code === config.code));
  const first = matchingRows[0];

  return {
    leagueId: config.leagueId,
    leagueName: config.leagueName,
    roundLabel: isImmediate
      ? "Amichevoli, coppe e gare tra oggi e domani"
      : first?.matchday
        ? `Giornata ${first.matchday}`
        : formatStage(first?.stage || null),
    startsAt: first ? new Date(first.match_date).toISOString() : null,
    isImmediate,
    singles: matchingRows.map(toSingle),
    multiples: buildMultiples(matchingRows),
  };
}

export async function getPredictionsFeed(): Promise<PredictionsResponse> {
  await ensurePredictionSchema();
  const { rows } = await sql<PredictionRow>`
    SELECT
      match_id,
      home_team,
      away_team,
      match_date,
      competition,
      competition_code,
      matchday,
      stage,
      quotes,
      analysis,
      created_at,
      ((match_date AT TIME ZONE 'Europe/Rome')::date BETWEEN
        (NOW() AT TIME ZONE 'Europe/Rome')::date AND
        (NOW() AT TIME ZONE 'Europe/Rome')::date + 1) AS is_immediate
    FROM daily_ai_predictions
    WHERE match_date >= NOW() - INTERVAL '2 hours'
      AND match_date <= NOW() + INTERVAL '45 days'
    ORDER BY match_date ASC
  `;

  const generatedAt = rows.reduce((latest, row) => {
    const createdAt = new Date(row.created_at).getTime();
    return createdAt > latest ? createdAt : latest;
  }, 0);

  return {
    generatedAt: new Date(generatedAt || Date.now()).toISOString(),
    leagues: LEAGUE_CONFIGS.map((config) => buildLeague(config, rows)),
  };
}
