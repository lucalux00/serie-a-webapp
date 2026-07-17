import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

// Pesi delle squadre per calcolare la difficoltà del match
const TEAM_STRENGTH: Record<string, number> = {
  'Inter': 95, 'Juventus': 92, 'Milan': 90, 'Napoli': 88, 'Atalanta': 88,
  'Roma': 85, 'Lazio': 84, 'Fiorentina': 82, 'Bologna': 80, 'Torino': 78,
  'Sassuolo': 75, 'Genoa': 75, 'Monza': 74, 'Lecce': 72, 'Udinese': 72,
  'Verona': 70, 'Cagliari': 70, 'Empoli': 68, 'Frosinone': 65, 'Salernitana': 65,
  'Como': 68, 'Venezia': 65, 'Parma': 68
};

function getTeamStrength(teamName: string): number {
  if (!teamName) return 70; // Media
  const key = Object.keys(TEAM_STRENGTH).find(k => teamName.toLowerCase().includes(k.toLowerCase()));
  return key ? TEAM_STRENGTH[key] : 70;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyJwt(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Recupera la rosa dell'utente
    const { rows: roster } = await sql`
      SELECT id, player_name as "playerName", team_name as "teamName", role
      FROM fanta_rosters
      WHERE user_id = ${payload.userId}
    `;

    if (!roster || roster.length === 0) {
      return NextResponse.json({ playerScores: [], recommendedLineup: [], suggestedCuts: [] });
    }

    // 2. Recupera le partite della prossima giornata
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    let upcomingMatches: any[] = [];
    let currentMatchday = 1;
    
    if (API_KEY) {
      const matchRes = await fetch('https://api.football-data.org/v4/competitions/SA/matches?status=SCHEDULED', {
        headers: { 'X-Auth-Token': API_KEY },
        next: { revalidate: 3600 }
      });
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        if (matchData.matches && matchData.matches.length > 0) {
          currentMatchday = matchData.matches[0].matchday;
          upcomingMatches = matchData.matches.filter((m: any) => m.matchday === currentMatchday);
        }
      }
    }

    // 3. Calcola il punteggio (0-100) per ogni giocatore
    const playerScores: any[] = roster.map((player: any) => {
      let baseScore = 70; // Partenza
      
      // Bonus per il ruolo (gli attaccanti di solito portano più bonus)
      if (player.role === 'ATT') baseScore += 5;
      if (player.role === 'CEN') baseScore += 3;
      
      const myTeamStrength = getTeamStrength(player.teamName);
      baseScore += (myTeamStrength - 75) * 0.3; // +6 per l'Inter, -3 per il Venezia
      
      let matchInfo = "Nessuna partita a breve o dati non disponibili.";
      let matchDifficulty = 50;

      // Trova la partita del giocatore
      const match = upcomingMatches.find((m: any) => 
        (m.homeTeam.shortName || m.homeTeam.name)?.toLowerCase().includes(player.teamName?.toLowerCase() || '') ||
        (m.awayTeam.shortName || m.awayTeam.name)?.toLowerCase().includes(player.teamName?.toLowerCase() || '')
      );

      if (match) {
        const isHome = (match.homeTeam.shortName || match.homeTeam.name)?.toLowerCase().includes(player.teamName?.toLowerCase() || '');
        const oppName = isHome ? (match.awayTeam.shortName || match.awayTeam.name) : (match.homeTeam.shortName || match.homeTeam.name);
        const oppStrength = getTeamStrength(oppName);
        
        matchDifficulty = oppStrength;
        
        // Bonus casa/trasferta
        if (isHome) {
          baseScore += 3;
          matchInfo = `Gioca in casa contro ${oppName}`;
        } else {
          baseScore -= 2;
          matchInfo = `Gioca in trasferta contro ${oppName}`;
        }

        // Modificatore basato sulla differenza di forza
        const diff = myTeamStrength - oppStrength;
        baseScore += (diff * 0.4); 

        // Malus specifico per i portieri contro le big
        if (player.role === 'POR' && oppStrength > 85) {
          baseScore -= 10;
        }
      }

      // Limita il punteggio tra 0 e 100
      let finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

      let recommendationLabel = "Schierabile";
      if (finalScore >= 80) recommendationLabel = "Top di Giornata";
      else if (finalScore <= 55) recommendationLabel = "Da Evitare";

      return {
        ...player,
        score: finalScore,
        matchInfo,
        matchDifficulty,
        recommendationLabel
      };
    });

    // Ordina per punteggio decrescente
    playerScores.sort((a, b) => b.score - a.score);

    // 4. Seleziona la miglior formazione (Lineup Optimizer)
    // Moduli validi: 3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-3-2, 5-4-1
    const availablePlayers = [...playerScores];
    const lineup: any[] = [];
    
    const pickBest = (role: string, count: number) => {
      const players = availablePlayers.filter(p => p.role === role);
      const picked = players.slice(0, count);
      picked.forEach(p => lineup.push(p));
      return picked.length === count;
    };

    // Proviamo i moduli in ordine di propensione offensiva
    const formations = [
      { por: 1, dif: 3, cen: 4, att: 3 }, // 3-4-3
      { por: 1, dif: 3, cen: 5, att: 2 }, // 3-5-2
      { por: 1, dif: 4, cen: 3, att: 3 }, // 4-3-3
      { por: 1, dif: 4, cen: 4, att: 2 }, // 4-4-2
      { por: 1, dif: 4, cen: 5, att: 1 }, // 4-5-1
      { por: 1, dif: 5, cen: 3, att: 2 }, // 5-3-2
      { por: 1, dif: 5, cen: 4, att: 1 }, // 5-4-1
    ];

    let bestFormation = formations[0];
    for (const f of formations) {
      const hasPor = availablePlayers.filter(p => p.role === 'POR').length >= f.por;
      const hasDif = availablePlayers.filter(p => p.role === 'DIF').length >= f.dif;
      const hasCen = availablePlayers.filter(p => p.role === 'CEN').length >= f.cen;
      const hasAtt = availablePlayers.filter(p => p.role === 'ATT').length >= f.att;
      
      if (hasPor && hasDif && hasCen && hasAtt) {
        bestFormation = f;
        break; // Trovato il modulo più offensivo possibile con i giocatori a disposizione
      }
    }

    pickBest('POR', bestFormation.por);
    pickBest('DIF', bestFormation.dif);
    pickBest('CEN', bestFormation.cen);
    pickBest('ATT', bestFormation.att);

    // 5. Consigli Mercato (Svincoli)
    const suggestedCuts = playerScores.filter(p => p.score < 55).slice(-3); // Peggiori 3

    return NextResponse.json({ 
      matchday: currentMatchday,
      playerScores,
      recommendedLineup: lineup,
      suggestedCuts,
      bestFormation: `${bestFormation.dif}-${bestFormation.cen}-${bestFormation.att}`
    });
  } catch (error) {
    console.error('Advisor Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
