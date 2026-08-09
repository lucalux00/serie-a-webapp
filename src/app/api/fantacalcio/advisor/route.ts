import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/auth';
import { canonicalRole } from '@/lib/fantaRoster';
import { enrichFantaPlayers, getSerieAContext } from '@/lib/fantaData';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FORMATIONS = [
  { label: '3-4-3', POR: 1, DIF: 3, CEN: 4, ATT: 3 },
  { label: '3-5-2', POR: 1, DIF: 3, CEN: 5, ATT: 2 },
  { label: '4-3-3', POR: 1, DIF: 4, CEN: 3, ATT: 3 },
  { label: '4-4-2', POR: 1, DIF: 4, CEN: 4, ATT: 2 },
  { label: '4-5-1', POR: 1, DIF: 4, CEN: 5, ATT: 1 },
  { label: '5-3-2', POR: 1, DIF: 5, CEN: 3, ATT: 2 },
  { label: '5-4-1', POR: 1, DIF: 5, CEN: 4, ATT: 1 },
] as const;

type ScoredPlayer = Awaited<ReturnType<typeof enrichFantaPlayers>>[number];

function bestLineup(players: ScoredPlayer[]) {
  const options = FORMATIONS.flatMap((formation) => {
    const lineup = (['POR', 'DIF', 'CEN', 'ATT'] as const).flatMap((role) => players.filter((player) => player.role === role).slice(0, formation[role]));
    if (lineup.length !== 11) return [];
    return [{ formation: formation.label, lineup, total: lineup.reduce((sum, player) => sum + player.score, 0) }];
  });
  return options.sort((left, right) => right.total - left.total)[0] ?? { formation: 'Rosa incompleta', lineup: [], total: 0 };
}

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJwt(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (new URL(request.url).searchParams.get('scope') === 'pro') {
      const admin = ['luca.pinelli0000@gmail.com', 'lucapinelli0000@gmail.com'].includes(payload.email.toLowerCase());
      const row = (await sql`SELECT is_premium, to_jsonb(users)->>'premium_until' AS premium_until FROM users WHERE id = ${payload.userId} LIMIT 1`).rows[0];
      const premium = admin || (row?.is_premium === true && (!row?.premium_until || new Date(row.premium_until) > new Date()));
      if (!premium) return NextResponse.json({ error: 'Solo Pro' }, { status: 403 });
    }

    const [{ rows: rawRoster }, context] = await Promise.all([
      sql`SELECT id, player_name as "playerName", team_name as "teamName", role FROM fanta_rosters WHERE user_id = ${payload.userId}`,
      getSerieAContext(),
    ]);
    const roster = rawRoster.flatMap((player) => {
      const role = canonicalRole(player.playerName, player.teamName);
      return role ? [{ ...player, role }] : [];
    });

    if (!roster.length) {
      return NextResponse.json({
        matchday: context.currentMatchday,
        playerScores: [],
        recommendedLineup: [],
        suggestedCuts: [],
        bestFormation: 'Rosa incompleta',
        coverage: { players: 0, fixtures: 0, statistics: 0, confidence: 'Bassa' },
        updatedAt: new Date().toISOString(),
      });
    }

    const playerScores = await enrichFantaPlayers(roster, context);
    const optimized = bestLineup(playerScores);
    const suggestedCuts = [...playerScores].sort((left, right) => left.score - right.score).slice(0, 3);
    const fixtureCount = playerScores.filter((player) => player.fixture).length;
    const statsCount = playerScores.filter((player) => player.stats).length;
    const averageConfidence = Math.round(playerScores.reduce((sum, player) => sum + player.confidence, 0) / playerScores.length);

    return NextResponse.json({
      matchday: context.currentMatchday,
      playerScores,
      recommendedLineup: optimized.lineup,
      suggestedCuts,
      bestFormation: optimized.formation,
      coverage: {
        players: playerScores.length,
        fixtures: fixtureCount,
        statistics: statsCount,
        fixturePercent: Math.round((fixtureCount / playerScores.length) * 100),
        statisticsPercent: Math.round((statsCount / playerScores.length) * 100),
        confidence: averageConfidence >= 80 ? 'Alta' : averageConfidence >= 55 ? 'Media' : 'Bassa',
        averageConfidence,
      },
      methodology: 'Indice 0-100 basato su forza squadra, avversario, casa/trasferta, minutaggio, rating e trend bonus quando disponibili. Le percentuali sono stime decisionali, non probabilità certe di voto o gol.',
      strengthPeriod: context.strengthPeriod,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Advisor Error:', error);
    return NextResponse.json({ error: 'Dati Fantacalcio temporaneamente non disponibili' }, { status: 500 });
  }
}
