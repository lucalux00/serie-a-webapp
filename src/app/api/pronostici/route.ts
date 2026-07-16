import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key mancante' }, { status: 500 });
    }

    const response = await fetch('https://api.football-data.org/v4/competitions/SA/matches?status=SCHEDULED', {
      headers: {
        'X-Auth-Token': API_KEY
      },
      next: { revalidate: 3600 } // Cache per un'ora
    });

    if (!response.ok) {
      throw new Error(`Errore API: ${response.status}`);
    }

    const data = await response.json();
    
    // Prendiamo i primi 4 match in programma
    const upcomingMatches = data.matches?.slice(0, 4) || [];

    // Generiamo pronostici "algoritmici" basati sull'id del match per avere coerenza
    const predictions = upcomingMatches.map((m: any) => {
      const matchId = m.id;
      const homeName = m.homeTeam.shortName || m.homeTeam.name;
      const awayName = m.awayTeam.shortName || m.awayTeam.name;
      
      // Pseudo-randomizzazione coerente
      const isHomeFavored = matchId % 2 === 0;
      const isHighScoring = matchId % 3 === 0;
      
      let pick = "";
      let odds = 1.0;

      if (isHomeFavored && isHighScoring) { pick = "1 + Over 2.5"; odds = 2.10; }
      else if (isHomeFavored) { pick = "1"; odds = 1.65; }
      else if (isHighScoring) { pick = "Gol"; odds = 1.75; }
      else { pick = "Under 2.5"; odds = 1.90; }

      // Variazioni minime sulle quote basate sull'id
      odds = odds + ((matchId % 10) / 100);

      return {
        id: m.id,
        match: `${homeName} - ${awayName}`,
        pick,
        odds
      };
    });

    return NextResponse.json({ predictions });

  } catch (error) {
    console.error("GET /api/pronostici error:", error);
    return NextResponse.json({ error: 'Errore nel recupero pronostici' }, { status: 500 });
  }
}
