import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId mancante' }, { status: 400 });
    }

    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    
    let nextOpponent = "Sconosciuto";
    let isHome = true;
    let matchFound = false;

    if (API_KEY) {
      // Tenta di recuperare il prossimo match per questa squadra
      // teamId per football-data potrebbe essere un numero, ma qui teamId è la stringa "napoli", ecc.
      // Siccome non abbiamo l'ID di football-data direttamente mappato qui in modo semplice per ogni squadra,
      // usiamo un trucco: scarichiamo tutti i match della Serie A e cerchiamo il team.
      try {
        const response = await fetch('https://api.football-data.org/v4/competitions/SA/matches?status=SCHEDULED', {
          headers: { 'X-Auth-Token': API_KEY },
          next: { revalidate: 3600 }
        });
        if (response.ok) {
          const data = await response.json();
          const matches = data.matches || [];
          
          for (const m of matches) {
            const homeName = (m.homeTeam.shortName || m.homeTeam.name || '').toLowerCase();
            const awayName = (m.awayTeam.shortName || m.awayTeam.name || '').toLowerCase();
            
            if (homeName.includes(teamId.substring(0, 4)) || teamId.includes(homeName.substring(0,4))) {
              nextOpponent = m.awayTeam.shortName || m.awayTeam.name;
              isHome = true;
              matchFound = true;
              break;
            } else if (awayName.includes(teamId.substring(0, 4)) || teamId.includes(awayName.substring(0,4))) {
              nextOpponent = m.homeTeam.shortName || m.homeTeam.name;
              isHome = false;
              matchFound = true;
              break;
            }
          }
        }
      } catch (e) {
        console.error("Errore fetch match per analisi:", e);
      }
    }

    if (!matchFound) {
      nextOpponent = "Attesa Calendario";
    }

    // Costi biglietti simulati (tra 25 e 120 euro)
    const ticketCost = Math.floor(Math.random() * (120 - 25 + 1) + 25);
    // Spettatori (tra 20000 e 70000)
    const attendance = Math.floor(Math.random() * (70000 - 20000 + 1) + 20000);

    // Consigli Tattici basati su chi gioca e se in casa o fuori
    const tactics = [
      `L'AI suggerisce un approccio aggressivo sulle fasce per sfruttare le sovrapposizioni, dato che il ${nextOpponent} soffre le ripartenze veloci.`,
      `Per portare a casa i 3 punti contro il ${nextOpponent}, sarà fondamentale bloccare le vie centrali e mantenere un baricentro basso nel primo tempo.`,
      `Il pressing alto sarà l'arma in più. Il ${nextOpponent} perde facilmente palla in costruzione: recuperare palla nella trequarti avversaria garantirà occasioni nitide.`,
      `Partita da gestire col possesso. Fondamentale il ruolo del regista per dettare i tempi e sfiancare il ${nextOpponent}.`
    ];
    const selectedTactic = tactics[Math.floor(Math.random() * tactics.length)];

    return NextResponse.json({
      matchPreview: {
        nextOpponent,
        isHome,
        ticketCost: `Da ${ticketCost}€`,
        attendance: `${attendance.toLocaleString('it-IT')}`
      },
      tacticalAdvice: selectedTactic
    });

  } catch (error) {
    console.error("GET /api/analisi error:", error);
    return NextResponse.json({ error: 'Errore nel recupero analisi' }, { status: 500 });
  }
}
