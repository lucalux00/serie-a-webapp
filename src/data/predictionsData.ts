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

export type MultiplePrediction = {
  type: MultipleType;
  totalOdds: number;
  matches: Array<{
    match: string;
    pick: string;
    odds: number;
  }>;
  affiliateLinks: MultipleAffiliateLink[];
};

export type LeaguePredictions = {
  leagueId: string;
  leagueName: string;
  singles: SinglePrediction[];
  multiples: readonly [MultiplePrediction, MultiplePrediction, MultiplePrediction];
};

const operatorLinks = {
  snai: "https://www.snai.it/",
  sisal: "https://www.sisal.it/",
  eurobet: "https://www.eurobet.it/",
} as const;

export const predictionsData = [
  {
    leagueId: "serie-a",
    leagueName: "Serie A",
    singles: [
      {
        id: "serie-a-001",
        match: "Inter - Torino",
        date: "2026-09-12T18:00:00+02:00",
        pick: "Inter vincente",
        odds: 1.48,
        confidence: 82,
        analysis:
          "L'Inter presenta maggiore profondità offensiva e un rendimento interno più stabile; il Torino tende a concedere campo contro squadre ad alto possesso.",
        affiliateLinks: [
          {
            operator: "SNAI",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.snai,
            oddsValue: 1.48,
          },
          {
            operator: "Sisal",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.sisal,
            oddsValue: 1.46,
          },
          {
            operator: "Eurobet",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.eurobet,
            oddsValue: 1.47,
          },
        ],
      },
      {
        id: "serie-a-002",
        match: "Napoli - Udinese",
        date: "2026-09-13T15:00:00+02:00",
        pick: "Over 1.5 gol",
        odds: 1.42,
        confidence: 79,
        analysis:
          "La proiezione premia una gara con almeno due reti: il Napoli produce un volume elevato di occasioni in casa e l'Udinese è pericolosa nelle transizioni.",
        affiliateLinks: [
          {
            operator: "SNAI",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.snai,
            oddsValue: 1.42,
          },
          {
            operator: "Sisal",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.sisal,
            oddsValue: 1.4,
          },
          {
            operator: "Eurobet",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.eurobet,
            oddsValue: 1.41,
          },
        ],
      },
      {
        id: "serie-a-003",
        match: "Roma - Bologna",
        date: "2026-09-13T20:45:00+02:00",
        pick: "Gol squadra casa",
        odds: 1.36,
        confidence: 76,
        analysis:
          "La Roma crea con continuità davanti al proprio pubblico; il Bologna difende in avanti e può lasciare spazi alle spalle della prima pressione.",
        affiliateLinks: [
          {
            operator: "SNAI",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.snai,
            oddsValue: 1.36,
          },
          {
            operator: "Sisal",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.sisal,
            oddsValue: 1.34,
          },
        ],
      },
      {
        id: "serie-a-004",
        match: "Atalanta - Lazio",
        date: "2026-09-14T20:45:00+02:00",
        pick: "Entrambe segnano",
        odds: 1.72,
        confidence: 71,
        analysis:
          "Entrambe le squadre hanno più soluzioni tra le linee e una propensione offensiva elevata; il modello stima occasioni rilevanti su entrambi i fronti.",
        affiliateLinks: [
          {
            operator: "SNAI",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.snai,
            oddsValue: 1.72,
          },
          {
            operator: "Sisal",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.sisal,
            oddsValue: 1.7,
          },
          {
            operator: "Eurobet",
            bonusInfo: "Requisiti e T&C disponibili nella scheda ufficiale",
            link: operatorLinks.eurobet,
            oddsValue: 1.71,
          },
        ],
      },
    ],
    multiples: [
      {
        type: "Raddoppio",
        totalOdds: 2.1,
        matches: [
          { match: "Napoli - Udinese", pick: "Over 1.5 gol", odds: 1.42 },
          { match: "Inter - Torino", pick: "Inter vincente", odds: 1.48 },
        ],
        affiliateLinks: [
          {
            operator: "SNAI",
            bonusInfo: "Informazioni, requisiti e T&C sul sito ufficiale",
            link: operatorLinks.snai,
          },
          {
            operator: "Sisal",
            bonusInfo: "Informazioni, requisiti e T&C sul sito ufficiale",
            link: operatorLinks.sisal,
          },
        ],
      },
      {
        type: "Bilanciata",
        totalOdds: 4.4,
        matches: [
          { match: "Inter - Torino", pick: "Inter + Over 1.5", odds: 1.62 },
          { match: "Atalanta - Lazio", pick: "Entrambe segnano", odds: 1.72 },
          { match: "Roma - Bologna", pick: "Roma segna per prima", odds: 1.58 },
        ],
        affiliateLinks: [
          {
            operator: "SNAI",
            bonusInfo: "Informazioni, requisiti e T&C sul sito ufficiale",
            link: operatorLinks.snai,
          },
          {
            operator: "Eurobet",
            bonusInfo: "Informazioni, requisiti e T&C sul sito ufficiale",
            link: operatorLinks.eurobet,
          },
        ],
      },
      {
        type: "Alta Quota",
        totalOdds: 10.06,
        matches: [
          { match: "Roma - Bologna", pick: "Roma + Over 1.5", odds: 1.95 },
          { match: "Atalanta - Lazio", pick: "Over 2.5 gol", odds: 2.15 },
          { match: "Napoli - Udinese", pick: "Napoli vince senza subire", odds: 2.4 },
        ],
        affiliateLinks: [
          {
            operator: "Sisal",
            bonusInfo: "Informazioni, requisiti e T&C sul sito ufficiale",
            link: operatorLinks.sisal,
          },
          {
            operator: "Eurobet",
            bonusInfo: "Informazioni, requisiti e T&C sul sito ufficiale",
            link: operatorLinks.eurobet,
          },
        ],
      },
    ],
  },
] satisfies readonly LeaguePredictions[];
