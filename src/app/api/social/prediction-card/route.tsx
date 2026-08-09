import { ImageResponse } from "next/og";
import { sql } from "@vercel/postgres";
import { ensurePredictionSchema } from "@/lib/predictionSchema";

export const runtime = "nodejs";

type Quote = { tier?: string; pick?: string; p?: string };

function parseQuotes(value: unknown): Quote[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const story = searchParams.get("format") === "story";
  if (!Number.isInteger(id) || id <= 0) return new Response("ID non valido", { status: 400 });

  await ensurePredictionSchema();
  const { rows } = await sql`
    SELECT home_team, away_team, competition, match_date, quotes, analysis,
           final_home_score, final_away_score
    FROM daily_ai_predictions
    WHERE id = ${id}
      AND status = 'PUBLISHED'
      AND primary_is_correct = TRUE
      AND result_ingested_at IS NOT NULL
    LIMIT 1
  `;
  const prediction = rows[0];
  if (!prediction) return new Response("Pronostico non trovato", { status: 404 });

  const quotes = parseQuotes(prediction.quotes);
  const primary = quotes.find((quote) => quote.tier === "safe") || quotes[0];
  const width = 1080;
  const height = story ? 1920 : 1350;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: story ? 84 : 64, color: "#F8FAFC", background: "linear-gradient(150deg, #08121f, #153c38)" }}>
      <div style={{ display: "flex", color: "#34D399", fontSize: 27, fontWeight: 800, letterSpacing: 3 }}>TATTICA &amp; PRONOSTICI</div>
      <div style={{ display: "flex", marginTop: story ? 150 : 80, color: "#FBBF24", fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>PRONOSTICO VERIFICATO</div>
      <div style={{ display: "flex", marginTop: 28, fontSize: story ? 74 : 62, lineHeight: 1.08, fontWeight: 900 }}>{prediction.home_team} - {prediction.away_team}</div>
      <div style={{ display: "flex", marginTop: 28, color: "#CBD5E1", fontSize: 28 }}>{prediction.competition || "Calcio"}</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 54, padding: 34, borderRadius: 24, background: "#0F172A", border: "2px solid #334155" }}>
        <div style={{ display: "flex", color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>PRONOSTICO</div>
        <div style={{ display: "flex", marginTop: 12, color: "#34D399", fontSize: 50, fontWeight: 900 }}>{primary?.pick || primary?.p || "Pronostico verificato"}</div>
        <div style={{ display: "flex", marginTop: 28, color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>RISULTATO FINALE</div>
        <div style={{ display: "flex", marginTop: 10, fontSize: 62, fontWeight: 900 }}>{prediction.final_home_score} - {prediction.final_away_score}</div>
      </div>
      <div style={{ display: "flex", marginTop: 44, color: "#CBD5E1", fontSize: story ? 30 : 25, lineHeight: 1.42 }}>{prediction.analysis}</div>
      <div style={{ display: "flex", marginTop: "auto", color: "#94A3B8", fontSize: 20 }}>Analisi statistica · Contenuto informativo</div>
    </div>,
    { width, height, headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}
