import { NextResponse } from 'next/server';

// Next.js ISR: Cache per 3 giorni e mezzo (302400 secondi). Aggiorna le quote ~2 volte a settimana.
export const revalidate = 302400; 

// --- MOTORE TIPSTER: Power Rankings per le squadre (0-100) ---
const powerRankings: Record<string, number> = {
  // Top Europe
  'Real Madrid': 95, 'Man City': 95, 'Bayern': 93, 'Arsenal': 91, 'Liverpool': 90, 'PSG': 89, 'Barcelona': 88,
  // Top Serie A
  'Inter': 92, 'Juventus': 90, 'Napoli': 89, 'Milan': 88, 'Atalanta': 86, 'Roma': 84, 'Lazio': 82, 'Fiorentina': 81,
  // Mid Serie A
  'Torino': 76, 'Bologna': 78, 'Genoa': 74, 'Monza': 73, 'Udinese': 72,
  // Low Serie A
  'Verona': 68, 'Lecce': 67, 'Empoli': 66, 'Cagliari': 68, 'Como': 65, 'Venezia': 64, 'Parma': 69
};

function getPower(teamName: string): number {
  for (const key in powerRankings) {
    if (teamName.includes(key) || key.includes(teamName)) return powerRankings[key];
  }
  return 70; // Squadra media sconosciuta
}

function generatePrediction(homeName: string, awayName: string) {
  const homePower = getPower(homeName) + 4; // Bonus casa
  const awayPower = getPower(awayName);
  const diff = homePower - awayPower;

  let pick = '1';
  let odds = 1.0;

  if (diff > 15) {
    pick = '1'; odds = 1.25 + (Math.random() * 0.2); // 1.25 - 1.45
  } else if (diff > 5) {
    pick = Math.random() > 0.3 ? '1' : '1X + Over 1.5'; odds = 1.50 + (Math.random() * 0.4); // 1.50 - 1.90
  } else if (diff < -15) {
    pick = '2'; odds = 1.30 + (Math.random() * 0.3); // 1.30 - 1.60
  } else if (diff < -5) {
    pick = Math.random() > 0.3 ? '2' : 'X2 + Over 1.5'; odds = 1.60 + (Math.random() * 0.5); // 1.60 - 2.10
  } else {
    // Scontro equilibrato
    const rand = Math.random();
    if (rand < 0.33) { pick = 'Gol'; odds = 1.65 + (Math.random() * 0.3); }
    else if (rand < 0.66) { pick = 'X'; odds = 3.10 + (Math.random() * 0.4); }
    else { pick = 'Over 2.5'; odds = 1.75 + (Math.random() * 0.3); }
  }

  // Se due top team giocano, quota Gol scende
  if (homePower > 85 && awayPower > 85 && pick === 'Gol') odds -= 0.15;

  return { pick, odds: Math.round(odds * 100) / 100 };
}

async function fetchMatches(competition: string): Promise<any[]> {
  const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
  if (!API_KEY) return [];
  
  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${competition}/matches?status=SCHEDULED`, {
      headers: { 'X-Auth-Token': API_KEY },
      next: { revalidate: 86400 } // Fetch reale al giorno
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.matches?.slice(0, 8) || [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // 1. Fetch partite reali
    let saMatches = await fetchMatches('SA');
    let clMatches = await fetchMatches('CL');
    let ecMatches = await fetchMatches('EC');

    // Fallback: se l'API non funziona o siamo in pausa, generiamo i migliori big match reali prossimi
    if (saMatches.length === 0) {
      saMatches = [
        { homeTeam: { name: 'Inter' }, awayTeam: { name: 'Napoli' } },
        { homeTeam: { name: 'Juventus' }, awayTeam: { name: 'Milan' } },
        { homeTeam: { name: 'Roma' }, awayTeam: { name: 'Atalanta' } },
        { homeTeam: { name: 'Lazio' }, awayTeam: { name: 'Fiorentina' } },
        { homeTeam: { name: 'Torino' }, awayTeam: { name: 'Bologna' } }
      ];
    }
    if (clMatches.length === 0) {
      clMatches = [
        { homeTeam: { name: 'Real Madrid' }, awayTeam: { name: 'Man City' } },
        { homeTeam: { name: 'Bayern' }, awayTeam: { name: 'PSG' } },
        { homeTeam: { name: 'Arsenal' }, awayTeam: { name: 'Inter' } }
      ];
    }
    if (ecMatches.length === 0) {
      ecMatches = [
        { homeTeam: { name: 'Roma' }, awayTeam: { name: 'Tottenham' } },
        { homeTeam: { name: 'Lazio' }, awayTeam: { name: 'Porto' } }
      ];
    }

    const formatMatches = (matches: any[]) => matches.map(m => {
      const home = m.homeTeam.shortName || m.homeTeam.name;
      const away = m.awayTeam.shortName || m.awayTeam.name;
      const { pick, odds } = generatePrediction(home, away);
      return { match: `${home} - ${away}`, pick, odds };
    });

    const saPicks = formatMatches(saMatches);
    const clPicks = formatMatches(clMatches);
    const ecPicks = formatMatches(ecMatches);

    // 2. Creazione Singole Sicure (le 4 con quota più bassa tra tutte)
    const allPicks = [...saPicks, ...clPicks, ...ecPicks].sort((a, b) => a.odds - b.odds);
    const singlePredictions = allPicks.slice(0, 4);

    // 3. Creazione Bollette Specifiche richieste
    const bollette = [];

    // Bolletta Serie A
    if (saPicks.length >= 3) {
      const saTotal = saPicks.slice(0, 4).reduce((acc, curr) => acc * curr.odds, 1);
      bollette.push({
        id: 'bolletta_sa',
        title: 'Bolletta Serie A',
        type: 'campionato',
        matches: saPicks.slice(0, 4),
        totalOdds: Math.round(saTotal * 100) / 100
      });
    }

    // Bolletta Champions & Europa
    const euroPicks = [...clPicks, ...ecPicks];
    if (euroPicks.length >= 3) {
      const euroTotal = euroPicks.slice(0, 4).reduce((acc, curr) => acc * curr.odds, 1);
      bollette.push({
        id: 'bolletta_euro',
        title: 'Bolletta Notti Europee (CL & EL)',
        type: 'coppa',
        matches: euroPicks.slice(0, 4),
        totalOdds: Math.round(euroTotal * 100) / 100
      });
    }

    // Raddoppio del Tipster (2 partite sicure)
    if (allPicks.length >= 2) {
      // Troviamo 2 partite che sommate fanno circa 2.0
      const raddoppioMatches = allPicks.filter(p => p.odds > 1.25 && p.odds < 1.55).slice(0, 2);
      if (raddoppioMatches.length === 2) {
        bollette.push({
          id: 'raddoppio',
          title: 'Il Raddoppio del Giorno',
          type: 'raddoppio',
          matches: raddoppioMatches,
          totalOdds: Math.round(raddoppioMatches[0].odds * raddoppioMatches[1].odds * 100) / 100
        });
      }
    }

    // Bollettone Misto Quota Alta
    const highOddsMatches = allPicks.filter(p => p.odds >= 1.6).slice(0, 5);
    if (highOddsMatches.length >= 4) {
      const highTotal = highOddsMatches.reduce((acc, curr) => acc * curr.odds, 1);
      bollette.push({
        id: 'bollettone',
        title: 'Il Bollettone Misto (Alta Quota)',
        type: 'alta',
        matches: highOddsMatches,
        totalOdds: Math.round(highTotal * 100) / 100
      });
    }

    return NextResponse.json({ singlePredictions, bollette });

  } catch (error) {
    console.error("GET /api/pronostici error:", error);
    return NextResponse.json({ error: 'Errore nel recupero pronostici' }, { status: 500 });
  }
}
