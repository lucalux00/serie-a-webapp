import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Headers che simulano un browser reale
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
};

// Tenta fetch Wikipedia prima in italiano, poi in inglese come fallback
async function fetchWikipedia(name: string, isCoach: boolean): Promise<{ html: string; url: string } | null> {
  const suffix = isCoach ? 'allenatore calcio' : 'calciatore';
  
  const urlsToTry = [
    `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(name + ' ' + suffix)}`,
    `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`,
    `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name + ' footballer')}`,
  ];

  for (const searchUrl of urlsToTry) {
    try {
      const res = await fetch(searchUrl, { headers: BROWSER_HEADERS });
      if (!res.ok) continue;
      const html = await res.text();
      // Verifica che sia effettivamente una pagina articolo e non una pagina di ricerca vuota
      if (html.includes('mw-content-text') && html.includes('sinottico')) {
        return { html, url: res.url };
      }
      // Se è una redirect (la ricerca ha trovato un unico risultato diretto), lo usiamo comunque
      if (html.includes('mw-content-text') && html.length > 5000) {
        return { html, url: res.url };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function parseCareerStats($: any, infobox: any, role: string) {
  const stats = {
    carriera: { presenze: 0, gol: 0 },
    squadraAttuale: { presenze: 0, gol: 0, nome: '' },
    nazionale: { presenze: 0, gol: 0 },
    nazionaleNome: '',
  };

  const isGoalkeeper =
    role?.toUpperCase().includes('POR') ||
    role?.toLowerCase().includes('portiere') ||
    role?.toLowerCase().includes('goalkeeper');

  let section: 'giovanili' | 'club' | 'nazionale' | 'none' = 'none';
  let lastClubPresenze = 0;
  let lastClubGol = 0;
  let lastClubNome = '';

  infobox.find('tr').each((i: any, tr: any) => {
    const rowText = $(tr).text().replace(/\s+/g, ' ').trim().toLowerCase();

    if (rowText.includes('giovanili') || rowText.includes('settore giovanile')) {
      section = 'giovanili';
      return;
    }
    if (rowText.includes('squadre di club') || rowText.includes('club career') || rowText.includes('carriera da club')) {
      section = 'club';
      return;
    }
    if (rowText.includes('nazionale') || rowText.includes('national team') || rowText.includes('carriera da ct')) {
      section = 'nazionale';
      return;
    }

    if ($(tr).find('th').length > 1) return;

    const tds = $(tr).find('td');
    if (tds.length < 2) return;

    const allCells = tds.toArray().map((td: any) => $(td).text().replace(/\[\d+\]/g, '').trim());

    let presenzeVal = 0;
    let golVal = 0;
    let foundStats = false;

    for (let c = allCells.length - 1; c >= 0; c--) {
      const cellText = allCells[c];
      const match = cellText.match(/^(\d+)\s*\(([+-]?\d+)\)$/);
      if (match) {
        presenzeVal = parseInt(match[1]);
        golVal = parseInt(match[2]);
        foundStats = true;
        break;
      }
      if (/^\d+$/.test(cellText) && parseInt(cellText) < 2000) {
        presenzeVal = parseInt(cellText);
        foundStats = true;
        break;
      }
    }

    if (!foundStats) return;

    let squadraNome = '';
    for (const cell of allCells) {
      if (!/^\d/.test(cell) && !cell.match(/^\(/) && cell.length > 1 && !cell.includes('(')) {
        squadraNome = cell.replace(/\[\d+\]/g, '').trim();
        break;
      }
    }

    if (section === 'club') {
      stats.carriera.presenze += presenzeVal;
      if (!isGoalkeeper) stats.carriera.gol += golVal;
      lastClubPresenze = presenzeVal;
      lastClubGol = isGoalkeeper ? 0 : golVal;
      lastClubNome = squadraNome;
    } else if (section === 'nazionale') {
      stats.nazionale.presenze += presenzeVal;
      if (!isGoalkeeper) stats.nazionale.gol += golVal;
      if (squadraNome && !stats.nazionaleNome) stats.nazionaleNome = squadraNome;
    }
  });

  stats.squadraAttuale.presenze = lastClubPresenze;
  stats.squadraAttuale.gol = lastClubGol;
  stats.squadraAttuale.nome = lastClubNome;

  return { ...stats, isGoalkeeper };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const role = searchParams.get('role') || '';

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Determina se è un allenatore / staff
  const isCoach =
    role.toLowerCase().includes('allenator') ||
    role.toLowerCase().includes('coach') ||
    role.toLowerCase().includes('direttore') ||
    role.toLowerCase().includes('preparatore') ||
    role.toLowerCase().includes('staff');

  try {
    const wikiResult = await fetchWikipedia(name, isCoach);
    
    let biografia = '';
    let caratteristiche = '';
    let dataNascita = '';
    let luogoNascita = '';
    let nazionalita = '';
    let parsedStats: any = {
      carriera: { presenze: 0, gol: 0 },
      squadraAttuale: { presenze: 0, gol: 0, nome: '' },
      nazionale: { presenze: 0, gol: 0 },
      nazionaleNome: '',
      isGoalkeeper: false,
    };

    if (wikiResult) {
      const { html } = wikiResult;
      const $ = cheerio.load(html);

      const infobox = $('.sinottico, .infobox, .wikitable.sinottico').first();
      
      if (infobox.length > 0) {
        if (!isCoach) {
          parsedStats = parseCareerStats($, infobox, role);
        }

        // Dati anagrafici
        infobox.find('tr').each((i: any, tr: any) => {
          const thText = $(tr).find('th').text().toLowerCase();
          const tdText = $(tr).find('td').first().text().replace(/\[\d+\]/g, '').trim();

          if (thText.includes('data di nascita') || thText.includes('nato il') || thText.includes('date of birth')) {
            dataNascita = tdText.split('(')[0].split('\n')[0].trim();
          } else if (thText.includes('luogo di nascita') || thText.includes('nato a') || thText.includes('place of birth')) {
            luogoNascita = tdText.split('\n')[0].trim();
          } else if (thText.includes('nazionalità') || thText.includes('national') || thText.includes('citizenship')) {
            nazionalita = tdText.split('\n')[0].trim();
          }
        });
      }

      // Biografia: primo paragrafo significativo
      const firstP = $('#mw-content-text .mw-parser-output > p')
        .not('.mw-empty-elt')
        .filter((i: any, el: any) => $(el).text().trim().length > 80)
        .first()
        .text()
        .trim();
      if (firstP) biografia = firstP;

      // Caratteristiche tecniche
      $('h2, h3').each((i: any, el: any) => {
        const heading = $(el).text().toLowerCase();
        if (heading.includes('caratteristiche') || heading.includes('stile di gioco')) {
          const p = $(el).nextUntil('h2,h3', 'p').text().trim().substring(0, 700);
          if (p) caratteristiche = p + '...';
        }
      });
    }

    return NextResponse.json({
      name,
      isCoach,
      biografia: biografia || '',
      caratteristiche: caratteristiche || '',
      anagrafica: {
        dataNascita: dataNascita || null,
        luogoNascita: luogoNascita || null,
        nazionalita: nazionalita || null,
      },
      stats: parsedStats,
    });
  } catch (error) {
    console.error('Player API error:', error);
    return NextResponse.json({ error: 'Failed to fetch player data' }, { status: 500 });
  }
}
