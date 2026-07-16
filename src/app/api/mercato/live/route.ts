import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'A';
  
  const leagueMap: Record<string, string> = {
    'A': 'https://www.transfermarkt.it/serie-a/letztetransfers/wettbewerb/IT1',
    'B': 'https://www.transfermarkt.it/serie-b/letztetransfers/wettbewerb/IT2',
    'PL': 'https://www.transfermarkt.it/premier-league/letztetransfers/wettbewerb/GB1',
    'LL': 'https://www.transfermarkt.it/laliga/letztetransfers/wettbewerb/ES1'
  };

  const tmUrl = leagueMap[league] || leagueMap['A'];

  try {
    const response = await fetch(tmUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Transfermarkt responded with status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const transfers: any[] = [];
    let idCounter = 1;

    $('.items tbody tr').each((i, el) => {
      const cols = $(el).children('td');
      if (cols.length < 5) return;

      try {
        const playerName = $(cols[0]).find('.hauptlink a').text().trim();
        if (!playerName) return;

        const leftTeam = $(cols[3]).find('.hauptlink a').text().trim() || 'Svincolato';
        const joinedTeam = $(cols[4]).find('.hauptlink a').text().trim() || 'Svincolato';
        const fee = $(cols[7]).text().trim() || '?';
        const dateText = $(cols[5]).text().trim();
        
        let type = 'acquisto';
        let teamToDisplay = joinedTeam;
        let fromToDisplay = `da ${leftTeam}`;

        const feeLower = fee.toLowerCase();
        const isSvincolato = feeLower.includes('gratuito') || feeLower.includes('svincolato') || leftTeam === 'Svincolato' || joinedTeam === 'Svincolato';
        const isPrestito = feeLower.includes('prestito');

        if (isSvincolato) {
          type = 'svincolato';
        } else if (isPrestito) {
          type = 'prestito';
        }

        transfers.push({
          id: idCounter++,
          league: league,
          status: 'ufficiale',
          type: type,
          team: teamToDisplay,
          player: playerName,
          fromTo: fromToDisplay,
          fee: fee,
          date: dateText || 'Oggi'
        });
      } catch (err) {
        // Skip malformed rows
      }
    });

    // Filtriamo i risultati per evitare doppioni di prestiti strani se serve,
    // ma in questa API manteniamo tutto. Il frontend farà il sorting.
    return NextResponse.json({ transfers: transfers.slice(0, 50) });

  } catch (error: any) {
    console.error("Live Mercato Error:", error);
    return NextResponse.json({ error: error.message, transfers: [] }, { status: 500 });
  }
}
