import { NextResponse } from "next/server";
import { runPredictionLearningPipeline } from "@/lib/predictionLearning";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY non configurata" }, { status: 500 });

  try {
    const result = await runPredictionLearningPipeline(apiKey);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto";
    console.error("[cron/prediction-learning]", error);
    return NextResponse.json({ error: "Pipeline apprendimento fallita", details: message }, { status: 500 });
  }
}
