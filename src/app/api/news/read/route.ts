import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Rimuoviamo elementi non necessari
    $('script, style, nav, header, footer, aside, iframe, .ads, .social, .banner, [role="banner"], [role="navigation"]').remove();

    let articleBody = '';

    // Euristiche per trovare il contenitore principale
    const contentSelectors = [
      'article',
      '[itemprop="articleBody"]',
      '.entry-content',
      '.article-content',
      '.post-content',
      'main'
    ];

    let contentNode = null;
    for (const selector of contentSelectors) {
      const node = $(selector);
      if (node.length > 0) {
        contentNode = node;
        break;
      }
    }

    // Fallback: prendiamo tutti i paragrafi lunghi
    if (!contentNode) {
      const paragraphs: string[] = [];
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
      articleBody = paragraphs.join('\n\n');
    } else {
      // Estraiamo i paragrafi dal nodo principale
      const paragraphs: string[] = [];
      contentNode.find('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          paragraphs.push(text);
        }
      });
      articleBody = paragraphs.join('\n\n');
    }

    if (!articleBody || articleBody.length < 100) {
       articleBody = "Impossibile estrarre il testo completo da questo sito. Il sito potrebbe richiedere abbonamento (Paywall) o utilizzare sistemi anti-bot. Ti invitiamo a leggere l'articolo originale tramite il link a fine pagina.";
    }

    return NextResponse.json({
      content: articleBody
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to extract article' }, { status: 500 });
  }
}
