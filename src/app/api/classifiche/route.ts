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
  const type = searchParams.get('type') || 'standings';
  const matchday = searchParams.get('matchday');
  const season = searchParams.get('season'); // es. "2024" per stagione 2024/25

  const leagueCode = LEAGUE_CODES[leagueKey];
  if (!leagueCode) {
    return NextResponse.json({ error: 'Campionato non supportato' }, { status: 400 });
  }

  try {
    if (type === 'standings') {
      const seasonParam = season ? `?season=${season}` : '';
      const data = await fetchFromApi(`/competitions/${leagueCode}/standings${seasonParam}`);

      const allStandings = data.standings?.[0]?.table || [];
      const totalPoints = allStandings.reduce((sum: number, t: any) => sum + t.points, 0);
      // Se tutti hanno 0 punti (stagione non iniziata) e non è una stagione storica, segnalalo
      const seasonNotStarted = !season && totalPoints === 0;

      const standings = allStandings.map((t: any) => ({
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
      }));

      const currentSeason = data.season?.startDate 
        ? `${new Date(data.season.startDate).getFullYear()}/${String(new Date(data.season.endDate).getFullYear()).slice(2)}`
        : '2025/26';

      // Rimosso il blocco error: 'season_not_started' per permettere la visualizzazione a 0 punti.

      return NextResponse.json({
        season: currentSeason,
        currentMatchday: data.season?.currentMatchday,
        winner: standings[0] || null,
        standings,
      });
    }

    if (type === 'scorers') {
      const seasonParam = season ? `?season=${season}&limit=20` : '?limit=20';
      const data = await fetchFromApi(`/competitions/${leagueCode}/scorers${seasonParam}`);

      const scorers = (data.scorers || []).map((s: any, idx: number) => ({
        pos: idx + 1,
        name: s.player.name,
        nationality: s.player.nationality,
        teamName: s.team.name,
        teamCrest: s.team.crest,
        goals: s.goals ?? 0,
        assists: s.assists ?? null,
        penalties: s.penalties ?? null,
        playedMatches: s.playedMatches ?? null,
      }));

      return NextResponse.json({ scorers });
    }

    if (type === 'seasons') {
      // Ritorna le stagioni disponibili per il campionato
      const data = await fetchFromApi(`/competitions/${leagueCode}`);
      const seasons = (data.seasons || [])
        .filter((s: any) => s.startDate)
        .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .map((s: any) => {
          const startYear = new Date(s.startDate).getFullYear();
          const endYear = new Date(s.endDate).getFullYear();
          return {
            year: startYear,
            label: `${startYear}/${String(endYear).slice(2)}`,
            winner: s.winner?.name || null,
            winnerCrest: s.winner?.crest || null,
            currentSeason: s.currentSeason || false,
          };
        });

      return NextResponse.json({ seasons });
    }

    if (type === 'matches') {
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
