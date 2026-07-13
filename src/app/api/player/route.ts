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
    $('.result__snippet').each((i, el) => {
      snippets.push($(el).text().trim());
    });
    return snippets;
  } catch (err) {
    return [];
  }
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
    let presenze = "N/A";
    let reti = "N/A";
    let instagram = "";
    let marketValue = "N/A";
    let salary = "N/A";

    const infobox = $('.sinottico');
    if (infobox.length > 0) {
      let foundStats = false;
      infobox.find('tr').each((i, tr) => {
        if ($(tr).text().includes('Presenze e reti nei club')) {
          foundStats = true;
        } else if (foundStats) {
          const tdText = $(tr).find('td').last().text().trim();
          if (tdText && /\d+/.test(tdText) && presenze === "N/A") {
            const match = tdText.match(/(\d+)\s*\(([^)]+)\)/);
            if (match) {
              presenze = match[1];
              reti = match[2];
            } else {
              presenze = tdText;
            }
          }
        }
      });
    }

    const firstP = $('#mw-content-text .mw-parser-output > p').not('.mw-empty-elt').first().text().trim();
    if (firstP && firstP.length > 50) {
      biografia = firstP;
    }

    $('h2').each((i, el) => {
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

    // Cerca Link Instagram nei collegamenti esterni di Wiki
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('instagram.com')) {
        instagram = href;
      }
    });

    // Intelligence DDG per Mercato e Stipendio
    const marketSnippets = await searchDDG(`site:transfermarkt.it "${name}" "valore di mercato"`);
    if (marketSnippets.length > 0) {
      const match = marketSnippets[0].match(/valore di mercato[:\s]*([\d,.]+\s*(?:mln|mila)?\s*€)/i);
      if (match) marketValue = match[1].trim();
      else marketValue = "Stima Riservata";
    }

    const salarySnippets = await searchDDG(`"${name}" stipendio netto euro`);
    if (salarySnippets.length > 0) {
      const match = salarySnippets[0].match(/([\d,.]+\s*(?:milioni|mila)?\s*di\s*euro)/i);
      if (match) salary = match[1].trim();
      else salary = "Dato Non Pubblico";
    }

    return NextResponse.json({
      name,
      biografia: biografia || 'Nessuna biografia trovata.',
      caratteristiche: caratteristiche || 'Nessuna caratteristica tecnica specificata.',
      stats: {
        presenze: presenze !== "N/A" ? presenze : "ND",
        reti: reti !== "N/A" ? reti : "ND"
      },
      instagram: instagram || null,
      marketValue,
      salary
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player data' }, { status: 500 });
  }
}
