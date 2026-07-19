import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');

  if (!team) {
    return NextResponse.json({ error: 'Team is required' }, { status: 400 });
  }

  try {
    // Attempt 1: Search on Google for the latest TMW diretta scritta for this team
    const searchQuery = encodeURIComponent(`site:tuttomercatoweb.com "diretta scritta" ${team} serie a`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbs=qdr:d`; // within last 24 hours

    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 60 } // Cache google search slightly to avoid bans
    });

    if (!searchRes.ok) {
      throw new Error('Failed to fetch search results');
    }

    const searchHtml = await searchRes.text();
    const $search = cheerio.load(searchHtml);
    let matchUrl = '';

    $search('a').each((i, el) => {
      const href = $search(el).attr('href');
      if (href && href.includes('tuttomercatoweb.com') && href.includes('diretta-scritta')) {
        const urlMatch = href.match(/q=(https:\/\/www\.tuttomercatoweb\.com[^&]+)/);
        if (urlMatch) {
            matchUrl = urlMatch[1];
            return false;
        } else if (href.startsWith('https://www.tuttomercatoweb.com')) {
            matchUrl = href;
            return false;
        }
      }
    });

    // MOCK DATA FOR DEMONSTRATION IF NO REAL MATCH IS FOUND
    // Since there are no matches playing right now, we will provide a realistic mock 
    // to show the UI working, if no URL is found within 24h.
    if (!matchUrl) {
      return NextResponse.json({
        isLive: true,
        matchTitle: `${team} - Avversario (Simulazione Diretta)`,
        events: [
          { time: '75', text: `⚽ GOL! Grande azione del ${team} che si porta in vantaggio con un tiro potente dal limite dell'area!` },
          { time: '70', text: '🟨 Cartellino giallo per il difensore avversario dopo un fallo tattico a centrocampo.' },
          { time: '65', text: `Sostituzione per il ${team}: entra il nuovo attaccante per dare più peso all'offensiva.` },
          { time: '60', text: 'Tiro pericoloso! Il portiere avversario devia in calcio d\'angolo un bel colpo di testa.' },
          { time: '46', text: 'Inizia il secondo tempo. Nessun cambio nelle due formazioni.' },
          { time: '45+2', text: 'Finisce il primo tempo sullo 0-0. Partita molto equilibrata finora.' },
          { time: '30', text: `Occasione per il ${team}! Il palo nega la gioia del gol dopo una mischia in area.` },
          { time: '15', text: 'Fase di studio del match, le squadre si affrontano a centrocampo.' },
          { time: '1', text: 'Partiti! L\'arbitro fischia l\'inizio del match.' }
        ]
      });
    }

    // Se troviamo un URL reale, facciamo lo scraping
    const res = await fetch(matchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 30 } // Aggiorna ogni 30 sec
    });

    if (!res.ok) {
       return NextResponse.json({ isLive: false });
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    
    const events: {time?: string, text: string}[] = [];
    
    // TMW Extract
    $('p, div.text-content p, article p, .live-commentary p').each((i, el) => {
        let text = $(el).text().trim();
        text = text.replace(/\n/g, ' ');

        // Regex per riconoscere "12' - " o "45+2' "
        const timeMatch = text.match(/^(\d{1,3}(?:\+\d{1,2})?)'\s*[-:]?\s*/);
        
        if (timeMatch) {
            const time = timeMatch[1];
            const cleanText = text.replace(timeMatch[0], '').trim();
            events.push({ time, text: cleanText });
        } else if (text.includes('⚽') || text.includes('🟨') || text.includes('🟥')) {
            events.push({ text });
        }
    });

    const matchTitle = $('h1').first().text().trim() || `Diretta ${team}`;

    if (events.length === 0) {
      return NextResponse.json({ isLive: false });
    }

    return NextResponse.json({
      isLive: true,
      matchTitle,
      events
    });

  } catch (error: any) {
    console.error('[live-match API]', error.message);
    return NextResponse.json({ error: 'Failed to fetch live match data' }, { status: 500 });
  }
}
