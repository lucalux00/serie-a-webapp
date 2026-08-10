import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getUserFromCookie } from "@/lib/auth";
import { getPredictionsFeed } from "@/lib/predictionFeed";

const ADMIN_EMAILS = ["lucapinelli0000@gmail.com", "luca.pinelli0000@gmail.com"];
const DISCLAIMER = "Contenuto statistico e informativo: non è un invito al gioco.";
const HASHTAGS = "#calcio #pronostici #analisicalcio #statistichecalcio";

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

function joinDrafts(drafts: string[]) {
  return drafts.join("\n\n──────────\n\n");
}

export async function GET() {
  const jwtUser = await getUserFromCookie();
  if (!jwtUser) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { rows: admins } = await sql`SELECT email FROM users WHERE id = ${jwtUser.userId}`;
  if (!ADMIN_EMAILS.includes(admins[0]?.email || "")) {
    return NextResponse.json({ error: "Permesso negato" }, { status: 403 });
  }

  const feed = await getPredictionsFeed();
  const leagues = feed.leagues
    .map((league) => {
      const singles = league.singles.map((prediction) => {
        const date = formatMatchDate(prediction.date);
        const oddsLine = prediction.odds === null
          ? "Quota media reale: in aggiornamento"
          : `Quota media reale: ${prediction.odds.toFixed(2).replace(".", ",")}`;
        const postText = [
          "⚽ PRONOSTICO SINGOLO",
          `${league.leagueName} · ${league.roundLabel}`,
          "",
          `🏟️ ${prediction.match}`,
          `🕒 ${date}`,
          `📌 Pronostico: ${prediction.pick}`,
          `📊 Confidenza del modello: ${prediction.confidence}%`,
          `📈 ${oddsLine}`,
          "",
          `💡 ${prediction.analysis}`,
          "",
          DISCLAIMER,
          HASHTAGS,
        ].join("\n");
        const storyText = [
          "⚽ PRONOSTICO DEL GIORNO",
          "",
          prediction.match,
          `📌 ${prediction.pick}`,
          `📊 Confidenza ${prediction.confidence}%`,
          `📈 ${oddsLine}`,
          "",
          `${league.leagueName} · ${date}`,
          "",
          DISCLAIMER,
        ].join("\n");

        return {
          id: prediction.id,
          match: prediction.match,
          date: prediction.date,
          pick: prediction.pick,
          confidence: prediction.confidence,
          odds: prediction.odds,
          postText,
          storyText,
          storyVisualUrl: `/api/social/prediction-story?kind=single&league=${encodeURIComponent(league.leagueName)}&round=${encodeURIComponent(league.roundLabel)}&match=${encodeURIComponent(prediction.match)}&pick=${encodeURIComponent(prediction.pick)}&confidence=${prediction.confidence}${prediction.odds === null ? "" : `&odds=${encodeURIComponent(prediction.odds.toFixed(2))}`}`,
        };
      });

      const multiples = league.multiples.map((multiple) => {
        const selections = multiple.matches.map(
          (match, index) => `${index + 1}. ${match.match}\n   ➜ ${match.pick}`,
        );
        const common = [
          `🎯 MULTIPLA ${multiple.type.toUpperCase()}`,
          `${league.leagueName} · ${league.roundLabel}`,
          "",
          ...selections,
        ];
        const postText = [
          ...common,
          "",
          "Bolletta consigliata senza quote numeriche.",
          DISCLAIMER,
          HASHTAGS,
        ].join("\n");
        const storyText = [
          ...common,
          "",
          "Combinazione puramente pronostica, senza quote numeriche.",
          "Non è un invito al gioco.",
        ].join("\n");

        return {
          id: `${league.leagueId}-${multiple.type.toLowerCase().replaceAll(" ", "-")}`,
          type: multiple.type,
          matches: multiple.matches,
          postText,
          storyText,
          storyVisualUrl: `/api/social/prediction-story?kind=multiple&league=${encodeURIComponent(league.leagueName)}&round=${encodeURIComponent(league.roundLabel)}&type=${encodeURIComponent(multiple.type)}&selections=${encodeURIComponent(JSON.stringify(multiple.matches))}`,
        };
      });

      return {
        leagueId: league.leagueId,
        leagueName: league.leagueName,
        roundLabel: league.roundLabel,
        singles,
        multiples,
      };
    })
    .filter((league) => league.singles.length > 0 || league.multiples.length > 0);

  const allSingles = leagues.flatMap((league) => league.singles);
  const allMultiples = leagues.flatMap((league) => league.multiples);

  return NextResponse.json({
    hasDraft: allSingles.length > 0 || allMultiples.length > 0,
    generatedAt: feed.generatedAt,
    leagues,
    totals: {
      singles: allSingles.length,
      multiples: allMultiples.length,
    },
    bulk: {
      post: {
        singles: joinDrafts(allSingles.map((item) => item.postText)),
        multiples: joinDrafts(allMultiples.map((item) => item.postText)),
        all: joinDrafts([
          ...allSingles.map((item) => item.postText),
          ...allMultiples.map((item) => item.postText),
        ]),
      },
      story: {
        singles: joinDrafts(allSingles.map((item) => item.storyText)),
        multiples: joinDrafts(allMultiples.map((item) => item.storyText)),
        all: joinDrafts([
          ...allSingles.map((item) => item.storyText),
          ...allMultiples.map((item) => item.storyText),
        ]),
      },
    },
  });
}
