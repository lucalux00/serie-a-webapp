import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getSerieAContext } from '@/lib/fantaData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [context, databaseResult] = await Promise.all([
      getSerieAContext(),
      sql`SELECT matchday, is_active, is_completed FROM fanta_matchdays ORDER BY matchday ASC`.catch(() => ({ rows: [] })),
    ]);
    const databaseRows = databaseResult.rows as Array<{ matchday: number; is_active: boolean; is_completed: boolean }>;

    if (context.matches.length) {
      const currentMatches = context.matches.filter((match) => match.matchday === context.currentMatchday);
      const deadline = currentMatches.map((match) => new Date(match.utcDate).getTime()).filter(Number.isFinite).sort((left, right) => left - right)[0];
      const isActive = Boolean(deadline && Date.now() < deadline);
      const matchdays = Array.from({ length: 38 }, (_, index) => {
        const matchday = index + 1;
        return { matchday, is_active: matchday === context.currentMatchday && isActive, is_completed: matchday < context.currentMatchday };
      });
      return NextResponse.json({
        matchdays,
        current_matchday: context.currentMatchday,
        is_active: isActive,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        fixture_count: currentMatches.length,
        source: context.calendarSource,
        updated_at: new Date().toISOString(),
      });
    }

    const active = databaseRows.find((row) => row.is_active)?.matchday;
    const lastCompleted = [...databaseRows].reverse().find((row) => row.is_completed)?.matchday;
    return NextResponse.json({
      matchdays: databaseRows,
      current_matchday: active || lastCompleted || 1,
      is_active: Boolean(active),
      deadline: null,
      fixture_count: 0,
      source: 'database-fallback',
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching matchdays:', error);
    return NextResponse.json({ error: 'Calendario Fantacalcio temporaneamente non disponibile' }, { status: 500 });
  }
}
