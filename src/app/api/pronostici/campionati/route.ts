import { after, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getPredictionsFeed } from "@/lib/predictionFeed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const feed = await getPredictionsFeed();
    const incompleteLeagues = feed.leagues.filter((league) => !league.isImmediate && league.singles.length < 4);

    if (incompleteLeagues.length > 0) {
      await sql`
        CREATE TABLE IF NOT EXISTS cron_lock (
          job_name TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      const { rows } = await sql`
        SELECT created_at
        FROM cron_lock
        WHERE job_name = 'pronostici-live-feed'
          AND created_at > NOW() - INTERVAL '6 hours'
      `;

      if (rows.length === 0) {
        await sql`
          INSERT INTO cron_lock (job_name, created_at)
          VALUES ('pronostici-live-feed', NOW())
          ON CONFLICT (job_name) DO UPDATE SET created_at = NOW()
        `;

        const cronUrl = new URL("/api/cron/pronostici", request.url).toString();
        const cronSecret = process.env.CRON_SECRET || "";
        after(async () => {
          await fetch(cronUrl, { headers: { Authorization: `Bearer ${cronSecret}` }, cache: "no-store" });
        });
      }
    }

    return NextResponse.json(feed, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[pronostici/campionati]", error);
    return NextResponse.json({ error: "Pronostici temporaneamente non disponibili" }, { status: 500 });
  }
}
