import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getUserFromCookie } from "@/lib/auth";
import { ensurePredictionSchema } from "@/lib/predictionSchema";

export const dynamic = "force-dynamic";

type Quote = { tier?: string; pick?: string; p?: string; confidence?: number; c?: number };

function parseQuotes(value: unknown): Quote[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensurePredictionSchema();

  const { rows } = await sql`
    SELECT id, match_id, home_team, away_team, competition, match_date, quotes, analysis,
           final_home_score, final_away_score, result_ingested_at, model_version
    FROM daily_ai_predictions
    WHERE status = 'PUBLISHED'
      AND primary_is_correct = TRUE
      AND result_ingested_at IS NOT NULL
    ORDER BY match_date DESC
    LIMIT 100
  `;

  const predictions = rows.map((row) => {
    const quotes = parseQuotes(row.quotes);
    const primary = quotes.find((quote) => quote.tier === "safe") || quotes[0];
    return {
      id: row.id,
      matchId: row.match_id,
      match: `${row.home_team} - ${row.away_team}`,
      competition: row.competition || "Calcio",
      date: new Date(row.match_date).toISOString(),
      pick: primary?.pick || primary?.p || "Pronostico verificato",
      confidence: Number(primary?.confidence ?? primary?.c ?? 0),
      result: `${row.final_home_score}-${row.final_away_score}`,
      analysis: row.analysis,
      modelVersion: row.model_version,
    };
  });

  return NextResponse.json({ predictions });
}
