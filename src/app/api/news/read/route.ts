import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Risolve redirect di Google News e altri aggregatori
async function resolveRedirect(url: string): Promise<string> {
  try {
    // Google News usa un URL encoded nell'RSS - proviamo a seguire il redirect
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    // Se siamo stati reindirizzati, usa l'URL finale
    return res.url || url;
  } catch {
    return url;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Step 1: risolvi redirect (Google News -> sito originale)
    const resolvedUrl = await resolveRedirect(url);

    // Step 2: fetch del vero articolo
    const res = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      }
    });

    if (!res.ok) {
      throw new Error(`Fetch fallito: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Rimuovi tutto il rumore
    $('script, style, nav, header, footer, aside, iframe, .ads, .ad, .advertisement, .social-share, .newsletter, .related, .comments, [role="banner"], [role="navigation"], [role="complementary"], .cookie-banner, .gdpr').remove();

    let articleBody = '';

    // Selettori in ordine di affidabilità
    const contentSelectors = [
      '[itemprop="articleBody"]',
      '.article-body',
      '.article__body', 
      '.article-content',
      '.article__content',
      '.entry-content',
      '.post-content',
      '.story-body',
      '.content-body',
      '#article-body',
      'article',
      '[class*="article"]',
      '[class*="content"]',
      'main',
    ];

    let bestText = '';

    for (const selector of contentSelectors) {
      const node = $(selector);
      if (node.length > 0) {
        const paragraphs: string[] = [];
        node.find('p').each((i: any, el: any) => {
          const text = $(el).text().trim();
          // Filtra paragrafi troppo brevi o probabilmente UI noise
          if (text.length > 40 && !text.match(/^(Leggi anche|Abbonati|Accedi|Cookie|Privacy|Seguici)/i)) {
            paragraphs.push(text);
          }
        });
        const joined = paragraphs.join('\n\n');
        // Tiene il contenuto più lungo trovato
        if (joined.length > bestText.length) {
          bestText = joined;
        }
        // Se abbiamo già un testo corposo, fermiamoci
        if (bestText.length > 500) break;
      }
    }

    // Ultimo fallback: tutti i paragrafi della pagina
    if (bestText.length < 200) {
      const paragraphs: string[] = [];
      $('p').each((i: any, el: any) => {
        const text = $(el).text().trim();
        if (text.length > 60) {
          paragraphs.push(text);
        }
      });
      if (paragraphs.length > 0) {
        bestText = paragraphs.join('\n\n');
      }
    }

    if (!bestText || bestText.length < 100) {
      bestText = "⚠️ Impossibile estrarre l'articolo completo da questo sito. Potrebbe trattarsi di un contenuto riservato agli abbonati (paywall) o il sito potrebbe bloccare la lettura automatica. Puoi aprire l'articolo originale tramite il pulsante in basso.";
    }

    return NextResponse.json({
      content: bestText,
      resolvedUrl,
    });

  } catch (error) {
    return NextResponse.json({ 
      content: "⚠️ Errore durante l'estrazione dell'articolo. Il sito potrebbe non essere raggiungibile o richiedere un accesso protetto.",
      resolvedUrl: url
    });
  }
}
