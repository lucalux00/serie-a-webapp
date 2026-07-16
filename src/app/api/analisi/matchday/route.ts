import { NextResponse } from 'next/server';

// Generatore algoritmico di testo per l'analisi
function generateMatchAnalysis(homeTeam: string, awayTeam: string, matchId: number) {
  // Usiamo il matchId per randomizzazione deterministica (così i nomi e le stat rimangono uguali tra i refresh)
  const seed = matchId;
  const isDerby = homeTeam.slice(0, 3) === awayTeam.slice(0, 3);
  
  const referees = ["Orsato", "Guida", "Maresca", "Mariani", "Doveri", "Chiffi", "Pairetto", "Fabbri"];
  const referee = referees[seed % referees.length];
  
  const cardsAvg = 4 + (seed % 4); // Tra 4 e 7 cartellini medi
  
  const formations = ["4-3-3", "3-5-2", "4-2-3-1", "4-4-2", "3-4-2-1"];
  const homeFormation = formations[seed % formations.length];
  const awayFormation = formations[(seed + 1) % formations.length];

  const keyDuels = [
    "Fasce laterali: La spinta offensiva dei terzini sarà la chiave del match.",
    "Centrocampo: Chi vince la battaglia in mediana avrà il controllo del gioco.",
    "Fase di transizione: Entrambe le squadre eccellono nelle ripartenze veloci.",
    "Palle inattive: Molti gol stagionali sono arrivati da corner, massima attenzione."
  ];
  const keyDuel = keyDuels[seed % keyDuels.length];

  return `
### 📊 Panoramica del Match
Questa si preannuncia come una sfida cruciale. Il **${homeTeam}** arriva con la necessità di sfruttare il fattore campo, schierandosi con un collaudato **${homeFormation}**. Dall'altra parte, il **${awayTeam}** risponderà con un **${awayFormation}** per cercare di arginare le sortite offensive e colpire in ripartenza. ${isDerby ? "Trattandosi di un derby, la tensione sarà alle stelle e i valori tattici potrebbero passare in secondo piano rispetto alla carica emotiva." : ""}

### ⚖️ L'Arbitro: ${referee}
La direzione di gara è stata affidata a **${referee}**, un arbitro che statisticamente mantiene un metro di giudizio molto europeo. 
- **Media cartellini:** ${cardsAvg.toFixed(1)} a partita.
- **Tendenza:** Lascia correre molto sui contatti lievi.
*Attenzione ai cartellini per i difensori centrali del ${homeTeam}, spesso in difficoltà negli uno-contro-uno rapidi.*

### ⚔️ Scontri Tattici e Variabili
${keyDuel}
L'algoritmo rileva un calo di rendimento del ${awayTeam} negli ultimi 15 minuti del secondo tempo (74'-90'), un frangente in cui le ammonizioni (soprattutto a centrocampo) costringono ad abbassare l'intensità del pressing. Il rientro di giocatori chiave dalla squalifica darà però linfa vitale nelle rotazioni offensive.

### 🔮 Il Verdetto dell'Algoritmo
Per portare a casa i 3 punti:
1. **Per il ${homeTeam}:** Sfruttare gli inserimenti delle mezzali dietro la linea difensiva.
2. **Per il ${awayTeam}:** Compattare i reparti e forzare l'avversario a giocare esternamente per poi recuperare palla e innescare i contropiedi.

**Stima Gol:** Previsti almeno 2.5 gol totali viste le difese alte e gli Expected Goals (xG) cumulativi superiori a 3.10.
  `.trim();
}

export async function GET() {
  try {
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key mancante' }, { status: 500 });
    }

    // Recuperiamo tutte le partite schedulate per la Serie A
    const response = await fetch('https://api.football-data.org/v4/competitions/SA/matches?status=SCHEDULED', {
      headers: { 'X-Auth-Token': API_KEY },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Errore API: ${response.status}`);
    }

    const data = await response.json();
    const matches = data.matches || [];

    // Troviamo il "matchday" del primo match schedulato
    if (matches.length === 0) {
       return NextResponse.json({ matches: [], matchday: 0 });
    }

    const currentMatchday = matches[0].matchday;
    
    // Filtriamo solo i match della stessa giornata (in genere 10)
    const matchdayMatches = matches.filter((m: any) => m.matchday === currentMatchday).map((m: any) => {
      const homeTeam = m.homeTeam.shortName || m.homeTeam.name;
      const awayTeam = m.awayTeam.shortName || m.awayTeam.name;
      const matchId = m.id;

      // Costi biglietti simulati (tra 25 e 120 euro)
      const ticketCost = Math.floor((matchId % 95) + 25);
      // Spettatori (tra 20000 e 70000)
      const attendance = Math.floor((matchId % 50000) + 20000);

      const markdownAnalysis = generateMatchAnalysis(homeTeam, awayTeam, matchId);

      return {
        id: matchId,
        homeTeam,
        homeCrest: m.homeTeam.crest,
        awayTeam,
        awayCrest: m.awayTeam.crest,
        date: m.utcDate,
        ticketCost: \`Da \${ticketCost}€\`,
        attendance: \`\${attendance.toLocaleString('it-IT')}\`,
        markdownAnalysis
      };
    });

    return NextResponse.json({ 
      matchday: currentMatchday,
      matches: matchdayMatches 
    });

  } catch (error) {
    console.error("GET /api/analisi/matchday error:", error);
    return NextResponse.json({ error: 'Errore nel recupero giornata' }, { status: 500 });
  }
}
