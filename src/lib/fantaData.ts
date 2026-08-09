import 'server-only';

type FootballTeam = { id?: number; name: string; shortName?: string; tla?: string };
type FootballMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number | null;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
};
type StandingRow = {
  position: number;
  playedGames: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  team: FootballTeam;
};

export type FantaPerformanceStats = {
  seasons: number;
  appearances: number;
  starts: number | null;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number | null;
  redCards: number | null;
  rating: number | null;
  goalActions90: number;
  minutesPerAppearance: number;
  period: string;
};

export type FantaFixture = {
  matchId: number;
  matchday: number | null;
  opponent: string;
  isHome: boolean;
  kickoff: string;
  status: string;
  difficulty: number;
  difficultyPercent: number;
};

export type EnrichedFantaPlayer = {
  score: number;
  successProbability: number;
  estimatedStartProbability: number;
  bonusProbability: number;
  matchInfo: string;
  matchDifficulty: number;
  fixture: FantaFixture | null;
  stats: FantaPerformanceStats | null;
  recommendationLabel: string;
  confidence: number;
  confidenceLabel: 'Alta' | 'Media' | 'Bassa';
  scoringBreakdown: {
    team: number;
    venue: number;
    opponent: number;
    form: number;
    playingTime: number;
    bonusTrend: number;
  };
  sources: string[];
  updatedAt: string;
};

type PlayerInput = {
  playerName?: string;
  name?: string;
  teamName?: string;
  team?: string;
  role?: string;
  [key: string]: unknown;
};

type SerieAContext = {
  matches: FootballMatch[];
  currentMatchday: number;
  activeTeams: string[];
  strength: Map<string, number>;
  strengthPeriod: string;
  sourceAvailable: boolean;
  calendarSource: string;
};

const FOOTBALL_BASE = 'https://api.football-data.org/v4';
const ROLE_BASE: Record<string, number> = { POR: 67, DIF: 68, CEN: 70, ATT: 71 };
const OFFICIAL_FIRST_MATCHDAY: FootballMatch[] = [
  { id: -101, utcDate: '2026-08-22T16:30:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Inter' }, awayTeam: { name: 'Monza' } },
  { id: -102, utcDate: '2026-08-22T16:30:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Udinese' }, awayTeam: { name: 'Como' } },
  { id: -103, utcDate: '2026-08-22T18:45:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Genoa' }, awayTeam: { name: 'Napoli' } },
  { id: -104, utcDate: '2026-08-22T18:45:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Parma' }, awayTeam: { name: 'Cagliari' } },
  { id: -105, utcDate: '2026-08-23T16:30:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Frosinone' }, awayTeam: { name: 'Juventus' } },
  { id: -106, utcDate: '2026-08-23T16:30:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Venezia' }, awayTeam: { name: 'Lecce' } },
  { id: -107, utcDate: '2026-08-23T18:45:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Atalanta' }, awayTeam: { name: 'Sassuolo' } },
  { id: -108, utcDate: '2026-08-23T18:45:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Torino' }, awayTeam: { name: 'Milan' } },
  { id: -109, utcDate: '2026-08-24T16:30:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Bologna' }, awayTeam: { name: 'Lazio' } },
  { id: -110, utcDate: '2026-08-24T18:45:00Z', status: 'SCHEDULED', matchday: 1, homeTeam: { name: 'Roma' }, awayTeam: { name: 'Fiorentina' } },
];
const TEAM_ALIASES: Record<string, string> = {
  acmilan: 'milan', milan: 'milan', internazionale: 'inter', intermilano: 'inter', inter: 'inter',
  asroma: 'roma', romafc: 'roma', roma: 'roma', hellasverona: 'verona', verona: 'verona',
  juventusfc: 'juventus', ssclazio: 'lazio', sscnapoli: 'napoli', napolicalcio: 'napoli',
  acmonza: 'monza', bolognacalcio: 'bologna', torinofc: 'torino', parmacalcio: 'parma',
  uslecce: 'lecce', udinesecalcio: 'udinese', genoacfc: 'genoa', atalantabc: 'atalanta',
  acfiorentina: 'fiorentina', cagliaricalcio: 'cagliari', comocalcio: 'como',
  frosinonecalcio: 'frosinone', veneziafc: 'venezia', ussassuolocalcio: 'sassuolo',
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function canonicalTeamKey(value: string) {
  const normalized = normalize(value).replace(/footballclub|societasportiva|associazionecalcio|calcio|fc$/g, '');
  return TEAM_ALIASES[normalized] || normalized;
}

export function sameTeam(left: string, right: string) {
  const a = canonicalTeamKey(left);
  const b = canonicalTeamKey(right);
  return Boolean(a && b && (a === b || (a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a)))));
}

function teamDisplayName(team: FootballTeam) {
  return team.shortName || team.name;
}

async function footballJson<T>(path: string, revalidate: number): Promise<T | null> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(`${FOOTBALL_BASE}${path}`, {
      headers: { 'X-Auth-Token': key },
      next: { revalidate },
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

function strengthFromStandings(rows: StandingRow[]) {
  const result = new Map<string, number>();
  const total = Math.max(rows.length, 20);
  for (const row of rows) {
    const ppg = row.playedGames ? row.points / row.playedGames : 0;
    const goalDifferencePerGame = row.playedGames ? (row.goalsFor - row.goalsAgainst) / row.playedGames : 0;
    const rankSignal = 1 - (row.position - 1) / Math.max(1, total - 1);
    const value = row.playedGames
      ? 58 + ppg * 11 + goalDifferencePerGame * 4
      : 62 + rankSignal * 28;
    result.set(canonicalTeamKey(row.team.name), Math.round(clamp(value, 58, 94)));
  }
  return result;
}

export async function getSerieAContext(): Promise<SerieAContext> {
  const seasonStart = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const [matchResult, currentStandingResult, previousStandingResult] = await Promise.all([
    footballJson<{ matches?: FootballMatch[] }>('/competitions/SA/matches?status=SCHEDULED', 1800),
    footballJson<{ standings?: Array<{ type: string; table: StandingRow[] }> }>('/competitions/SA/standings', 1800),
    footballJson<{ standings?: Array<{ type: string; table: StandingRow[] }> }>(`/competitions/SA/standings?season=${seasonStart - 1}`, 86400),
  ]);

  const useOfficialFallback = !matchResult?.matches?.length && Date.now() < Date.parse('2026-08-25T00:00:00Z');
  const matches = matchResult?.matches?.length ? matchResult.matches : useOfficialFallback ? OFFICIAL_FIRST_MATCHDAY : [];
  const currentRows = currentStandingResult?.standings?.find((item) => item.type === 'TOTAL')?.table ?? [];
  const previousRows = previousStandingResult?.standings?.find((item) => item.type === 'TOTAL')?.table ?? [];
  const hasCurrentForm = currentRows.some((row) => row.playedGames > 0);
  const strengthRows = hasCurrentForm ? currentRows : previousRows;
  const strength = strengthFromStandings(strengthRows);
  const activeTeams = Array.from(new Set(matches.flatMap((match) => [teamDisplayName(match.homeTeam), teamDisplayName(match.awayTeam)])));
  for (const team of activeTeams) {
    const key = canonicalTeamKey(team);
    if (!strength.has(key)) strength.set(key, 64);
  }

  return {
    matches,
    currentMatchday: matches.find((match) => match.matchday != null)?.matchday ?? 1,
    activeTeams,
    strength,
    strengthPeriod: hasCurrentForm ? `${seasonStart}/${String(seasonStart + 1).slice(-2)}` : previousRows.length ? `${seasonStart - 1}/${String(seasonStart).slice(-2)}` : 'copertura neutra',
    sourceAvailable: Boolean(matchResult || useOfficialFallback),
    calendarSource: matchResult?.matches?.length ? 'football-data.org' : useOfficialFallback ? 'Calendario ufficiale Lega Serie A' : 'non disponibile',
  };
}

export function findTeamFixtures(teamName: string, context: SerieAContext, limit = 5): FantaFixture[] {
  return context.matches
    .filter((item) => sameTeam(teamName, item.homeTeam.name) || sameTeam(teamName, item.homeTeam.shortName || '') || sameTeam(teamName, item.awayTeam.name) || sameTeam(teamName, item.awayTeam.shortName || ''))
    .slice(0, limit)
    .map((match) => {
      const isHome = sameTeam(teamName, match.homeTeam.name) || sameTeam(teamName, match.homeTeam.shortName || '');
      const opponentTeam = isHome ? match.awayTeam : match.homeTeam;
      const opponentStrength = context.strength.get(canonicalTeamKey(opponentTeam.name)) ?? 70;
      return {
        matchId: match.id,
        matchday: match.matchday ?? null,
        opponent: teamDisplayName(opponentTeam),
        isHome,
        kickoff: match.utcDate,
        status: match.status,
        difficulty: clamp(Math.round((opponentStrength - 50) / 9), 1, 5),
        difficultyPercent: opponentStrength,
      };
    });
}

export function findTeamFixture(teamName: string, context: SerieAContext): FantaFixture | null {
  return findTeamFixtures(teamName, context, 1)[0] ?? null;
}

type BbsSeason = {
  league?: string;
  league_name?: string;
  appearances?: number;
  starts?: number;
  minutes?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  rating?: number;
};

function sum(seasons: BbsSeason[], field: keyof BbsSeason) {
  return seasons.reduce((total, season) => total + Number(season[field] || 0), 0);
}

export async function getPlayerPerformance(name: string): Promise<FantaPerformanceStats | null> {
  const key = process.env.BBS_API_KEY;
  if (!key) return null;
  const headers = { Authorization: `Bearer ${key}` };
  try {
    const playerResponse = await fetch(`https://api.bigballsdata.com/v1/players?name=${encodeURIComponent(name)}&sport=football`, { headers, next: { revalidate: 21600 } });
    if (!playerResponse.ok) return null;
    const candidates = (await playerResponse.json()).data ?? [];
    const candidateName = (candidate: { name?: string; full_name?: string; display_name?: string }) => candidate.name || candidate.full_name || candidate.display_name || '';
    const exact = candidates.find((candidate: { name?: string; full_name?: string; display_name?: string }) => normalize(candidateName(candidate)) === normalize(name));
    const player = exact || candidates[0];
    if (!player?.id) return null;
    const formResponse = await fetch(`https://api.bigballsdata.com/v1/players/${player.id}/club-form?sport=football`, { headers, next: { revalidate: 21600 } });
    if (!formResponse.ok) return null;
    const formPayload = await formResponse.json();
    const rawData = formPayload.data;
    const allSeasons = (Array.isArray(rawData) ? rawData : rawData?.seasons ?? rawData?.stats ?? []) as BbsSeason[];
    const seasons = allSeasons.filter((season) => normalize(season.league || season.league_name || '').includes('seriea')).slice(0, 3);
    if (!seasons.length) return null;
    const appearances = sum(seasons, 'appearances');
    const minutes = sum(seasons, 'minutes');
    const goals = sum(seasons, 'goals');
    const assists = sum(seasons, 'assists');
    const ratings = seasons.map((season) => Number(season.rating || 0)).filter((rating) => rating > 0);
    const startsTotal = sum(seasons, 'starts');
    const yellowCardsTotal = sum(seasons, 'yellowCards');
    const redCardsTotal = sum(seasons, 'redCards');
    return {
      seasons: seasons.length,
      appearances,
      starts: seasons.some((season) => season.starts != null) ? startsTotal : null,
      minutes,
      goals,
      assists,
      yellowCards: seasons.some((season) => season.yellowCards != null) ? yellowCardsTotal : null,
      redCards: seasons.some((season) => season.redCards != null) ? redCardsTotal : null,
      rating: ratings.length ? Number((ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(2)) : null,
      goalActions90: minutes ? Number((((goals + assists) * 90) / minutes).toFixed(2)) : 0,
      minutesPerAppearance: appearances ? Math.round(minutes / appearances) : 0,
      period: `Ultime ${seasons.length} stagioni disponibili in Serie A`,
    };
  } catch {
    return null;
  }
}

async function performanceInBatches(players: PlayerInput[], batchSize = 5) {
  const stats = new Map<string, FantaPerformanceStats | null>();
  for (let index = 0; index < players.length; index += batchSize) {
    const batch = players.slice(index, index + batchSize);
    const results = await Promise.all(batch.map((player) => getPlayerPerformance(String(player.playerName || player.name || ''))));
    batch.forEach((player, resultIndex) => stats.set(normalize(String(player.playerName || player.name || '')), results[resultIndex]));
  }
  return stats;
}

export async function enrichFantaPlayers<T extends PlayerInput>(players: T[], context?: SerieAContext): Promise<Array<T & EnrichedFantaPlayer>> {
  const serieA = context ?? await getSerieAContext();
  const performance = await performanceInBatches(players);
  const updatedAt = new Date().toISOString();

  return players.map((player) => {
    const playerName = String(player.playerName || player.name || '');
    const teamName = String(player.teamName || player.team || '');
    const role = String(player.role || '').slice(0, 3).toUpperCase();
    const stats = performance.get(normalize(playerName)) ?? null;
    const fixture = findTeamFixture(teamName, serieA);
    const teamStrength = serieA.strength.get(canonicalTeamKey(teamName)) ?? 68;
    const teamModifier = (teamStrength - 70) * 0.28;
    const venueModifier = fixture ? (fixture.isHome ? 3 : -1.5) : 0;
    const opponentModifier = fixture ? (70 - fixture.difficultyPercent) * 0.34 : 0;
    const formModifier = stats?.rating != null ? clamp((stats.rating - 6.25) * 12, -7, 10) : 0;
    const playingTimeModifier = stats ? clamp((stats.minutesPerAppearance - 55) / 7, -6, 6) : 0;
    const bonusTrendModifier = stats ? clamp(stats.goalActions90 * (role === 'ATT' ? 10 : role === 'CEN' ? 12 : 8), 0, 9) : 0;
    const rawScore = (ROLE_BASE[role] ?? 68) + teamModifier + venueModifier + opponentModifier + formModifier + playingTimeModifier + bonusTrendModifier;
    const score = Math.round(clamp(rawScore, 25, 96));
    const estimatedStartProbability = stats
      ? Math.round(clamp((stats.starts != null && stats.appearances ? stats.starts / stats.appearances : stats.minutesPerAppearance / 90) * 100, 18, 94))
      : 55;
    const bonusBase = role === 'ATT' ? 18 : role === 'CEN' ? 13 : role === 'DIF' ? 8 : 4;
    const bonusProbability = Math.round(clamp(bonusBase + (stats?.goalActions90 ?? 0) * 55 + (fixture?.isHome ? 3 : 0) - (fixture ? (fixture.difficultyPercent - 70) * 0.18 : 0), 3, 72));
    const successProbability = Math.round(clamp(48 + (score - 60) * 0.72 + (estimatedStartProbability - 55) * 0.12, 28, 88));
    const hasMeasuredStrength = serieA.strengthPeriod !== 'copertura neutra' && serieA.strength.has(canonicalTeamKey(teamName));
    const confidence = clamp((fixture ? 35 : 8) + (stats ? 45 : 10) + (hasMeasuredStrength ? 15 : 5) + (ROLE_BASE[role] ? 5 : 0), 20, 100);
    const confidenceLabel: EnrichedFantaPlayer['confidenceLabel'] = confidence >= 80 ? 'Alta' : confidence >= 55 ? 'Media' : 'Bassa';
    const matchInfo = fixture
      ? `${fixture.isHome ? 'In casa' : 'In trasferta'} contro ${fixture.opponent}`
      : 'Prossima partita non ancora disponibile dalla fonte calendario';
    const recommendationLabel = score >= 82 ? 'Priorità alta' : score >= 70 ? 'Schierabile' : score >= 58 ? 'Ballottaggio' : 'Da monitorare';
    const sources = [serieA.sourceAvailable ? serieA.calendarSource : null, stats ? 'Big Balls Sports Data' : null].filter(Boolean) as string[];

    return {
      ...player,
      score,
      successProbability,
      estimatedStartProbability,
      bonusProbability,
      matchInfo,
      matchDifficulty: fixture?.difficultyPercent ?? 50,
      fixture,
      stats,
      recommendationLabel,
      confidence,
      confidenceLabel,
      scoringBreakdown: {
        team: Number(teamModifier.toFixed(1)),
        venue: Number(venueModifier.toFixed(1)),
        opponent: Number(opponentModifier.toFixed(1)),
        form: Number(formModifier.toFixed(1)),
        playingTime: Number(playingTimeModifier.toFixed(1)),
        bonusTrend: Number(bonusTrendModifier.toFixed(1)),
      },
      sources,
      updatedAt,
    };
  }).sort((left, right) => right.score - left.score);
}
