import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { url, title, snippet, source } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL mancante per il caricamento' }, { status: 400 });
    }

    try {
      // 1. Fetch the actual web page
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(5000) // 5 seconds timeout
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const html = await res.text();

      // 2. Parse the HTML and extract article text using Readability
      const doc = new JSDOM(html, { url });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();

      if (article && article.textContent) {
        // Pulizia: rimuove doppi spazi, tabulazioni ecc
        let text = article.textContent.replace(/\s+/g, ' ').trim();
        
        // Estraiamo i primi 600 caratteri (cercando l'ultimo punto per non troncare la frase)
        if (text.length > 600) {
          let excerpt = text.substring(0, 600);
          const lastDot = excerpt.lastIndexOf('.');
          if (lastDot > 100) {
            excerpt = excerpt.substring(0, lastDot + 1);
          } else {
            excerpt += '...';
          }
          return NextResponse.json({ summary: excerpt });
        }
        
        if (text.length > 50) {
           return NextResponse.json({ summary: text });
        }
      }
    } catch (e) {
      console.error("Scraping error:", e);
      // Se fallisce, scendiamo al fallback qui sotto
    }

    // 3. Fallback: Se il sito blocca lo scraping o va in timeout, restituiamo uno snippet "allargato"
    let fallbackText = '';
    if (snippet && snippet.length > 30) {
      fallbackText = snippet;
    } else {
      fallbackText = `${title}. Clicca "Leggi Articolo" in basso per continuare sul sito ufficiale.`;
    }

    return NextResponse.json({ summary: fallbackText });

  } catch (error: any) {
    console.error("Endpoint Error:", error.message);
    return NextResponse.json({ error: error.message || 'Errore imprevisto' }, { status: 500 });
  }
}
