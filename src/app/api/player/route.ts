import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function searchDDG(query: string): Promise<string[]> {
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
  } catch {
    return [];
  }
}

// Parser corretto per la tabella statistiche di Wikipedia
// La struttura è: Squadra | Anni | Presenze | (Reti)
// Le reti tra parentesi per i portieri sono GETTONI (goal subiti), non gol segnati
// Distinguiamo portieri (POR) da altri ruoli
function parseWikipediaStats($: any, infobox: any, role: string) {
  const stats = {
    carriera:        { presenze: 0, gol: 0 },
    squadraAttuale:  { presenze: 0, gol: 0, nome: '' },
    nazionale:       { presenze: 0, gol: 0 }
  };

  const isGoalkeeper = role?.toUpperCase().includes('POR') || 
                        role?.toLowerCase().includes('portiere') ||
                        role?.toLowerCase().includes('goalkeeper');

  let section: 'giovanili' | 'club' | 'nazionale' | 'none' = 'none';
  let lastClubPresenze = 0;
  let lastClubGol = 0;
  let lastClubNome = '';

  infobox.find('tr').each((i: any, tr: any) => {
    const rowText = $(tr).text().replace(/\s+/g, ' ').trim().toLowerCase();

    // Rileva intestazione sezione
    if (rowText.includes('giovanili') || rowText.includes('settore giovanile')) {
      section = 'giovanili';
      return;
    }
    if (rowText.includes('squadre di club') || rowText.includes('club career')) {
      section = 'club';
      return;
    }
    if (rowText.includes('nazionale') || rowText.includes('national team')) {
      section = 'nazionale';
      return;
    }

    // Salta righe intestazione
    if ($(tr).find('th').length > 1) return;

    const tds = $(tr).find('td');
    if (tds.length < 2) return;

    // Cerca celle con formato "NNN (MMM)" o solo numeri
    // La penultima o ultima colonna tipicamente ha presenze (gol)
    const allCells = tds.toArray().map((td: any) => $(td).text().trim());
    
    // Cerca il pattern presenze (gol) - es "154 (20)"
    let presenzeVal = 0;
    let golVal = 0;
    let foundStats = false;
    
    for (let c = allCells.length - 1; c >= 0; c--) {
      const cellText = allCells[c];
      // Match "NNN (MMM)" con possibili spazi e segni
      const match = cellText.match(/^(\d+)\s*\(([+-]?\d+)\)$/);
      if (match) {
        presenzeVal = parseInt(match[1]);
        golVal = parseInt(match[2]);
        foundStats = true;
        break;
      }
      // Match solo numeri
      if (/^\d+$/.test(cellText) && parseInt(cellText) < 1000) {
        presenzeVal = parseInt(cellText);
        foundStats = true;
        break;
      }
    }

    if (!foundStats) return;

    // Recupera nome squadra (prima cella non numerica)
    let squadraNome = '';
    for (const cell of allCells) {
      if (!/^\d/.test(cell) && !cell.match(/^\(/) && cell.length > 1) {
        squadraNome = cell.replace(/\[\d+\]/g, '').trim();
        break;
      }
    }

    if (section === 'club') {
      stats.carriera.presenze += presenzeVal;
      // Per portieri i "gol" nella parentesi sono gol subiti - non li mostriamo come gol
      if (!isGoalkeeper) {
        stats.carriera.gol += golVal;
      }
      lastClubPresenze = presenzeVal;
      lastClubGol = isGoalkeeper ? 0 : golVal;
      lastClubNome = squadraNome;
    } else if (section === 'nazionale') {
      stats.nazionale.presenze += presenzeVal;
      if (!isGoalkeeper) {
        stats.nazionale.gol += golVal;
      }
    }
  });

  stats.squadraAttuale.presenze = lastClubPresenze;
  stats.squadraAttuale.gol = lastClubGol;
  stats.squadraAttuale.nome = lastClubNome;

  return stats;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const role = searchParams.get('role') || '';

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const searchUrl = `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(name + ' calciatore')}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SerieAPortal/1.0)',
        'Accept-Language': 'it-IT,it;q=0.9'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    let biografia = '';
    let caratteristiche = '';
    let instagram = '';
    let marketValue = 'Dato non disponibile';
    let salary = 'Dato non pubblicato';
    let dataNascita = 'Non disponibile';
    let luogoNascita = 'Non disponibile';
    let nazionalita = 'Non disponibile';

    const infobox = $('.sinottico, .infobox, .wikitable.sinottico');
    let parsedStats = {
      carriera:       { presenze: 0, gol: 0 },
      squadraAttuale: { presenze: 0, gol: 0, nome: '' },
      nazionale:      { presenze: 0, gol: 0 }
    };

    if (infobox.length > 0) {
      parsedStats = parseWikipediaStats($, infobox.first(), role);

      // Dati anagrafici
      infobox.find('tr').each((i: any, tr: any) => {
        const thText = $(tr).find('th').text().toLowerCase();
        const tdRaw  = $(tr).find('td').first();
        const tdText = tdRaw.text().replace(/\[\d+\]/g, '').trim();

        if (thText.includes('data di nascita') || thText.includes('nato il')) {
          dataNascita = tdText.split('(')[0].trim();
        } else if (thText.includes('luogo di nascita') || thText.includes('nato a')) {
          luogoNascita = tdText.split('\n')[0].trim();
        } else if (thText.includes('nazionalità') || thText.includes('national')) {
          nazionalita = tdText.split('\n')[0].trim();
        }
      });
    }

    // Biografia - primo paragrafo significativo
    const firstP = $('#mw-content-text .mw-parser-output > p').not('.mw-empty-elt').filter((i: any, el: any) => {
      return $(el).text().trim().length > 80;
    }).first().text().trim();
    if (firstP) biografia = firstP;

    // Caratteristiche tecniche
    $('h2, h3').each((i: any, el: any) => {
      const heading = $(el).text().toLowerCase();
      if (heading.includes('caratteristiche')) {
        const p = $(el).nextUntil('h2,h3', 'p').text().trim().substring(0, 600);
        if (p) caratteristiche = p + '...';
      }
    });

    // Instagram (nei link esterni wiki)
    $('a[href*="instagram.com"]').each((i: any, el: any) => {
      const href = $(el).attr('href');
      if (href && !instagram) instagram = href;
    });

    // Valore di mercato tramite DDG
    const [marketSnippets, salarySnippets] = await Promise.all([
      searchDDG(`"${name}" valore mercato transfermarkt 2026`),
      searchDDG(`"${name}" stipendio netto milioni 2026 calcio`)
    ]);

    if (marketSnippets.length > 0) {
      const text = marketSnippets.slice(0, 3).join(' ');
      const match = text.match(/([\d,.]+\s*(?:mln|m|mila|milioni|k)?\s*(?:€|euro))/i);
      if (match) marketValue = match[1].trim();
    }

    if (salarySnippets.length > 0) {
      const text = salarySnippets.slice(0, 3).join(' ');
      const match = text.match(/([\d,.]+\s*(?:mln|m|mila|milioni|k)?\s*(?:di\s*)?(?:€|euro))/i);
      if (match) salary = match[1].trim();
    }

    const isGoalkeeper = role?.toUpperCase().includes('POR') || role?.toLowerCase().includes('portiere');

    return NextResponse.json({
      name,
      biografia: biografia || 'Nessuna biografia trovata su Wikipedia.',
      caratteristiche: caratteristiche || '',
      anagrafica: { dataNascita, luogoNascita, nazionalita },
      stats: {
        isGoalkeeper,
        carriera: {
          presenze: parsedStats.carriera.presenze || 0,
          gol: parsedStats.carriera.gol || 0,
        },
        squadraAttuale: {
          nome: parsedStats.squadraAttuale.nome || '',
          presenze: parsedStats.squadraAttuale.presenze || 0,
          gol: parsedStats.squadraAttuale.gol || 0,
        },
        nazionale: {
          presenze: parsedStats.nazionale.presenze || 0,
          gol: parsedStats.nazionale.gol || 0,
        }
      },
      instagram: instagram || null,
      marketValue,
      salary
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player data' }, { status: 500 });
  }
}
