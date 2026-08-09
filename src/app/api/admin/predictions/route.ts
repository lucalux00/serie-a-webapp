import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getUserFromCookie } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { ensurePredictionSchema } from "@/lib/predictionSchema";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getUserFromCookie();
  return user && isAdminEmail(user.email) ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  await ensurePredictionSchema();

  const [drafts, latestRun, activeModel] = await Promise.all([
    sql`
      SELECT id, match_id, home_team, away_team, competition, match_date, quotes, analysis,
             status, model_version, created_at
      FROM daily_ai_predictions
      WHERE status = 'DRAFT'
        AND match_date >= NOW() - INTERVAL '2 hours'
      ORDER BY match_date ASC
      LIMIT 50
    `,
    sql`
      SELECT status, processed_matches, evaluated_picks, weights_version, completed_at, errors
      FROM prediction_learning_runs
      ORDER BY started_at DESC
      LIMIT 1
    `,
    sql`
      SELECT version, sample_size, metrics, created_at
      FROM prediction_model_weights
      ORDER BY active DESC, created_at DESC
      LIMIT 1
    `,
  ]);

  return NextResponse.json({
    drafts: drafts.rows,
    latestLearningRun: latestRun.rows[0] || null,
    activeModel: activeModel.rows[0] || { version: "baseline-v1", sample_size: 0, metrics: {} },
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  await ensurePredictionSchema();

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0 || body.action !== "publish") {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const { rows } = await sql`
    UPDATE daily_ai_predictions
    SET status = 'PUBLISHED', published_at = NOW(), published_by = ${admin.email}
    WHERE id = ${id}
      AND status = 'DRAFT'
    RETURNING id, match_id, status, published_at
  `;
  if (!rows[0]) return NextResponse.json({ error: "Draft non trovato o già pubblicato" }, { status: 409 });

  revalidatePath("/pronostici");
  return NextResponse.json({ success: true, prediction: rows[0] });
}
