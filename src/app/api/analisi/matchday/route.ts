import { NextResponse } from 'next/server';

// Generatore algoritmico di testo per l'analisi preliminare
function generateMatchAnalysis(homeTeam: string, awayTeam: string, matchId: number) {
  const isDerby = homeTeam.slice(0, 3) === awayTeam.slice(0, 3);
  
  return `
### 📊 Panoramica del Match
Questa si preannuncia come una sfida cruciale per entrambe le formazioni. Il **${homeTeam}** cercherà di sfruttare il calore del proprio pubblico per imporre il gioco, mentre il **${awayTeam}** proverà ad arginare le offensive avversarie e ripartire. ${isDerby ? "Trattandosi di un derby, la tensione agonistica e l'aspetto mentale saranno determinanti." : "I punti in palio pesano notevolmente per i rispettivi obiettivi stagionali."}

### ⏱️ Analisi in Arrivo
> [!NOTE]
> Torna a trovarci a ridosso dell'incontro! Aggiorneremo l'analisi dettagliata di questo match **3 giorni prima della partita** con:

- **Formazioni Ufficiali/Probabili**
- **Arbitro Designato e Statistiche Cartellini**
- **Indisponibili, Diffidati e Squalificati**
- **Costo Biglietti e Presenze allo Stadio**

*Torna a visitare questa pagina a ridosso dell'incontro per leggere l'analisi tattica completa incrociata con i dati ufficiali di gara.*
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

      const markdownAnalysis = generateMatchAnalysis(homeTeam, awayTeam, matchId);

      return {
        id: matchId,
        homeTeam,
        homeCrest: m.homeTeam.crest,
        awayTeam,
        awayCrest: m.awayTeam.crest,
        date: m.utcDate,
        ticketCost: "Aggiornamento a -3gg",
        attendance: "In attesa",
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
