import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ApiFixture = { fixture: { id: number; status: { short: string; elapsed: number | null } }; teams: { home: { name: string; logo: string }; away: { name: string; logo: string } }; goals: { home: number | null; away: number | null }; events?: Array<{ time: { elapsed: number | null; extra: number | null }; type: string; detail: string; team: { name: string } }> };

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return NextResponse.json({ error: 'Live non configurato', fixtures: [] }, { status: 503 });
  try {
    const response = await fetch('https://v3.football.api-sports.io/fixtures?league=135&live=all', { headers: { 'x-apisports-key': key }, next: { revalidate: 180 } });
    if (!response.ok) throw new Error(`API-Football ${response.status}`);
    const data = await response.json() as { response?: ApiFixture[] };
    const fixtures = (data.response || []).map((match) => ({
      id: match.fixture.id,
      status: match.fixture.status.short,
      minute: match.fixture.status.elapsed,
      home: match.teams.home,
      away: match.teams.away,
      goals: match.goals,
      events: (match.events || []).filter((event) => ['Goal', 'Card'].includes(event.type)).map((event) => ({ minute: event.time.elapsed, extra: event.time.extra, type: event.type, detail: event.detail, team: event.team.name })),
    }));
    return NextResponse.json({ fixtures, refreshedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60' } });
  } catch (error) {
    console.error('[serie-a-live]', error);
    return NextResponse.json({ error: 'Dati live temporaneamente non disponibili', fixtures: [] }, { status: 502 });
  }
}
