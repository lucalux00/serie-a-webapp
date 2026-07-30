import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';

type Quote = { type?: string; pick?: string; odds?: number | string };

function parseQuotes(value: unknown): Quote[] {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(String(value || '[]')); } catch { return []; }
}

export async function GET() {
  const jwtUser = await getUserFromCookie();
  if (!jwtUser) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { rows: admins } = await sql`SELECT email FROM users WHERE id = ${jwtUser.userId}`;
  if (!admins[0] || !['lucapinelli0000@gmail.com', 'luca.pinelli0000@gmail.com'].includes(admins[0].email)) {
    return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
  }

  const { rows } = await sql`
    SELECT match_id, home_team, away_team, competition, match_date, quotes, created_at
    FROM daily_ai_predictions
    WHERE match_date >= NOW()
    ORDER BY match_date ASC, created_at DESC
    LIMIT 3
  `;

  const predictions = rows.map((row) => {
    const primary = parseQuotes(row.quotes)[0];
    return {
      match: `${row.home_team} - ${row.away_team}`,
      competition: row.competition || 'Calcio',
      date: row.match_date,
      pick: primary?.pick || 'Analisi disponibile sul sito',
      odds: primary?.odds ? Number(primary.odds).toFixed(2) : null,
      createdAt: row.created_at,
    };
  });

  if (predictions.length === 0) {
    return NextResponse.json({ hasDraft: false, predictions: [] });
  }

  const lines = predictions.map((item, index) =>
    `${index + 1}. ${item.match}\n${item.pick}${item.odds ? ` · quota ${item.odds}` : ''}`,
  );
  const instagramCaption = [
    '⚽ I pronostici selezionati dal nostro modello',
    '',
    ...lines,
    '',
    'Trovi analisi e contesto sul sito. Contenuto statistico e informativo, non è un invito al gioco.',
    '',
    '#calcio #seriea #pronostici #analisi #calciomercato #fantacalcio',
  ].join('\n');
  const tiktokScript = [
    'Hook: “Ecco i match che il nostro modello sta monitorando oggi.”',
    '',
    ...predictions.map((item, index) => `Scena ${index + 1}: ${item.match} — ${item.pick}${item.odds ? `, quota ${item.odds}` : ''}.`),
    '',
    'Chiusura: “L’analisi completa è sul sito. Dati e statistiche, senza promesse facili.”',
  ].join('\n');

  return NextResponse.json({
    hasDraft: true,
    generatedAt: new Date().toISOString(),
    newestPredictionAt: predictions[0].createdAt,
    predictions,
    instagramCaption,
    tiktokScript,
    visualUrl: '/api/social/predictions-image',
  });
}
