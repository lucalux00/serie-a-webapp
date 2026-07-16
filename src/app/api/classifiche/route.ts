import { NextResponse } from 'next/server';

const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

const LEAGUE_CODES: Record<string, string> = {
  'A': 'SA',
  'B': 'SB',
  'PL': 'PL',
  'LL': 'PD',
  'BL': 'BL1',
  'L1': 'FL1',
};

async function fetchFromApi(endpoint: string) {
  const res = await fetch(`${FOOTBALL_API_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY! },
    next: { revalidate: 3600 } // Cache 1 ora
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`football-data.org error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueKey = searchParams.get('league') || 'A';
  const type = searchParams.get('type') || 'standings'; // 'standings' | 'matches'
  const matchday = searchParams.get('matchday');

  const leagueCode = LEAGUE_CODES[leagueKey];
  if (!leagueCode) {
    return NextResponse.json({ error: 'Campionato non supportato' }, { status: 400 });
  }

  try {
    if (type === 'standings') {
      const data = await fetchFromApi(`/competitions/${leagueCode}/standings`);
      
      const standings = data.standings?.[0]?.table?.map((t: any) => ({
        pos: t.position,
        team: t.team.name,
        teamId: t.team.id,
        crest: t.team.crest,
        points: t.points,
        played: t.playedGames,
        w: t.won,
        d: t.draw,
        l: t.lost,
        gf: t.goalsFor,
        ga: t.goalsAgainst,
        gd: t.goalDifference,
        form: t.form || null,
      })) || [];

      return NextResponse.json({
        season: data.season?.startDate ? `${new Date(data.season.startDate).getFullYear()}/${new Date(data.season.endDate).getFullYear()}` : '2024/25',
        currentMatchday: data.season?.currentMatchday,
        standings,
      });
    }

    if (type === 'matches') {
      // Recupera partite per giornata specifica o le prossime/ultime
      let endpoint = `/competitions/${leagueCode}/matches`;
      if (matchday) {
        endpoint += `?matchday=${matchday}`;
      } else {
        endpoint += `?status=SCHEDULED&limit=10`;
      }
      
      const data = await fetchFromApi(endpoint);
      
      const matches = (data.matches || []).map((m: any) => ({
        id: m.id,
        round: m.matchday,
        date: m.utcDate 
          ? new Date(m.utcDate).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'Data N/D',
        utcDate: m.utcDate,
        home: m.homeTeam.name,
        homeCrest: m.homeTeam.crest,
        away: m.awayTeam.name,
        awayCrest: m.awayTeam.crest,
        homeScore: m.score?.fullTime?.home ?? null,
        awayScore: m.score?.fullTime?.away ?? null,
        status: m.status,
        matchday: m.matchday,
      }));

      return NextResponse.json({
        currentMatchday: data.competition?.lastUpdated,
        matches,
      });
    }

    return NextResponse.json({ error: 'type non valido' }, { status: 400 });

  } catch (err: any) {
    console.error('[classifiche API]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
