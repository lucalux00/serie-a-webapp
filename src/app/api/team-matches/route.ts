import { NextResponse } from 'next/server';

const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

// Mapping ID squadra del sito -> ID football-data.org
const TEAM_ID_MAP: Record<string, number> = {
  // Serie A
  'napoli': 113, 'inter': 108, 'milan': 98, 'juventus': 109,
  'roma': 100, 'lazio': 110, 'atalanta': 102, 'fiorentina': 99,
  'torino': 586, 'bologna': 103, 'genoa': 107, 'cagliari': 104,
  'udinese': 115, 'lecce': 1597, 'empoli': 445, 'monza': 5911,
  'verona': 450, 'parma': 112, 'venezia': 454, 'como': 584,
  // Premier League
  'arsenal': 57, 'chelsea': 61, 'liverpool': 64, 'manchester-city': 65,
  'manchester-united': 66, 'tottenham': 73, 'newcastle': 67, 'aston-villa': 58,
  'brighton': 397, 'nottingham': 351, 'brentford': 402, 'bournemouth': 1044,
  'crystal-palace': 354, 'everton': 62, 'fulham': 63, 'ipswich-town': 349,
  // La Liga
  'real-madrid': 86, 'fcbarcellona': 81, 'atlticodemadrid': 78, 'villarreal': 94,
  'real-sociedad': 92, 'athleticbilbao': 77, 'real-betis': 90, 'celtadevigo': 558,
  // Bundesliga
  'fcbayernmonaco': 5, 'dortmund': 4, 'bayer-leverkusen': 3, 'rblipsia': 721,
  'vfbstoccarda': 10, 'eintrachtfrancoforte': 19, 'hoffenheim': 529,
  'scfriburgo': 17, 'svwerderbrema': 12, 'borussia-monchengladbach': 18,
  // Ligue 1
  'fcparissaintgermain': 524, 'monaco': 548, 'losclilla': 521, 'olympiquemarsiglia': 516,
  'olympiquelione': 523, 'rennes': 529, 'lens': 546, 'ogcnizza': 522,
};

async function footballFetch(endpoint: string) {
  const res = await fetch(`${FOOTBALL_API_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY! },
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamSlug = searchParams.get('teamId');

  if (!teamSlug) {
    return NextResponse.json({ error: 'teamId richiesto' }, { status: 400 });
  }

  const teamId = TEAM_ID_MAP[teamSlug];
  if (!teamId) {
    return NextResponse.json({ matches: [], message: 'Squadra non mappata' });
  }

  try {
    // Prendi le ultime 3 finite + le prossime 3 programmate
    const [finishedData, scheduledData] = await Promise.all([
      footballFetch(`/teams/${teamId}/matches?status=FINISHED&limit=3`),
      footballFetch(`/teams/${teamId}/matches?status=SCHEDULED&limit=3`),
    ]);

    const mapMatch = (m: any) => ({
      id: m.id,
      competition: m.competition?.name || 'Competizione',
      competitionEmblem: m.competition?.emblem || null,
      matchday: m.matchday,
      utcDate: m.utcDate,
      dateLabel: m.utcDate 
        ? new Date(m.utcDate).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/D',
      timeLabel: m.utcDate 
        ? new Date(m.utcDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        : '',
      status: m.status,
      home: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        shortName: m.homeTeam.shortName || m.homeTeam.name,
        crest: m.homeTeam.crest || null,
      },
      away: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        shortName: m.awayTeam.shortName || m.awayTeam.name,
        crest: m.awayTeam.crest || null,
      },
      score: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
        halfHome: m.score?.halfTime?.home ?? null,
        halfAway: m.score?.halfTime?.away ?? null,
      },
      winner: m.score?.winner || null,
      venue: m.venue || null,
    });

    const finished = (finishedData.matches || []).map(mapMatch).reverse(); // più recenti prima
    const scheduled = (scheduledData.matches || []).map(mapMatch);

    return NextResponse.json({ finished, scheduled });

  } catch (e: any) {
    console.error('[team-matches API]', e.message);
    return NextResponse.json({ error: e.message, finished: [], scheduled: [] }, { status: 500 });
  }
}
