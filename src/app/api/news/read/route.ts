import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Risolve il redirect di Google News verso il sito originale
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    const res = await fetch(googleUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      }
    });
    return res.url !== googleUrl ? res.url : googleUrl;
  } catch {
    return googleUrl;
  }
}

// Scraping del sito reale con heuristica multi-selettore
async function scrapeArticle(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
    }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  $('script, style, nav, header, footer, aside, iframe, .ads, .ad, .banner, .cookie, .popup, .newsletter, .related, .comments, [class*="promo"], [class*="paywall"], [class*="subscribe"]').remove();

  const selectors = [
    '[itemprop="articleBody"]',
    '.article-body', '.article__body', '.article-content', '.article__content',
    '.entry-content', '.post-content', '.story-body', '.content-body',
    '#article-body', '.news-content', '.field--name-body',
    'article', 'main',
  ];

  let bestText = '';
  for (const sel of selectors) {
    const node = $(sel);
    if (!node.length) continue;
    const paragraphs: string[] = [];
    node.find('p').each((i: any, el: any) => {
      const text = $(el).text().trim();
      if (text.length > 40 && !/^(Leggi anche|Abbonati|Cookie|©|Seguici|Pubblicità)/i.test(text)) {
        paragraphs.push(text);
      }
    });
    const joined = paragraphs.join('\n\n');
    if (joined.length > bestText.length) bestText = joined;
    if (bestText.length > 600) break;
  }

  // Ultimo fallback: tutti i <p> della pagina
  if (bestText.length < 150) {
    const paragraphs: string[] = [];
    $('p').each((i: any, el: any) => {
      const text = $(el).text().trim();
      if (text.length > 60) paragraphs.push(text);
    });
    bestText = paragraphs.slice(0, 20).join('\n\n');
  }

  return bestText;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const snippet = searchParams.get('snippet'); // Testo RSS già disponibile nel client

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // --- STRATEGIA 1: usa lo snippet RSS che il client ci passa (legale e istantaneo) ---
  if (snippet && snippet.length > 100) {
    return NextResponse.json({ 
      content: snippet,
      resolvedUrl: url,
      source: 'rss-snippet'
    });
  }

  try {
    // --- STRATEGIA 2: risolvi il redirect Google News e scrapa il sito reale ---
    const resolvedUrl = await resolveGoogleNewsUrl(url);
    
    let content = '';
    try {
      content = await scrapeArticle(resolvedUrl);
    } catch {
      try {
        content = await scrapeArticle(url);
      } catch {
        content = '';
      }
    }

    if (content && content.length > 100) {
      return NextResponse.json({ 
        content,
        resolvedUrl,
        source: 'scrape'
      });
    }

    // --- STRATEGIA 3: fallback ---
    return NextResponse.json({
      content: '📰 L\'anteprima completa non è disponibile per questo articolo (possibile paywall o protezione anti-bot). Usa il pulsante qui sotto per leggere l\'articolo originale.',
      resolvedUrl,
      source: 'fallback'
    });

  } catch {
    return NextResponse.json({ 
      content: '📰 Impossibile raggiungere l\'articolo. Usa il pulsante qui sotto per aprire la fonte originale.',
      resolvedUrl: url,
      source: 'error'
    });
  }
}
