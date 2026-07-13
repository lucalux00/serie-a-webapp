export const MOCK_TEAMS = [
  { id: 'napoli', name: 'Napoli', logo: 'N', league: 'A', coach: 'M. Allegri' },
  { id: 'inter', name: 'Inter', logo: 'I', league: 'A', coach: 'C. Chivu' },
  { id: 'juventus', name: 'Juventus', logo: 'J', league: 'A', coach: 'L. Spalletti' },
  { id: 'milan', name: 'Milan', logo: 'M', league: 'A', coach: 'R. Amorim' },
  { id: 'roma', name: 'Roma', logo: 'R', league: 'A', coach: 'G. Gasperini' },
  { id: 'palermo', name: 'Palermo', logo: 'P', league: 'B', coach: 'A. Pirlo' },
  { id: 'sampdoria', name: 'Sampdoria', logo: 'S', league: 'B', coach: 'F. Grosso' }
];

export const MOCK_PLAYERS = [
  { id: '1', teamId: 'napoli', name: 'K. Kvaratskhelia', role: 'ATT', status: 'titolare', photo: 'https://placehold.co/100x100/1E293B/10B981?text=KK' },
  { id: '2', teamId: 'inter', name: 'L. Martinez', role: 'ATT', status: 'titolare', photo: 'https://placehold.co/100x100/1E293B/0EA5E9?text=LM' },
  { id: '3', teamId: 'milan', name: 'R. Leao', role: 'ATT', status: 'infortunato', photo: 'https://placehold.co/100x100/1E293B/EF4444?text=RL' },
  { id: '4', teamId: 'juventus', name: 'D. Vlahovic', role: 'ATT', status: 'titolare', photo: 'https://placehold.co/100x100/1E293B/F8FAFC?text=DV' },
];

export const MOCK_MARKET = [
  { id: 'm1', teamId: 'napoli', teamName: 'Napoli', player: 'Zeballos', status: 'trattativa', text: 'Offerta ufficiale presentata al Boca Juniors per Zeballos. Si attende risposta.', time: '10 min fa' },
  { id: 'm2', teamId: 'milan', teamName: 'Milan', player: 'Mario Gila', status: 'ufficiale', text: 'Mario Gila è un nuovo giocatore del Milan. Contratto depositato.', time: '30 min fa' },
  { id: 'm3', teamId: 'juventus', teamName: 'Juventus', player: 'Dibu Martinez', status: 'rumor', text: 'Spalletti spinge per il Dibu, ma le richieste dell\'Aston Villa sono alte.', time: '1 ora fa' }
];

export const MOCK_MATCHES = [
  { id: 'mt1', home: 'Napoli', away: 'Inter', time: 'Sab 20:45', prob: { h: 35, d: 35, a: 30 }, analysis: 'Sfida scudetto. Allegri prepara la gabbia su Lautaro.' },
  { id: 'mt2', home: 'Juventus', away: 'Milan', time: 'Dom 18:00', prob: { h: 45, d: 30, a: 25 }, analysis: 'Amorim cerca il riscatto allo Stadium.' }
];

export const MOCK_FANTA = [
  { id: 'f1', player: 'Kvaratskhelia', baseVote: 7, bonus: 3, malus: 0, final: 10 },
  { id: 'f2', player: 'Martinez', baseVote: 6.5, bonus: 0, malus: 0.5, final: 6 },
  { id: 'f3', player: 'Leao', baseVote: 0, bonus: 0, malus: 0, final: 0 }
];
