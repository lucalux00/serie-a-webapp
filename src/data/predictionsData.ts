export type SinglePrediction = {
  id: string;
  match: string;
  date: string;
  pick: string;
  odds: number | null;
  oddsSource: "market" | "unavailable";
  oddsProvider?: string;
  oddsUpdatedAt?: string;
  bookmakerCount?: number;
  oddsMin?: number;
  oddsMax?: number;
  confidence: number;
  analysis: string;
};

export type MultipleType = "Raddoppio" | "Bilanciata" | "Alta Quota";

export type MultipleMatch = {
  match: string;
  pick: string;
};

export type MultiplePrediction = {
  type: MultipleType;
  matches: MultipleMatch[];
};

export type LeaguePredictions = {
  leagueId: string;
  leagueName: string;
  roundLabel: string;
  startsAt: string | null;
  isImmediate?: boolean;
  singles: SinglePrediction[];
  multiples: MultiplePrediction[];
};

export type PredictionsResponse = {
  generatedAt: string;
  leagues: LeaguePredictions[];
};

export const LEAGUE_CONFIGS = [
  { leagueId: "oggi-domani", leagueName: "Oggi e domani", code: "IMMEDIATE" },
  { leagueId: "serie-a", leagueName: "Serie A", code: "SA" },
  { leagueId: "premier-league", leagueName: "Premier League", code: "PL" },
  { leagueId: "la-liga", leagueName: "La Liga", code: "PD" },
  { leagueId: "bundesliga", leagueName: "Bundesliga", code: "BL1" },
  { leagueId: "ligue-1", leagueName: "Ligue 1", code: "FL1" },
  { leagueId: "champions-league", leagueName: "Champions League", code: "CL" },
] as const;
