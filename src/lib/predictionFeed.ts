import { sql } from "@vercel/postgres";
import { getMarketOdds, type MarketOddsTier, type MarketOddsValue } from "@/lib/marketOdds";
import {
  LEAGUE_CONFIGS,
  type LeaguePredictions,
  type MultipleMatch,
  type MultiplePrediction,
  type MultipleType,
  type PredictionsResponse,
  type SinglePrediction,
} from "@/data/predictionsData";

type PredictionTier = MarketOddsTier;

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
  oddsSource?: "market";
  oddsProvider?: string;
  oddsUpdatedAt?: string;
  bookmakerCount?: number;
  oddsMin?: number;
  oddsMax?: number;
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
  odds: number | null;
  rankingOdds: number;
  confidence: number;
  oddsSource: "market" | "unavailable";
  oddsProvider?: string;
  oddsUpdatedAt?: string;
  bookmakerCount?: number;
  oddsMin?: number;
  oddsMax?: number;
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

  return quotes.map((quote) => {
    const rawOdds = Number(quote.odds ?? quote.o);
    const hasRealOdds = quote.oddsSource === "market" && Number.isFinite(rawOdds) && rawOdds > 1;
    return {
      tier: quote.tier,
      type: quote.type || quote.t || "Esito",
      pick: quote.pick || quote.p || "Analisi in aggiornamento",
      odds: hasRealOdds ? rawOdds : null,
      rankingOdds: Number.isFinite(rawOdds) && rawOdds > 1 ? rawOdds : 1.5,
      confidence: Number(quote.confidence ?? quote.c ?? 60),
      oddsSource: hasRealOdds ? "market" as const : "unavailable" as const,
      oddsProvider: hasRealOdds ? quote.oddsProvider : undefined,
      oddsUpdatedAt: hasRealOdds ? quote.oddsUpdatedAt : undefined,
      bookmakerCount: hasRealOdds ? quote.bookmakerCount : undefined,
      oddsMin: hasRealOdds ? quote.oddsMin : undefined,
      oddsMax: hasRealOdds ? quote.oddsMax : undefined,
    };
  }).filter((quote) => quote.pick);
}

function withExternalOdds(quote: NormalizedQuote, externalOdds?: MarketOddsValue): NormalizedQuote {
  if (!externalOdds) return quote;
  return {
    ...quote,
    odds: externalOdds.odds,
    oddsSource: "market",
    oddsProvider: externalOdds.provider,
    oddsUpdatedAt: externalOdds.updatedAt,
    bookmakerCount: externalOdds.bookmakerCount,
    oddsMin: externalOdds.oddsMin,
    oddsMax: externalOdds.oddsMax,
  };
}

function pickQuote(row: PredictionRow, tier: PredictionTier, externalOdds?: MarketOddsValue): NormalizedQuote {
  const quotes = normalizeQuotes(row.quotes);
  const explicit = quotes.find((quote) => quote.tier === tier);
  if (explicit) return withExternalOdds(explicit, externalOdds);

  if (quotes.length > 0) {
    const ordered = [...quotes].sort((a, b) => a.rankingOdds - b.rankingOdds);
    if (tier === "safe") return withExternalOdds(ordered[0], externalOdds);
    if (tier === "high") return withExternalOdds(ordered.at(-1) || ordered[0], externalOdds);
    return withExternalOdds(ordered[Math.floor(ordered.length / 2)], externalOdds);
  }

  const fallback = {
    safe: { type: "Multigol", pick: "2-4 gol", odds: null, rankingOdds: 1.45, confidence: 62, oddsSource: "unavailable" as const },
    balanced: { type: "Gol/No Gol", pick: "Entrambe segnano", odds: null, rankingOdds: 1.75, confidence: 55, oddsSource: "unavailable" as const },
    high: { type: "Totale gol", pick: "Over 2.5 gol", odds: null, rankingOdds: 2.05, confidence: 46, oddsSource: "unavailable" as const },
  } satisfies Record<PredictionTier, Omit<NormalizedQuote, "tier">>;

  return withExternalOdds(fallback[tier], externalOdds);
}

function cleanAnalysis(analysis: string) {
  return analysis.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "Analisi statistica in aggiornamento.";
}

function toSingle(row: PredictionRow, marketOdds: Map<number, Map<PredictionTier, MarketOddsValue>>): SinglePrediction {
  const quote = pickQuote(row, "safe", marketOdds.get(row.match_id)?.get("safe"));
  return {
    id: String(row.match_id),
    match: `${row.home_team} - ${row.away_team}`,
    date: new Date(row.match_date).toISOString(),
    pick: quote.pick,
    odds: quote.odds,
    oddsSource: quote.oddsSource,
    oddsProvider: quote.oddsProvider,
    oddsUpdatedAt: quote.oddsUpdatedAt,
    bookmakerCount: quote.bookmakerCount,
    oddsMin: quote.oddsMin,
    oddsMax: quote.oddsMax,
    confidence: Math.min(99, Math.max(1, Math.round(quote.confidence))),
    analysis: cleanAnalysis(row.analysis),
  };
}

function createMultiple(type: MultipleType, rows: PredictionRow[], tier: PredictionTier, marketOdds: Map<number, Map<PredictionTier, MarketOddsValue>>): MultiplePrediction {
  const matches: MultipleMatch[] = rows.map((row) => ({
    match: `${row.home_team} - ${row.away_team}`,
    pick: pickQuote(row, tier, marketOdds.get(row.match_id)?.get(tier)).pick,
  }));

  return {
    type,
    matches,
  };
}

function buildMultiples(rows: PredictionRow[], marketOdds: Map<number, Map<PredictionTier, MarketOddsValue>>): MultiplePrediction[] {
  if (rows.length < 2) return [];
  const balancedRows = rows.slice(0, Math.min(3, rows.length));
  return [
    createMultiple("Raddoppio", rows.slice(0, 2), "safe", marketOdds),
    createMultiple("Bilanciata", balancedRows, "balanced", marketOdds),
    createMultiple("Alta Quota", balancedRows, "high", marketOdds),
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

function buildLeague(config: (typeof LEAGUE_CONFIGS)[number], allRows: PredictionRow[], marketOdds: Map<number, Map<PredictionTier, MarketOddsValue>>): LeaguePredictions {
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
    singles: matchingRows.map((row) => toSingle(row, marketOdds)),
    multiples: buildMultiples(matchingRows, marketOdds),
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

  const marketOdds = await getMarketOdds(rows.map((row) => ({
    matchId: row.match_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    matchDate: row.match_date,
    competitionCode: row.competition_code,
    quotes: normalizeQuotes(row.quotes).map((quote) => ({ tier: quote.tier, type: quote.type, pick: quote.pick })),
  })));

  return {
    generatedAt: new Date(generatedAt || Date.now()).toISOString(),
    leagues: LEAGUE_CONFIGS.map((config) => buildLeague(config, rows, marketOdds)),
  };
}
