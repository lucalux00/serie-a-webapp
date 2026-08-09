export type AffiliateLink = {
  operator: string;
  bonusInfo: string;
  link: string;
  oddsValue: number;
};

export type MultipleAffiliateLink = Omit<AffiliateLink, "oddsValue">;

export type SinglePrediction = {
  id: string;
  match: string;
  date: string;
  pick: string;
  odds: number;
  confidence: number;
  analysis: string;
  affiliateLinks: AffiliateLink[];
};

export type MultipleType = "Raddoppio" | "Bilanciata" | "Alta Quota";

export type MultipleMatch = {
  match: string;
  pick: string;
  odds: number;
};

export type MultiplePrediction = {
  type: MultipleType;
  totalOdds: number;
  matches: MultipleMatch[];
  affiliateLinks: MultipleAffiliateLink[];
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

const operators = [
  { operator: "SNAI", link: "https://www.snai.it/" },
  { operator: "Sisal", link: "https://www.sisal.it/" },
  { operator: "Eurobet", link: "https://www.eurobet.it/" },
] as const;

const bonusInfo = "Requisiti e T&C disponibili nella scheda ufficiale";

export function createAffiliateLinks(odds: number): AffiliateLink[] {
  return operators.map((operator) => ({ ...operator, bonusInfo, oddsValue: odds }));
}

export function createMultipleAffiliateLinks(): MultipleAffiliateLink[] {
  return operators.slice(0, 2).map((operator) => ({ ...operator, bonusInfo }));
}
