import { NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

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

// Scraping robusto con Mozilla Readability e JSDOM
async function extractArticleText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });

  if (!res.ok) throw new Error(`${res.status}`);
  const html = await res.text();
  
  // Utilizziamo JSDOM per creare un DOM virtuale e Readability per estrarre il main content
  const doc = new JSDOM(html, { url });
  
  // Rimuovi cookie banner, banner adv, popups per pulire l'HTML prima del parsing
  const window = doc.window;
  const elementsToRemove = window.document.querySelectorAll('script, style, nav, footer, aside, .cookie, .ad, .advertisement, [id*="cookie"], [class*="cookie"]');
  elementsToRemove.forEach(el => el.remove());

  const reader = new Readability(window.document);
  const article = reader.parse();

  if (article && article.textContent) {
    // Pulizia di newline multipli generati da Readability
    let cleanText = article.textContent.replace(/\n\s*\n/g, '\n\n').trim();
    return cleanText;
  }

  return '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Risolvi il redirect Google News
    const resolvedUrl = await resolveGoogleNewsUrl(url);
    
    // Tenta lo scraping completo con JSDOM + Readability
    let content = '';
    try {
      content = await extractArticleText(resolvedUrl);
    } catch {
      try {
        content = await extractArticleText(url); // fallback url originale
      } catch {
        content = '';
      }
    }

    if (content && content.length > 200) {
      return NextResponse.json({ 
        content,
        resolvedUrl,
        source: 'readability-extractor'
      });
    }

    // Se fallisce, messaggio esplicito con pulsante (il client UI ora ha il pulsante gigante)
    return NextResponse.json({
      content: '📰 L\'articolo completo non può essere visualizzato direttamente in app a causa delle protezioni del sito web (paywall o blocco bot).\n\n👇 Clicca il pulsante qui sotto per aprirlo nel browser e leggerlo integralmente.',
      resolvedUrl,
      source: 'fallback'
    });

  } catch {
    return NextResponse.json({ 
      content: '📰 Impossibile raggiungere l\'articolo. \n\n👇 Clicca il pulsante qui sotto per aprire la fonte originale nel browser.',
      resolvedUrl: url,
      source: 'error'
    });
  }
}

