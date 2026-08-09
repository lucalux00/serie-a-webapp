import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { ensurePredictionSchema } from "@/lib/predictionFeed";
import { LEAGUE_CONFIGS } from "@/data/predictionsData";
import {
  calibratedConfidence,
  getActivePredictionModel,
  predictionMarketKey,
  runPredictionLearningPipeline,
  type PredictionWeights,
} from "@/lib/predictionLearning";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type FootballMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  homeTeam: { name: string; shortName?: string };
  awayTeam: { name: string; shortName?: string };
  competition: { name: string; code: string };
};

type GeneratedQuote = {
  tier: "safe" | "balanced" | "high";
  type: string;
  pick: string;
  confidence: number;
};

type GeneratedPrediction = {
  id: number;
  analysis: string;
  quotes: GeneratedQuote[];
};

const FOOTBALL_API_BASE = "https://api.football-data.org/v4";
const supportedStatuses = new Set(["SCHEDULED", "TIMED"]);
const priority: Record<string, number> = { CL: 1, SA: 2, PL: 3, PD: 4, BL1: 5, FL1: 6 };

function romeDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const shifted = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
  return shifted.toISOString().slice(0, 10);
}

async function footballDataFetch(path: string, apiKey: string) {
  const response = await fetch(`${FOOTBALL_API_BASE}${path}`, {
    headers: { "X-Auth-Token": apiKey },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`football-data ${response.status}: ${path}`);
  return response.json() as Promise<{ matches?: FootballMatch[] }>;
}

function selectNextRound(matches: FootballMatch[]) {
  const scheduled = matches
    .filter((match) => supportedStatuses.has(match.status))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  const first = scheduled[0];
  if (!first) return [];
  if (first.matchday) return scheduled.filter((match) => match.matchday === first.matchday).slice(0, 4);
  return scheduled.slice(0, 4);
}

async function loadFixtures(apiKey: string) {
  const dateFrom = romeDate();
  const dateTo = romeDate(45);
  const regularLeagues = LEAGUE_CONFIGS.filter((league) => league.code !== "IMMEDIATE");

  const leagueResults = await Promise.allSettled(
    regularLeagues.map(async (league) => {
      const data = await footballDataFetch(
        `/competitions/${league.code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        apiKey,
      );
      return selectNextRound(data.matches || []);
    }),
  );

  const leagueFixtures = leagueResults.flatMap((result) => {
    if (result.status === "fulfilled") return result.value;
    console.warn("[cron/pronostici] Campionato non disponibile:", result.reason);
    return [];
  });

  let immediateFixtures: FootballMatch[] = [];
  try {
    const immediateData = await footballDataFetch(
      `/matches?dateFrom=${dateFrom}&dateTo=${romeDate(1)}`,
      apiKey,
    );
    immediateFixtures = (immediateData.matches || [])
      .filter((match) => supportedStatuses.has(match.status))
      .sort((a, b) => {
        const priorityDiff = (priority[a.competition.code] ?? 99) - (priority[b.competition.code] ?? 99);
        return priorityDiff || new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
      })
      .slice(0, 4);
  } catch (error) {
    console.warn("[cron/pronostici] Gare immediate non disponibili:", error);
  }

  return [...new Map([...leagueFixtures, ...immediateFixtures].map((match) => [match.id, match])).values()];
}

function fallbackPrediction(match: FootballMatch, weights: PredictionWeights): GeneratedPrediction {
  const variants = [
    {
      analysis: "Il modello privilegia una copertura sul risultato per ridurre l'esposizione agli esiti più incerti. Il totale reti contenuto completa una lettura prudente della gara.",
      quotes: [
        { tier: "safe", type: "Doppia chance", pick: "1X", confidence: 64 },
        { tier: "balanced", type: "Totale gol", pick: "Over 1.5 gol", confidence: 57 },
        { tier: "high", type: "Esito + gol", pick: "1 + Over 1.5", confidence: 44 },
      ],
    },
    {
      analysis: "Il profilo statistico della sfida suggerisce equilibrio e una possibile tenuta della squadra ospite. Il mercato gol rappresenta l'opzione intermedia più coerente con questo scenario.",
      quotes: [
        { tier: "safe", type: "Doppia chance", pick: "X2", confidence: 62 },
        { tier: "balanced", type: "Gol/No Gol", pick: "Entrambe segnano", confidence: 54 },
        { tier: "high", type: "Esito finale", pick: "Pareggio", confidence: 39 },
      ],
    },
    {
      analysis: "La distribuzione attesa dei gol favorisce una partita con almeno due reti complessive. La selezione principale mantiene una soglia prudente rispetto allo scenario più aggressivo.",
      quotes: [
        { tier: "safe", type: "Totale gol", pick: "Over 1.5 gol", confidence: 66 },
        { tier: "balanced", type: "Totale gol", pick: "Under 3.5 gol", confidence: 56 },
        { tier: "high", type: "Totale gol", pick: "Over 2.5 gol", confidence: 47 },
      ],
    },
  ] satisfies Array<{ analysis: string; quotes: GeneratedQuote[] }>;
  const variant = variants
    .map((item, index) => {
      const learnedScore = item.quotes.reduce(
        (sum, quote) => sum + (weights[predictionMarketKey(quote.type, quote.pick)] ?? weights.other ?? 0.5),
        0,
      ) / item.quotes.length;
      const deterministicSpread = (((Math.abs(match.id) + index * 17) % 11) - 5) / 100;
      return { item, score: learnedScore + deterministicSpread };
    })
    .sort((a, b) => b.score - a.score)[0].item;
  return {
    id: match.id,
    analysis: variant.analysis,
    quotes: variant.quotes.map((quote) => ({
      ...quote,
      confidence: calibratedConfidence(quote.type, quote.pick, quote.confidence, weights),
    })),
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY non configurata");
    await ensurePredictionSchema();

    let learning: Awaited<ReturnType<typeof runPredictionLearningPipeline>> | null = null;
    try {
      learning = await runPredictionLearningPipeline(apiKey);
    } catch (learningError) {
      console.error("[cron/pronostici] Pipeline apprendimento non bloccante:", learningError);
    }
    const model = await getActivePredictionModel();

    const fixtures = await loadFixtures(apiKey);
    if (fixtures.length === 0) {
      return NextResponse.json({ success: true, processed: 0, inserted: 0, message: "Nessuna gara programmata" });
    }

    const insertResults = await Promise.all(fixtures.map(async (match) => {
      const homeTeam = match.homeTeam.shortName || match.homeTeam.name;
      const awayTeam = match.awayTeam.shortName || match.awayTeam.name;
      const prediction = fallbackPrediction(match, model.weights);
      return sql`
        INSERT INTO daily_ai_predictions
          (match_id, home_team, away_team, match_date, competition, competition_code, matchday, stage,
           quotes, analysis, status, model_version, weights_snapshot)
        VALUES
          (${match.id}, ${homeTeam}, ${awayTeam}, ${match.utcDate}, ${match.competition.name},
           ${match.competition.code}, ${match.matchday}, ${match.stage}, ${JSON.stringify(prediction.quotes)},
           ${prediction.analysis}, 'DRAFT', ${model.version}, ${JSON.stringify(model.weights)})
        ON CONFLICT (match_id) DO NOTHING
        RETURNING id
      `;
    }));

    const inserted = insertResults.reduce((count, result) => count + (result.rowCount || 0), 0);
    await sql`DELETE FROM daily_ai_predictions WHERE match_date < NOW() - INTERVAL '730 days'`;
    return NextResponse.json({ success: true, processed: fixtures.length, inserted, modelVersion: model.version, learning });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto";
    console.error("[cron/pronostici]", error);
    return NextResponse.json({ error: "Errore interno", details: message }, { status: 500 });
  }
}
