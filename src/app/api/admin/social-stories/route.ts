import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';

const ADMINS = ['lucapinelli0000@gmail.com', 'luca.pinelli0000@gmail.com'];

export async function GET() {
  const user = await getUserFromCookie();
  if (!user || !ADMINS.includes(user.email || '')) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Dati calendario non configurati' }, { status: 503 });
  const response = await fetch('https://api.football-data.org/v4/competitions/SA/matches?status=SCHEDULED', { headers: { 'X-Auth-Token': apiKey }, next: { revalidate: 900 } });
  if (!response.ok) return NextResponse.json({ error: 'Calendario non disponibile' }, { status: 502 });
  const matches = (await response.json()).matches || [];
  if (!matches.length) return NextResponse.json({ hasDraft: false, stories: [] });
  const matchday = matches[0].matchday;
  const fixtures = matches.filter((m: any) => m.matchday === matchday).slice(0, 10).map((m: any) => ({ home: m.homeTeam.shortName || m.homeTeam.name, away: m.awayTeam.shortName || m.awayTeam.name, date: m.utcDate }));
  const stories = fixtures.flatMap((fixture: any) => [{ team: fixture.home, opponent: fixture.away, venue: 'casa', date: fixture.date }, { team: fixture.away, opponent: fixture.home, venue: 'trasferta', date: fixture.date }]).map((story: any) => ({
    ...story,
    caption: `STORY ${story.team.toUpperCase()}\n${story.team} vs ${story.opponent}\n${new Date(story.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}\nAnalisi pre-partita sul sito. Dati e statistiche a scopo informativo.`,
    visualUrl: `/api/social/matchday-story?team=${encodeURIComponent(story.team)}`,
  }));
  const report = [`GIORNATA ${matchday} — REPORT COMPLETO`, '', ...fixtures.map((f: any, i: number) => `${i + 1}. ${f.home} - ${f.away}`), '', 'Tutte le analisi pre-partita sono disponibili sul sito. Contenuto statistico e informativo.'].join('\n');
  return NextResponse.json({ hasDraft: true, matchday, fixtures, stories, report, overviewUrl: '/api/social/matchday-story?mode=overview' });
}
