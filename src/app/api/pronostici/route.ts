import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Fetch from football-data.org (Serie A)
    let upcomingMatches: any[] = [];
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    
    if (API_KEY) {
      const response = await fetch('https://api.football-data.org/v4/competitions/SA/matches?status=SCHEDULED', {
        headers: { 'X-Auth-Token': API_KEY },
        next: { revalidate: 3600 }
      });
      if (response.ok) {
        const data = await response.json();
        upcomingMatches = data.matches || [];
      }
    }

    // 2. Se non ci sono partite (es. precampionato), usiamo delle amichevoli estive reali
    if (upcomingMatches.length === 0) {
      upcomingMatches = [
        { id: 101, homeTeam: { name: 'Inter' }, awayTeam: { name: 'Las Palmas' } },
        { id: 102, homeTeam: { name: 'Juventus' }, awayTeam: { name: 'Norimberga' } },
        { id: 103, homeTeam: { name: 'Milan' }, awayTeam: { name: 'Real Madrid' } },
        { id: 104, homeTeam: { name: 'Napoli' }, awayTeam: { name: 'Brest' } },
        { id: 105, homeTeam: { name: 'Roma' }, awayTeam: { name: 'Olympiacos' } },
        { id: 106, homeTeam: { name: 'Lazio' }, awayTeam: { name: 'Rostock' } },
        { id: 107, homeTeam: { name: 'Atalanta' }, awayTeam: { name: 'AZ Alkmaar' } },
        { id: 108, homeTeam: { name: 'Fiorentina' }, awayTeam: { name: 'Bolton' } },
      ];
    }

    // 3. Generiamo i 4 pronostici singoli "Più Sicuri"
    const singleMatches = upcomingMatches.slice(0, 4);
    const singlePredictions = singleMatches.map((m: any, index: number) => {
      const homeName = m.homeTeam.shortName || m.homeTeam.name;
      const awayName = m.awayTeam.shortName || m.awayTeam.name;
      // Quote simulative realistiche
      const picks = [
        { pick: '1', odds: 1.65 },
        { pick: 'Over 2.5', odds: 1.80 },
        { pick: 'Gol', odds: 1.75 },
        { pick: '1X + Under 3.5', odds: 1.55 }
      ];
      return {
        id: m.id,
        match: `${homeName} - ${awayName}`,
        pick: picks[index % 4].pick,
        odds: picks[index % 4].odds
      };
    });

    // 4. Generiamo le 4 Bollette richieste
    const allMatchNames = upcomingMatches.map(m => `${m.homeTeam.shortName || m.homeTeam.name} - ${m.awayTeam.shortName || m.awayTeam.name}`);
    
    // Raddoppio 1 (Quota ~2.0, 2 partite)
    const raddoppio1 = {
      id: 'rad1',
      title: 'Raddoppio del Giorno',
      type: 'raddoppio',
      matches: [
        { match: allMatchNames[0] || 'Match 1', pick: '1', odds: 1.45 },
        { match: allMatchNames[1] || 'Match 2', pick: 'Over 1.5', odds: 1.38 }
      ],
      totalOdds: 2.00
    };

    // Raddoppio 2 (Quota ~2.0, 2 partite)
    const raddoppio2 = {
      id: 'rad2',
      title: 'Raddoppio Alternativo',
      type: 'raddoppio',
      matches: [
        { match: allMatchNames[2] || 'Match 3', pick: 'Gol', odds: 1.65 },
        { match: allMatchNames[3] || 'Match 4', pick: '1X', odds: 1.25 }
      ],
      totalOdds: 2.06
    };

    // Quota 60-70 (5-6 partite)
    const quotaAlta = {
      id: 'alta1',
      title: 'Bollettone Quota Alta',
      type: 'alta',
      matches: [
        { match: allMatchNames[0] || 'M1', pick: '1 + Over 2.5', odds: 2.30 },
        { match: allMatchNames[1] || 'M2', pick: '2', odds: 3.10 },
        { match: allMatchNames[2] || 'M3', pick: 'X', odds: 3.40 },
        { match: allMatchNames[4] || 'M5', pick: 'Gol + Over 2.5', odds: 2.10 },
        { match: allMatchNames[5] || 'M6', pick: '1 Handicap', odds: 2.80 }
      ],
      totalOdds: 142.50 // Esempio alto
    };

    // La Macchia (2-3 risultati esatti)
    const macchia = {
      id: 'macchia1',
      title: 'La Macchia (Risultati Esatti)',
      type: 'macchia',
      matches: [
        { match: allMatchNames[3] || 'M4', pick: 'Risultato Esatto 2-1', odds: 8.50 },
        { match: allMatchNames[6] || 'M7', pick: 'Risultato Esatto 1-1', odds: 6.50 },
        { match: allMatchNames[7] || 'M8', pick: 'Risultato Esatto 3-0', odds: 12.00 }
      ],
      totalOdds: 663.00
    };

    const bollette = [raddoppio1, raddoppio2, quotaAlta, macchia];

    return NextResponse.json({ singlePredictions, bollette });

  } catch (error) {
    console.error("GET /api/pronostici error:", error);
    return NextResponse.json({ error: 'Errore nel recupero pronostici' }, { status: 500 });
  }
}
