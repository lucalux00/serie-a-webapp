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
  singles: [SinglePrediction, SinglePrediction, SinglePrediction, SinglePrediction];
  multiples: [MultiplePrediction, MultiplePrediction, MultiplePrediction];
};

const operators = {
  SNAI: "https://www.snai.it/",
  Sisal: "https://www.sisal.it/",
  Eurobet: "https://www.eurobet.it/",
} as const;

type Operator = keyof typeof operators;

const bonusInfo = "Requisiti e T&C disponibili nella scheda ufficiale";
const multipleBonusInfo = "Informazioni, requisiti e T&C sul sito ufficiale";

const singleAffiliateLinks = (odds: number): AffiliateLink[] => [
  { operator: "SNAI", bonusInfo, link: operators.SNAI, oddsValue: odds },
  { operator: "Sisal", bonusInfo, link: operators.Sisal, oddsValue: Number(Math.max(1.01, odds - 0.02).toFixed(2)) },
  { operator: "Eurobet", bonusInfo, link: operators.Eurobet, oddsValue: Number(Math.max(1.01, odds - 0.01).toFixed(2)) },
];

const createMultiple = (
  type: MultipleType,
  matches: MultipleMatch[],
  comparedOperators: [Operator, Operator],
): MultiplePrediction => ({
  type,
  totalOdds: Number(matches.reduce((total, match) => total * match.odds, 1).toFixed(2)),
  matches,
  affiliateLinks: comparedOperators.map((operator) => ({
    operator,
    bonusInfo: multipleBonusInfo,
    link: operators[operator],
  })),
});

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
        analysis: "L'Inter presenta maggiore profondità offensiva e un rendimento interno più stabile; il Torino tende a concedere campo contro squadre ad alto possesso.",
        affiliateLinks: singleAffiliateLinks(1.48),
      },
      {
        id: "serie-a-002",
        match: "Napoli - Udinese",
        date: "2026-09-13T15:00:00+02:00",
        pick: "Over 1.5 gol",
        odds: 1.42,
        confidence: 79,
        analysis: "Il Napoli produce un volume elevato di occasioni in casa e l'Udinese può creare pericoli nelle transizioni.",
        affiliateLinks: singleAffiliateLinks(1.42),
      },
      {
        id: "serie-a-003",
        match: "Roma - Bologna",
        date: "2026-09-13T20:45:00+02:00",
        pick: "Gol squadra casa",
        odds: 1.36,
        confidence: 76,
        analysis: "La Roma crea con continuità davanti al proprio pubblico; il Bologna può lasciare spazi alle spalle della prima pressione.",
        affiliateLinks: singleAffiliateLinks(1.36),
      },
      {
        id: "serie-a-004",
        match: "Atalanta - Lazio",
        date: "2026-09-14T20:45:00+02:00",
        pick: "Entrambe segnano",
        odds: 1.72,
        confidence: 71,
        analysis: "Entrambe le squadre hanno soluzioni tra le linee e una propensione offensiva elevata; sono probabili occasioni su entrambi i fronti.",
        affiliateLinks: singleAffiliateLinks(1.72),
      },
    ],
    multiples: [
      createMultiple("Raddoppio", [
        { match: "Napoli - Udinese", pick: "Over 1.5 gol", odds: 1.42 },
        { match: "Inter - Torino", pick: "Inter vincente", odds: 1.48 },
      ], ["SNAI", "Sisal"]),
      createMultiple("Bilanciata", [
        { match: "Inter - Torino", pick: "Inter + Over 1.5", odds: 1.62 },
        { match: "Atalanta - Lazio", pick: "Entrambe segnano", odds: 1.72 },
        { match: "Roma - Bologna", pick: "Roma segna per prima", odds: 1.58 },
      ], ["SNAI", "Eurobet"]),
      createMultiple("Alta Quota", [
        { match: "Roma - Bologna", pick: "Roma + Over 1.5", odds: 1.95 },
        { match: "Atalanta - Lazio", pick: "Over 2.5 gol", odds: 2.15 },
        { match: "Napoli - Udinese", pick: "Napoli vince senza subire", odds: 2.4 },
      ], ["Sisal", "Eurobet"]),
    ],
  },
  {
    leagueId: "premier-league",
    leagueName: "Premier League",
    singles: [
      {
        id: "premier-league-001",
        match: "Arsenal - Everton",
        date: "2026-09-12T16:00:00+01:00",
        pick: "Arsenal vincente",
        odds: 1.44,
        confidence: 83,
        analysis: "L'Arsenal mantiene un ritmo elevato in casa e dispone di più soluzioni contro blocchi bassi come quello dell'Everton.",
        affiliateLinks: singleAffiliateLinks(1.44),
      },
      {
        id: "premier-league-002",
        match: "Liverpool - West Ham",
        date: "2026-09-12T18:30:00+01:00",
        pick: "Over 2.5 gol",
        odds: 1.62,
        confidence: 78,
        analysis: "Il volume offensivo del Liverpool e la pericolosità del West Ham in transizione alzano la proiezione complessiva delle reti.",
        affiliateLinks: singleAffiliateLinks(1.62),
      },
      {
        id: "premier-league-003",
        match: "Chelsea - Newcastle",
        date: "2026-09-13T15:00:00+01:00",
        pick: "Entrambe segnano",
        odds: 1.68,
        confidence: 74,
        analysis: "Le due squadre attaccano con molti uomini e concedono opportunità quando perdono il possesso nella metà campo avversaria.",
        affiliateLinks: singleAffiliateLinks(1.68),
      },
      {
        id: "premier-league-004",
        match: "Manchester City - Aston Villa",
        date: "2026-09-13T17:30:00+01:00",
        pick: "Manchester City segna 2+ gol",
        odds: 1.55,
        confidence: 80,
        analysis: "Il City crea molte occasioni contro difese che provano a costruire dal basso; il profilo dell'Aston Villa può generare una gara aperta.",
        affiliateLinks: singleAffiliateLinks(1.55),
      },
    ],
    multiples: [
      createMultiple("Raddoppio", [
        { match: "Arsenal - Everton", pick: "Arsenal vincente", odds: 1.44 },
        { match: "Liverpool - West Ham", pick: "Over 1.5 gol", odds: 1.3 },
      ], ["SNAI", "Eurobet"]),
      createMultiple("Bilanciata", [
        { match: "Chelsea - Newcastle", pick: "Entrambe segnano", odds: 1.68 },
        { match: "Manchester City - Aston Villa", pick: "City vincente", odds: 1.46 },
        { match: "Liverpool - West Ham", pick: "Liverpool segna per primo", odds: 1.42 },
      ], ["Sisal", "Eurobet"]),
      createMultiple("Alta Quota", [
        { match: "Arsenal - Everton", pick: "Arsenal + Over 2.5", odds: 2.05 },
        { match: "Chelsea - Newcastle", pick: "Pareggio", odds: 3.65 },
        { match: "Manchester City - Aston Villa", pick: "Entrambe segnano", odds: 1.82 },
      ], ["SNAI", "Sisal"]),
    ],
  },
  {
    leagueId: "la-liga",
    leagueName: "La Liga",
    singles: [
      {
        id: "la-liga-001",
        match: "Real Madrid - Getafe",
        date: "2026-09-12T18:30:00+02:00",
        pick: "Real Madrid vincente",
        odds: 1.35,
        confidence: 85,
        analysis: "Il Real Madrid dispone di un vantaggio netto per qualità e produzione offensiva, soprattutto nelle gare interne contro blocchi compatti.",
        affiliateLinks: singleAffiliateLinks(1.35),
      },
      {
        id: "la-liga-002",
        match: "Barcellona - Villarreal",
        date: "2026-09-12T21:00:00+02:00",
        pick: "Over 2.5 gol",
        odds: 1.58,
        confidence: 77,
        analysis: "Barcellona e Villarreal cercano il possesso e costruiscono molte occasioni, lasciando però spazi attaccabili in transizione.",
        affiliateLinks: singleAffiliateLinks(1.58),
      },
      {
        id: "la-liga-003",
        match: "Atletico Madrid - Betis",
        date: "2026-09-13T18:30:00+02:00",
        pick: "Atletico Madrid draw no bet",
        odds: 1.38,
        confidence: 73,
        analysis: "L'Atletico è più solido in casa e concede poche occasioni pulite, mentre il Betis può soffrire la pressione sui primi passaggi.",
        affiliateLinks: singleAffiliateLinks(1.38),
      },
      {
        id: "la-liga-004",
        match: "Real Sociedad - Siviglia",
        date: "2026-09-14T21:00:00+02:00",
        pick: "Under 3.5 gol",
        odds: 1.4,
        confidence: 75,
        analysis: "La struttura delle due squadre favorisce una partita controllata, con pochi rischi nella prima fase e ritmi tendenzialmente bassi.",
        affiliateLinks: singleAffiliateLinks(1.4),
      },
    ],
    multiples: [
      createMultiple("Raddoppio", [
        { match: "Real Madrid - Getafe", pick: "Real Madrid vincente", odds: 1.35 },
        { match: "Real Sociedad - Siviglia", pick: "Under 3.5 gol", odds: 1.4 },
      ], ["SNAI", "Sisal"]),
      createMultiple("Bilanciata", [
        { match: "Barcellona - Villarreal", pick: "Over 2.5 gol", odds: 1.58 },
        { match: "Atletico Madrid - Betis", pick: "Atletico draw no bet", odds: 1.38 },
        { match: "Real Madrid - Getafe", pick: "Real Madrid segna 2+ gol", odds: 1.52 },
      ], ["SNAI", "Eurobet"]),
      createMultiple("Alta Quota", [
        { match: "Barcellona - Villarreal", pick: "Barcellona + Over 3.5", odds: 2.7 },
        { match: "Atletico Madrid - Betis", pick: "Atletico vince senza subire", odds: 2.35 },
        { match: "Real Sociedad - Siviglia", pick: "Pareggio", odds: 3.25 },
      ], ["Sisal", "Eurobet"]),
    ],
  },
  {
    leagueId: "bundesliga",
    leagueName: "Bundesliga",
    singles: [
      {
        id: "bundesliga-001",
        match: "Bayern Monaco - Werder Brema",
        date: "2026-09-12T15:30:00+02:00",
        pick: "Bayern Monaco segna 2+ gol",
        odds: 1.38,
        confidence: 84,
        analysis: "Il Bayern produce molti tiri e recupera palla in zone avanzate; il Werder tende a concedere occasioni contro squadre ad alta intensità.",
        affiliateLinks: singleAffiliateLinks(1.38),
      },
      {
        id: "bundesliga-002",
        match: "Borussia Dortmund - Mainz",
        date: "2026-09-12T18:30:00+02:00",
        pick: "Over 2.5 gol",
        odds: 1.57,
        confidence: 78,
        analysis: "Il Dortmund spinge con continuità sulle corsie e il Mainz può contribuire in ripartenza, aumentando la probabilità di almeno tre reti.",
        affiliateLinks: singleAffiliateLinks(1.57),
      },
      {
        id: "bundesliga-003",
        match: "Bayer Leverkusen - Hoffenheim",
        date: "2026-09-13T15:30:00+02:00",
        pick: "Bayer Leverkusen vincente",
        odds: 1.46,
        confidence: 80,
        analysis: "Il Leverkusen ha maggiore controllo territoriale e varietà nelle rifiniture; l'Hoffenheim può soffrire le rotazioni tra fascia e mezzo spazio.",
        affiliateLinks: singleAffiliateLinks(1.46),
      },
      {
        id: "bundesliga-004",
        match: "RB Lipsia - Eintracht Francoforte",
        date: "2026-09-13T17:30:00+02:00",
        pick: "Entrambe segnano",
        odds: 1.65,
        confidence: 74,
        analysis: "Entrambe attaccano rapidamente la profondità e possono creare occasioni dopo recupero palla, con difese spesso esposte in campo aperto.",
        affiliateLinks: singleAffiliateLinks(1.65),
      },
    ],
    multiples: [
      createMultiple("Raddoppio", [
        { match: "Bayern Monaco - Werder Brema", pick: "Bayern segna 2+ gol", odds: 1.38 },
        { match: "Bayer Leverkusen - Hoffenheim", pick: "Leverkusen vincente", odds: 1.46 },
      ], ["SNAI", "Eurobet"]),
      createMultiple("Bilanciata", [
        { match: "Borussia Dortmund - Mainz", pick: "Over 2.5 gol", odds: 1.57 },
        { match: "RB Lipsia - Eintracht Francoforte", pick: "Entrambe segnano", odds: 1.65 },
        { match: "Bayern Monaco - Werder Brema", pick: "Bayern primo gol", odds: 1.28 },
      ], ["Sisal", "Eurobet"]),
      createMultiple("Alta Quota", [
        { match: "Bayern Monaco - Werder Brema", pick: "Bayern + Over 3.5", odds: 2.15 },
        { match: "Borussia Dortmund - Mainz", pick: "Dortmund + entrambe segnano", odds: 2.75 },
        { match: "RB Lipsia - Eintracht Francoforte", pick: "Pareggio", odds: 3.7 },
      ], ["SNAI", "Sisal"]),
    ],
  },
  {
    leagueId: "ligue-1",
    leagueName: "Ligue 1",
    singles: [
      {
        id: "ligue-1-001",
        match: "PSG - Nantes",
        date: "2026-09-12T21:00:00+02:00",
        pick: "PSG vincente",
        odds: 1.3,
        confidence: 86,
        analysis: "Il PSG ha un vantaggio tecnico marcato e crea molte occasioni in casa; il Nantes può faticare a uscire dalla pressione iniziale.",
        affiliateLinks: singleAffiliateLinks(1.3),
      },
      {
        id: "ligue-1-002",
        match: "Marsiglia - Lens",
        date: "2026-09-13T17:05:00+02:00",
        pick: "Entrambe segnano",
        odds: 1.7,
        confidence: 72,
        analysis: "Marsiglia e Lens mantengono un'impostazione offensiva e possono sfruttare gli spazi lasciati dalla pressione avversaria.",
        affiliateLinks: singleAffiliateLinks(1.7),
      },
      {
        id: "ligue-1-003",
        match: "Monaco - Lille",
        date: "2026-09-13T20:45:00+02:00",
        pick: "Over 1.5 gol",
        odds: 1.35,
        confidence: 79,
        analysis: "Le due squadre possiedono qualità negli ultimi trenta metri e producono occasioni anche contro avversari ben organizzati.",
        affiliateLinks: singleAffiliateLinks(1.35),
      },
      {
        id: "ligue-1-004",
        match: "Lione - Rennes",
        date: "2026-09-14T20:45:00+02:00",
        pick: "Lione draw no bet",
        odds: 1.55,
        confidence: 69,
        analysis: "Il fattore campo e la capacità del Lione di occupare l'area avversaria compensano l'equilibrio tecnico previsto contro il Rennes.",
        affiliateLinks: singleAffiliateLinks(1.55),
      },
    ],
    multiples: [
      createMultiple("Raddoppio", [
        { match: "PSG - Nantes", pick: "PSG vincente", odds: 1.3 },
        { match: "Monaco - Lille", pick: "Over 1.5 gol", odds: 1.35 },
      ], ["SNAI", "Sisal"]),
      createMultiple("Bilanciata", [
        { match: "Marsiglia - Lens", pick: "Entrambe segnano", odds: 1.7 },
        { match: "Lione - Rennes", pick: "Lione draw no bet", odds: 1.55 },
        { match: "PSG - Nantes", pick: "PSG segna 2+ gol", odds: 1.42 },
      ], ["SNAI", "Eurobet"]),
      createMultiple("Alta Quota", [
        { match: "PSG - Nantes", pick: "PSG vince senza subire", odds: 1.95 },
        { match: "Marsiglia - Lens", pick: "Marsiglia + entrambe segnano", odds: 3.1 },
        { match: "Monaco - Lille", pick: "Pareggio", odds: 3.5 },
      ], ["Sisal", "Eurobet"]),
    ],
  },
  {
    leagueId: "champions-league",
    leagueName: "Champions League",
    singles: [
      {
        id: "champions-league-001",
        match: "Real Madrid - Benfica",
        date: "2026-09-15T21:00:00+02:00",
        pick: "Real Madrid vincente",
        odds: 1.52,
        confidence: 80,
        analysis: "Il Real Madrid dispone di maggiore profondità e sa aumentare il ritmo nei momenti chiave delle gare europee, soprattutto in casa.",
        affiliateLinks: singleAffiliateLinks(1.52),
      },
      {
        id: "champions-league-002",
        match: "Liverpool - Inter",
        date: "2026-09-15T21:00:00+02:00",
        pick: "Entrambe segnano",
        odds: 1.66,
        confidence: 73,
        analysis: "Liverpool e Inter hanno struttura e qualità per creare occasioni contro pressione alta e difesa posizionale.",
        affiliateLinks: singleAffiliateLinks(1.66),
      },
      {
        id: "champions-league-003",
        match: "Bayern Monaco - Atletico Madrid",
        date: "2026-09-16T21:00:00+02:00",
        pick: "Bayern Monaco draw no bet",
        odds: 1.4,
        confidence: 76,
        analysis: "Il Bayern dovrebbe controllare il territorio, mentre la protezione dal pareggio tiene conto della capacità dell'Atletico di abbassare i ritmi.",
        affiliateLinks: singleAffiliateLinks(1.4),
      },
      {
        id: "champions-league-004",
        match: "PSG - Barcellona",
        date: "2026-09-16T21:00:00+02:00",
        pick: "Over 2.5 gol",
        odds: 1.64,
        confidence: 75,
        analysis: "La qualità offensiva e la propensione al possesso di entrambe rendono probabile una gara con occasioni numerose e ritmi elevati.",
        affiliateLinks: singleAffiliateLinks(1.64),
      },
    ],
    multiples: [
      createMultiple("Raddoppio", [
        { match: "Real Madrid - Benfica", pick: "Real Madrid vincente", odds: 1.52 },
        { match: "Bayern Monaco - Atletico Madrid", pick: "Bayern draw no bet", odds: 1.4 },
      ], ["SNAI", "Eurobet"]),
      createMultiple("Bilanciata", [
        { match: "Liverpool - Inter", pick: "Entrambe segnano", odds: 1.66 },
        { match: "PSG - Barcellona", pick: "Over 2.5 gol", odds: 1.64 },
        { match: "Real Madrid - Benfica", pick: "Over 1.5 gol", odds: 1.28 },
      ], ["Sisal", "Eurobet"]),
      createMultiple("Alta Quota", [
        { match: "Real Madrid - Benfica", pick: "Real Madrid + Over 2.5", odds: 2.25 },
        { match: "Liverpool - Inter", pick: "Pareggio", odds: 3.8 },
        { match: "PSG - Barcellona", pick: "Entrambe segnano nei due tempi", odds: 3.25 },
      ], ["SNAI", "Sisal"]),
    ],
  },
] satisfies LeaguePredictions[];
