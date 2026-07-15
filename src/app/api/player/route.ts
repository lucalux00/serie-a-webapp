import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
};

// Fetch Wikipedia: prima URL diretto, poi ricerca
async function fetchWikipedia(name: string, isCoach: boolean): Promise<{ html: string; url: string } | null> {
  // Costruisce possibili URL diretti Wikipedia
  const slug = name
    .normalize('NFC')
    .replace(/\s+/g, '_')
    .replace(/[àáâäã]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôöõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u');

  const urlsToTry = [
    // URL diretto Wikipedia italiano (il più preciso)
    `https://it.wikipedia.org/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`,
    // Ricerca Wikipedia italiana
    `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(name + (isCoach ? ' allenatore' : ' calciatore'))}&action=opensearch`,
    // URL diretto senza accenti
    `https://it.wikipedia.org/wiki/${slug}`,
    // Wikipedia inglese come fallback
    `https://en.wikipedia.org/wiki/${name.replace(/\s+/g, '_')}`,
  ];

  for (const url of urlsToTry) {
    try {
      // opensearch restituisce JSON, gestiamolo diversamente
      if (url.includes('opensearch')) {
        const res = await fetch(url, { headers: BROWSER_HEADERS });
        if (!res.ok) continue;
        const data = await res.json();
        // data[3] contiene gli URL dei risultati
        if (Array.isArray(data) && data[3] && data[3].length > 0) {
          const wikiUrl = data[3][0];
          const pageRes = await fetch(wikiUrl, { headers: BROWSER_HEADERS });
          if (!pageRes.ok) continue;
          const html = await pageRes.text();
          if (html.includes('mw-content-text')) return { html, url: wikiUrl };
        }
        continue;
      }

      const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' });
      if (!res.ok) continue;
      const html = await res.text();
      
      // Verifica che sia una pagina articolo (non una pagina "disambiguazione" o di ricerca)
      const hasContent = html.includes('mw-content-text') && html.length > 3000;
      const isArticle = !res.url.includes('Special:') && !res.url.includes('index.php?search');
      
      if (hasContent && isArticle) {
        return { html, url: res.url };
      }
    } catch {
      continue;
    }
  }
  return null;
}

// Parser statistiche Wikipedia IT — gestisce la struttura sinottico_annidata
function parseCareerStats($: any, role: string) {
  const stats = {
    carriera: { presenze: 0, gol: 0 },
    squadraAttuale: { presenze: 0, gol: 0, nome: '' },
    nazionale: { presenze: 0, gol: 0 },
    nazionaleNome: '',
    isGoalkeeper: false,
  };

  const isGK =
    role?.toUpperCase().includes('POR') ||
    role?.toLowerCase().includes('portiere') ||
    role?.toLowerCase().includes('goalkeeper') ||
    // Controlla il campo Ruolo nel sinottico per maggiore precisione
    (() => {
      const ruoloText = $('th:contains("Ruolo")').next('td').text().toLowerCase();
      return ruoloText.includes('portiere') || ruoloText.includes('goalkeeper');
    })();
  stats.isGoalkeeper = isGK;

  // Le tabelle annidate delle statistiche su Wikipedia IT hanno la classe "sinottico_annidata"
  // Le righe della sezione Club sono precedute da un <th> con testo "Squadre di club"
  // Le righe della sezione Nazionale sono precedute da un <th> con testo "Nazionale"
  
  // Navighiamo sul sinottico principale per trovare la struttura delle sezioni
  const sinottico = $('.sinottico').first();
  if (!sinottico.length) return stats;

  let inClub = false;
  let inNazionale = false;
  let lastClubNome = '';
  let lastClubPresenze = 0;
  let lastClubGol = 0;

  sinottico.find('tr').each((_: any, tr: any) => {
    const $tr = $(tr);
    const thText = $tr.find('th').text().trim().toLowerCase();

    // Rileva sezione
    if (thText.includes('squadre di club')) { inClub = true; inNazionale = false; return; }
    if (thText.includes('nazionale')) { inNazionale = true; inClub = false; return; }
    if (thText.includes('palmarès') || thText.includes('statistiche')) { inClub = false; inNazionale = false; return; }

    // Nelle righe dei club, la tabella annidata "sinottico_annidata" contiene i dati
    const nestedTable = $tr.find('table.sinottico_annidata');
    if (nestedTable.length > 0) {
      nestedTable.find('tr').each((_2: any, ntr: any) => {
        const $ntr = $(ntr);
        const cells = $ntr.find('td').toArray().map((td: any) => $(td).text().replace(/\[\d+\]/g, '').trim());
        
        if (cells.length < 2) return;

        // Estrai presenze e gol — formato: "Anno", "Squadra", "Presenze", "(Gol)"
        // oppure direttamente: "Squadra", "Presenze (Gol)"
        let presenze = 0;
        let gol = 0;
        let squadra = '';
        let foundStats = false;

        // Cerca il pattern "NNN (MMM)" o "NNN" nelle celle
        for (let ci = cells.length - 1; ci >= 0; ci--) {
          const cell = cells[ci];
          const matchPG = cell.match(/^(\d+)\s*\(([+-]?\d+)\)$/);
          if (matchPG) {
            presenze = parseInt(matchPG[1]);
            gol = parseInt(matchPG[2]);
            foundStats = true;
            break;
          }
          // Solo presenze (senza gol)
          if (/^\d+$/.test(cell) && parseInt(cell) < 1000) {
            presenze = parseInt(cell);
            foundStats = true;
            break;
          }
        }

        if (!foundStats) return;

        // Cerca nome squadra: prima cella non-numerica con testo significativo
        for (const cell of cells) {
          if (cell.length > 1 && !/^\d/.test(cell) && !cell.startsWith('(') && !cell.startsWith('→')) {
            // Rimuovi anno (es. "2019-2022" o "2022-")
            if (!/^\d{4}/.test(cell)) {
              squadra = cell.trim();
              break;
            }
          }
        }

        if (inClub) {
          stats.carriera.presenze += presenze;
          if (!isGK) stats.carriera.gol += gol;
          lastClubPresenze = presenze;
          lastClubGol = isGK ? 0 : gol;
          lastClubNome = squadra;
        } else if (inNazionale) {
          stats.nazionale.presenze += presenze;
          if (!isGK) stats.nazionale.gol += gol;
          if (squadra && !stats.nazionaleNome) stats.nazionaleNome = squadra;
        }
      });
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

  const isCoach =
    role.toLowerCase().includes('allenator') ||
    role.toLowerCase().includes('coach') ||
    role.toLowerCase().includes('direttore') ||
    role.toLowerCase().includes('preparatore') ||
    role.toLowerCase().includes('staff') ||
    role.toLowerCase().includes('ct');

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

      if (!isCoach) {
        parsedStats = parseCareerStats($, role);
      }

      // Dati anagrafici dal sinottico
      const sinottico = $('.sinottico').first();
      sinottico.find('tr').each((_: any, tr: any) => {
        const $tr = $(tr);
        const thText = $tr.find('th').text().toLowerCase().trim();
        const tdText = $tr.find('td').first().text().replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();

        if (!tdText) return;

        if (thText.includes('data di nascita') || thText.includes('nato il') || thText.includes('date of birth')) {
          dataNascita = tdText.split('(')[0].split('\n')[0].trim();
        } else if (thText.includes('luogo di nascita') || thText.includes('nato a') || thText.includes('place of birth')) {
          luogoNascita = tdText.split('\n')[0].trim();
        } else if (thText.includes('nazionalità') || thText.includes('nazionalita') || thText.includes('citizenship')) {
          nazionalita = tdText.split('\n')[0].trim();
        }
      });

      // Biografia: primo paragrafo significativo
      const firstP = $('#mw-content-text .mw-parser-output > p, #mw-content-text .mw-parser-output > div > p')
        .not('.mw-empty-elt')
        .filter((_: any, el: any) => $(el).text().trim().length > 60)
        .first()
        .text()
        .trim();
      if (firstP) biografia = firstP.substring(0, 600);

      // Caratteristiche tecniche
      $('h2, h3').each((_: any, el: any) => {
        const heading = $(el).text().toLowerCase();
        if (heading.includes('caratteristiche') || heading.includes('stile di gioco') || heading.includes('style')) {
          const paragraphs = $(el).nextUntil('h2,h3', 'p').toArray();
          const text = paragraphs.map((p: any) => $(p).text().trim()).join(' ').substring(0, 600);
          if (text.length > 50) caratteristiche = text + '...';
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
