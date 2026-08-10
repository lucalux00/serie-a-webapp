import { ImageResponse } from "next/og";
import { sql } from "@vercel/postgres";
import { getUserFromCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = new Set(["lucapinelli0000@gmail.com", "luca.pinelli0000@gmail.com"]);

function text(value: string | null, maxLength: number) {
  return (value || "").replace(/[<>]/g, "").trim().slice(0, maxLength);
}

function parseSelections(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 6).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const selection = item as { match?: unknown; pick?: unknown };
      const match = text(typeof selection.match === "string" ? selection.match : null, 70);
      const pick = text(typeof selection.pick === "string" ? selection.pick : null, 60);
      return match && pick ? [{ match, pick }] : [];
    });
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const user = await getUserFromCookie();
  if (!user) return new Response("Non autorizzato", { status: 401 });

  const { rows: admins } = await sql`SELECT email FROM users WHERE id = ${user.userId} LIMIT 1`;
  if (!ADMIN_EMAILS.has(String(admins[0]?.email || "").toLowerCase())) {
    return new Response("Permesso negato", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") === "multiple" ? "multiple" : "single";
  const league = text(searchParams.get("league"), 60) || "Calcio";
  const round = text(searchParams.get("round"), 60);
  const multipleType = text(searchParams.get("type"), 30) || "CONSIGLIATA";
  const backgroundUrl = new URL("/facebook-story-background-tp.png", request.url).toString();

  const header = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", color: "#6EE7B7", fontSize: 26, fontWeight: 800, letterSpacing: 3 }}>TATTICA &amp; PRONOSTICI</div>
      <div style={{ display: "flex", color: "#FCD34D", fontSize: 27, fontWeight: 900, letterSpacing: 2 }}>
        {kind === "multiple" ? `MULTIPLA ${multipleType.toUpperCase()}` : "PRONOSTICO SINGOLO"}
      </div>
    </div>
  );

  const footer = (
    <div style={{ display: "flex", marginTop: "auto", padding: "22px 26px", borderRadius: 18, background: "rgba(3, 10, 24, 0.82)", color: "#CBD5E1", fontSize: 19, lineHeight: 1.35 }}>
      Contenuto statistico e informativo. Non è un invito al gioco.
    </div>
  );

  const content = kind === "multiple" ? (
    <>
      <div style={{ display: "flex", marginTop: 42, color: "#CBD5E1", fontSize: 26 }}>{league}{round ? ` · ${round}` : ""}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 34, padding: 30, borderRadius: 24, background: "rgba(5, 15, 33, 0.9)", border: "2px solid rgba(52, 211, 153, 0.45)" }}>
        {parseSelections(searchParams.get("selections")).map((selection, index) => (
          <div key={`${selection.match}-${index}`} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", color: "#94A3B8", fontSize: 21 }}>{index + 1}. {selection.match}</div>
            <div style={{ display: "flex", color: "#6EE7B7", fontSize: 31, fontWeight: 900 }}>{selection.pick}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", marginTop: 26, color: "#FCD34D", fontSize: 23, fontWeight: 800 }}>Bolletta consigliata · senza quote numeriche</div>
    </>
  ) : (
    <>
      <div style={{ display: "flex", marginTop: 42, color: "#CBD5E1", fontSize: 26 }}>{league}{round ? ` · ${round}` : ""}</div>
      <div style={{ display: "flex", marginTop: 22, color: "#F8FAFC", fontSize: 48, lineHeight: 1.1, fontWeight: 900 }}>{text(searchParams.get("match"), 90)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 36, padding: 30, borderRadius: 24, background: "rgba(5, 15, 33, 0.9)", border: "2px solid rgba(52, 211, 153, 0.45)" }}>
        <div style={{ display: "flex", color: "#94A3B8", fontSize: 21, fontWeight: 800 }}>PRONOSTICO</div>
        <div style={{ display: "flex", color: "#6EE7B7", fontSize: 40, fontWeight: 900 }}>{text(searchParams.get("pick"), 80)}</div>
        <div style={{ display: "flex", color: "#CBD5E1", fontSize: 23 }}>Confidenza modello: {text(searchParams.get("confidence"), 4)}%</div>
        {searchParams.get("odds") ? <div style={{ display: "flex", color: "#FCD34D", fontSize: 23 }}>Quota media reale: {text(searchParams.get("odds"), 8)}</div> : null}
      </div>
    </>
  );

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "100px 84px 110px", color: "#F8FAFC", position: "relative" }}>
      {/* The story asset is rendered by Satori, not the browser's next/image pipeline. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        {header}
        {content}
        {footer}
      </div>
    </div>,
    { width: 1080, height: 1920, headers: { "Cache-Control": "private, no-store" } },
  );
}
