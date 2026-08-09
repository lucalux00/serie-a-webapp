import "server-only";

export type MarketOddsTier = "safe" | "balanced" | "high";

export type MarketOddsFixture = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string | Date;
  competitionCode: string | null;
  quotes: Array<{ tier?: MarketOddsTier; type: string; pick: string }>;
};

export type MarketOddsValue = {
  odds: number;
  oddsMin: number;
  oddsMax: number;
  bookmakerCount: number;
  sampleSize: number;
  provider: "API-Football";
  updatedAt: string;
};

type ApiFixture = {
  fixture: { id: number; date: string };
  teams: { home: { name: string }; away: { name: string } };
};

type ApiBet = {
  id: number;
  name: string;
  values: Array<{ value: string; odd: string }>;
};

type ApiOddsEvent = {
  fixture: { id: number; date: string };
  update: string;
  bookmakers: Array<{ bets: ApiBet[] }>;
};

type ApiPaging = { current?: number; total?: number };

type ApiResponse<T> = {
  errors?: Record<string, string> | string[];
  response?: T[];
  paging?: ApiPaging;
};

const API_BASE = "https://v3.football.api-sports.io";
const CACHE_SECONDS = 6 * 60 * 60;
const API_LEAGUES: Record<string, number> = { SA: 135, PL: 39, PD: 140, BL1: 78, FL1: 61, CL: 2 };

function apiConfiguration(): { headers: Record<string, string> } | null {
  if (process.env.API_FOOTBALL_KEY) {
    return { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } };
  }
  if (process.env.RAPIDAPI_KEY) {
    return {
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    };
  }
  return null;
}

function apiErrors(errors: ApiResponse<unknown>["errors"]) {
  if (!errors) return [];
  return Array.isArray(errors) ? errors.filter(Boolean) : Object.values(errors).filter(Boolean);
}

async function apiFetchPage<T>(path: string, headers: Record<string, string>) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    next: { revalidate: CACHE_SECONDS },
  });
  if (!response.ok) throw new Error(`API-Football ${response.status}`);
  const payload = await response.json() as ApiResponse<T>;
  const errors = apiErrors(payload.errors);
  if (errors.length) throw new Error(errors.join("; "));
  return {
    items: payload.response ?? [],
    paging: payload.paging ?? {},
  };
}

async function apiFetch<T>(path: string, headers: Record<string, string>): Promise<T[]> {
  return (await apiFetchPage<T>(path, headers)).items;
}

function seasonFor(date: string | Date) {
  const value = new Date(date);
  return value.getUTCMonth() >= 6 ? value.getUTCFullYear() : value.getUTCFullYear() - 1;
}

function dateOnly(date: string | Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function canonicalTeam(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fc|ac|cf|ssc|ss|as|us|football|club|calcio)\b/g, "")
    .replace(/[^a-z0-9]/g, "");

  const aliases: Array<[RegExp, string]> = [
    [/internazionale|intermilan|^inter$/, "inter"],
    [/parissaintgermain|parissg|^psg$/, "psg"],
    [/bayernmunich|bayernmunchen/, "bayern"],
    [/manchestercity|mancity/, "mancity"],
    [/manchesterunited|manunited|manutd/, "manunited"],
    [/borussiadortmund|^dortmund$/, "dortmund"],
    [/borussiamonchengladbach|monchengladbach|mgladbach/, "monchengladbach"],
    [/bayerleverkusen|^leverkusen$/, "leverkusen"],
    [/atleticomadrid|atleticodemadrid/, "atleticomadrid"],
    [/stadebrestois|^brest$/, "brest"],
  ];
  return aliases.find(([pattern]) => pattern.test(normalized))?.[1] ?? normalized;
}

function teamsMatch(left: string, right: string) {
  const a = canonicalTeam(left);
  const b = canonicalTeam(right);
  return a === b || (Math.min(a.length, b.length) >= 5 && (a.includes(b) || b.includes(a)));
}

function findApiFixture(target: MarketOddsFixture, fixtures: ApiFixture[]) {
  const targetTime = new Date(target.matchDate).getTime();
  return fixtures.find((fixture) => {
    const timeDifference = Math.abs(new Date(fixture.fixture.date).getTime() - targetTime);
    return timeDifference <= 18 * 60 * 60 * 1000
      && teamsMatch(target.homeTeam, fixture.teams.home.name)
      && teamsMatch(target.awayTeam, fixture.teams.away.name);
  });
}

async function oddsForFixture(fixtureId: number, headers: Record<string, string>) {
  const { items } = await apiFetchPage<ApiOddsEvent>(`/odds?fixture=${fixtureId}`, headers);
  return items[0];
}

async function oddsForDate(date: string, headers: Record<string, string>) {
  const firstPage = await apiFetchPage<ApiOddsEvent>(`/odds?date=${date}&page=1`, headers);
  const totalPages = Math.min(firstPage.paging.total ?? firstPage.paging.current ?? 1, 10);
  if (totalPages <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      apiFetch<ApiOddsEvent>(`/odds?date=${date}&page=${index + 2}`, headers),
    ),
  );
  return [firstPage.items, ...remainingPages].flat();
}

function normalizedValue(value: string) {
  return value.toLowerCase().replace(/goals?|gol/g, "").replace(/[^a-z0-9.]/g, "");
}

function targetMarket(type: string, pick: string) {
  const normalizedType = type.toLowerCase();
  const normalizedPick = pick.toLowerCase();

  if (normalizedType.includes("doppia chance")) {
    const expected = normalizedPick.includes("1x") ? ["home/draw", "1x"]
      : normalizedPick.includes("x2") ? ["draw/away", "x2"]
        : ["home/away", "12"];
    return { betId: 12, matches: (value: string) => expected.some((item) => normalizedValue(value) === normalizedValue(item)) };
  }

  if (
    !normalizedType.includes("esito +") &&
    !normalizedType.includes("risultato/totale") &&
    (normalizedType.includes("totale") || /\b(over|under)\b/.test(normalizedPick))
  ) {
    const total = normalizedPick.match(/(over|under)\s*([0-9.]+)/);
    if (total) {
      const expected = `${total[1]}${total[2]}`;
      return { betId: 5, matches: (value: string) => normalizedValue(value).startsWith(expected) };
    }
  }

  if (normalizedType.includes("gol/no gol") || normalizedType.includes("both teams")) {
    const expected = normalizedPick.includes("non segnano") || normalizedPick.includes("no gol") ? "no" : "yes";
    return { betId: 8, matches: (value: string) => normalizedValue(value) === expected };
  }

  if (normalizedType.includes("esito +") || normalizedType.includes("risultato/totale")) {
    const total = normalizedPick.match(/(over|under)\s*([0-9.]+)/);
    const result = normalizedPick.trim().startsWith("1") ? "home" : normalizedPick.trim().startsWith("2") ? "away" : "draw";
    if (total) {
      return {
        betId: 25,
        matches: (value: string) => {
          const normalized = normalizedValue(value);
          return normalized.includes(result) && normalized.includes(`${total[1]}${total[2]}`);
        },
      };
    }
  }

  if (normalizedType.includes("esito")) {
    const expected = normalizedPick.includes("pareggio") || normalizedPick.trim() === "x" ? "draw"
      : normalizedPick.trim().startsWith("1") ? "home" : "away";
    return { betId: 1, matches: (value: string) => normalizedValue(value) === expected };
  }

  return null;
}

function bestQuotesMean(values: number[]) {
  const selected = [...values].sort((a, b) => b - a).slice(0, 4);
  if (selected.length < 3) return null;
  return {
    value: selected.reduce((sum, price) => sum + price, 0) / selected.length,
    sampleSize: selected.length,
  };
}

function extractMarketOdds(event: ApiOddsEvent, type: string, pick: string): MarketOddsValue | null {
  const market = targetMarket(type, pick);
  if (!market) return null;

  const prices = event.bookmakers.flatMap((bookmaker) => {
    const bet = bookmaker.bets.find((item) => item.id === market.betId);
    const value = bet?.values.find((item) => market.matches(item.value));
    const price = Number(value?.odd);
    return Number.isFinite(price) && price > 1 ? [price] : [];
  });
  const average = bestQuotesMean(prices);
  if (!average) return null;

  return {
    odds: Number(average.value.toFixed(2)),
    oddsMin: Math.min(...prices),
    oddsMax: Math.max(...prices),
    bookmakerCount: average.sampleSize,
    sampleSize: average.sampleSize,
    provider: "API-Football",
    updatedAt: event.update,
  };
}

export async function getMarketOdds(fixtures: MarketOddsFixture[]) {
  const configuration = apiConfiguration();
  const result = new Map<number, Map<MarketOddsTier, MarketOddsValue>>();
  if (!configuration || fixtures.length === 0) return result;

  const groups = new Map<string, MarketOddsFixture[]>();
  const immediateGroups = new Map<string, MarketOddsFixture[]>();
  for (const fixture of fixtures) {
    const leagueId = fixture.competitionCode ? API_LEAGUES[fixture.competitionCode] : undefined;
    if (!leagueId) {
      const date = dateOnly(fixture.matchDate);
      immediateGroups.set(date, [...(immediateGroups.get(date) ?? []), fixture]);
      continue;
    }
    const season = seasonFor(fixture.matchDate);
    const key = `${leagueId}:${season}`;
    groups.set(key, [...(groups.get(key) ?? []), fixture]);
  }

  const regularTasks = [...groups.entries()].map(async ([key, targets]) => {
    const [leagueId, season] = key.split(":").map(Number);
    const dates = targets.map((item) => dateOnly(item.matchDate)).sort();
    const apiFixtures = await apiFetch<ApiFixture>(
      `/fixtures?league=${leagueId}&season=${season}&from=${dates[0]}&to=${dates.at(-1)}`,
      configuration.headers,
    );
    if (!apiFixtures.length) return;

    await Promise.all(targets.map(async (target) => {
      const apiFixture = findApiFixture(target, apiFixtures);
      const oddsEvent = apiFixture
        ? await oddsForFixture(apiFixture.fixture.id, configuration.headers)
        : undefined;
      if (!oddsEvent) return;
      const quotes = new Map<MarketOddsTier, MarketOddsValue>();
      for (const quote of target.quotes) {
        if (!quote.tier) continue;
        const marketOdds = extractMarketOdds(oddsEvent, quote.type, quote.pick);
        if (marketOdds) quotes.set(quote.tier, marketOdds);
      }
      if (quotes.size) result.set(target.matchId, quotes);
    }));
  });

  const immediateTasks = [...immediateGroups.entries()].map(async ([date, targets]) => {
    const [apiFixtures, oddsEvents] = await Promise.all([
      apiFetch<ApiFixture>(`/fixtures?date=${date}`, configuration.headers),
      oddsForDate(date, configuration.headers),
    ]);
    const oddsByFixture = new Map(oddsEvents.map((event) => [event.fixture.id, event]));

    await Promise.all(targets.map(async (target) => {
      const apiFixture = findApiFixture(target, apiFixtures);
      const oddsEvent = apiFixture ? oddsByFixture.get(apiFixture.fixture.id) : undefined;
      if (!oddsEvent) return;
      const quotes = new Map<MarketOddsTier, MarketOddsValue>();
      for (const quote of target.quotes) {
        if (!quote.tier) continue;
        const marketOdds = extractMarketOdds(oddsEvent, quote.type, quote.pick);
        if (marketOdds) quotes.set(quote.tier, marketOdds);
      }
      if (quotes.size) result.set(target.matchId, quotes);
    }));
  });

  const settledGroups = await Promise.allSettled([...regularTasks, ...immediateTasks]);

  for (const group of settledGroups) {
    if (group.status === "rejected") console.warn("[market-odds] Quote reali non disponibili:", group.reason);
  }
  return result;
}
