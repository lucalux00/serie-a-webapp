import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

type Prediction = {
  id: string;
  match: string;
  competition: string | null;
  pick: string;
  odds: number | string;
  commence_time: string;
  confidence_score: number | string | null;
};

const MAX_SINGLES_PER_COMPETITION = 6;

function totalOdds(matches: Prediction[]) {
  return Math.round(matches.reduce((total, match) => total * Number(match.odds), 1) * 100) / 100;
}

function createMultiples(competition: string, picks: Prediction[]) {
  const balanced = [...picks].sort((a, b) => Number(a.odds) - Number(b.odds));
  const value = [...picks].sort((a, b) => Number(b.odds) - Number(a.odds));
  const multiples = [];

  if (balanced.length >= 2) {
    const matches = balanced.slice(0, 2);
    multiples.push({
      id: `${competition}-doppia`,
      title: `Doppia ${competition}`,
      description: 'Due selezioni dello stesso campionato, pensate per una quota piu contenuta.',
      matches,
      totalOdds: totalOdds(matches),
    });
  }

  if (value.length >= 3) {
    const matches = value.slice(0, 3);
    multiples.push({
      id: `${competition}-tripla`,
      title: `Tripla valore ${competition}`,
      description: 'Tre selezioni dello stesso campionato, con un profilo quota piu alto.',
      matches,
      totalOdds: totalOdds(matches),
    });
  }

  return multiples;
}

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, match_name AS match, competition, pick, odds, match_date AS commence_time, confidence_score
      FROM ml_predictions
      WHERE match_date > NOW()
      ORDER BY competition ASC NULLS LAST, match_date ASC
      LIMIT 150
    `;

    const predictions = (rows as Prediction[]).map((prediction) => ({
      ...prediction,
      competition: prediction.competition || 'Altri campionati',
      odds: Number(prediction.odds),
    }));

    const byCompetition = predictions.reduce<Record<string, Prediction[]>>((groups, prediction) => {
      const competition = prediction.competition || 'Altri campionati';
      groups[competition] = [...(groups[competition] ?? []), prediction];
      return groups;
    }, {});

    const competitions = Object.entries(byCompetition).map(([competition, picks]) => ({
      competition,
      singles: [...picks]
        .sort((a, b) => Number(a.odds) - Number(b.odds))
        .slice(0, MAX_SINGLES_PER_COMPETITION),
      multiples: createMultiples(competition, picks),
      totalMatches: picks.length,
    }));

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error('GET /api/pronostici error:', error);
    return NextResponse.json({ competitions: [] }, { status: 200 });
  }
}
