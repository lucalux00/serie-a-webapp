import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function searchDDG(query: string) {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const snippets: string[] = [];
    $('.result__snippet').each((i: any, el: any) => {
      snippets.push($(el).text().trim());
    });
    return snippets;
  } catch (err) {
    return [];
  }
}

function parseStatsTable($: any, table: any) {
  const stats = {
    carriera: { presenze: "0", reti: "0" },
    squadraAttuale: { presenze: "0", reti: "0" },
    nazionale: { presenze: "0", reti: "0" }
  };

  let mode = 'none'; // 'giovanili', 'club', 'nazionale'
  let isCurrentTeam = false;

  table.find('tr').each((i: any, tr: any) => {
    const rowText = $(tr).text().toLowerCase();
    
    if (rowText.includes('giovanili')) mode = 'giovanili';
    else if (rowText.includes('squadre di club')) mode = 'club';
    else if (rowText.includes('nazionale')) mode = 'nazionale';

    // Rileva righe con presenze (contengono parentesi o numeri)
    const tds = $(tr).find('td');
    if (tds.length >= 2) {
      const yearOrTeam = $(tds[0]).text().trim();
      const appsGoals = $(tds[tds.length - 1]).text().trim(); // Ultima colonna di solito è presenze (reti)

      const match = appsGoals.match(/(\d+)\s*\(([-]?\d+)\)/); // Esempio: 154 (20)
      if (match) {
        const pres = parseInt(match[1]);
        const reti = parseInt(match[2].replace('-', '0')); // se portiere ha i meno

        if (mode === 'club') {
          // Aggiungiamo alla carriera totale
          stats.carriera.presenze = (parseInt(stats.carriera.presenze) + pres).toString();
          stats.carriera.reti = (parseInt(stats.carriera.reti) + reti).toString();
          
          // Ultima squadra club della lista (assumiamo che l'ultima sia quella attuale se ha anni recenti o "20xx-")
          // Lo sovrascriviamo ad ogni iterazione, l'ultima iterazione rimarrà la "Squadra Attuale"
          stats.squadraAttuale.presenze = pres.toString();
          stats.squadraAttuale.reti = reti.toString();
        } else if (mode === 'nazionale') {
          stats.nazionale.presenze = (parseInt(stats.nazionale.presenze) + pres).toString();
          stats.nazionale.reti = (parseInt(stats.nazionale.reti) + reti).toString();
        }
      }
    }
  });

  return stats;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const searchUrl = `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`;
    const res = await fetch(searchUrl);
    const html = await res.text();
    const $ = cheerio.load(html);

    let biografia = "";
    let caratteristiche = "";
    let instagram = "";
    let marketValue = "Valore Non Disponibile";
    let salary = "Stipendio Non Pubblico";
    let dataNascita = "Sconosciuta";
    let luogoNascita = "Sconosciuto";

    const infobox = $('.sinottico');
    let advancedStats = {
      carriera: { presenze: "ND", reti: "ND" },
      squadraAttuale: { presenze: "ND", reti: "ND" },
      nazionale: { presenze: "ND", reti: "ND" }
    };

    if (infobox.length > 0) {
      advancedStats = parseStatsTable($, infobox);
      
      // Estrai dati anagrafici dal sinottico
      infobox.find('tr').each((i: any, tr: any) => {
        const thText = $(tr).find('th').text().toLowerCase();
        const tdText = $(tr).find('td').text().trim();
        
        if (thText.includes('data di nascita')) {
          dataNascita = tdText.split('(')[0].trim();
        } else if (thText.includes('luogo di nascita')) {
          luogoNascita = tdText.replace(/\[\d+\]/, '').trim();
        }
      });
    }

    const firstP = $('#mw-content-text .mw-parser-output > p').not('.mw-empty-elt').first().text().trim();
    if (firstP && firstP.length > 50) {
      biografia = firstP;
    }

    $('h2').each((i: any, el: any) => {
      const heading = $(el).text().toLowerCase();
      if (heading.includes('biografia')) {
        let p = $(el).nextUntil('h2', 'p').text().trim().substring(0, 400);
        if (p) biografia = p + '...';
      }
      if (heading.includes('caratteristiche')) {
        let p = $(el).nextUntil('h2', 'p').text().trim().substring(0, 400);
        if (p) caratteristiche = p + '...';
      }
    });

    $('a').each((i: any, el: any) => {
      const href = $(el).attr('href');
      if (href && href.includes('instagram.com')) {
        instagram = href;
      }
    });

    // Migliorate Regex e Fallbacks per evitare N/A
    const marketSnippets = await searchDDG(`site:transfermarkt.it "${name}" "valore di mercato"`);
    if (marketSnippets.length > 0) {
      const text = marketSnippets.join(' ');
      // Cerca pattern come "40,00 mln €", "800 mila €", "€50m"
      const match = text.match(/([\d,.]+\s*(?:mln|m|mila|milioni)?\s*(?:€|euro))/i);
      if (match) marketValue = match[1].trim();
    }

    const salarySnippets = await searchDDG(`"${name}" stipendio netto calciatore euro serie a`);
    if (salarySnippets.length > 0) {
      const text = salarySnippets.join(' ');
      const match = text.match(/([\d,.]+\s*(?:mln|m|mila|milioni)?\s*(?:di\s*)?(?:€|euro))/i);
      if (match) salary = match[1].trim();
    }

    return NextResponse.json({
      name,
      biografia: biografia || 'Nessuna biografia trovata.',
      caratteristiche: caratteristiche || 'Nessuna caratteristica tecnica specificata.',
      stats: advancedStats,
      anagrafica: {
        dataNascita,
        luogoNascita
      },
      instagram: instagram || null,
      marketValue,
      salary
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player data' }, { status: 500 });
  }
}
