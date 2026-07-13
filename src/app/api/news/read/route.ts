import { NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export const dynamic = 'force-dynamic';

// Risolve il redirect di Google News verso il sito originale
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    // Prova a decodificare direttamente il base64 dal link
    const matchBase64 = googleUrl.match(/articles\/([A-Za-z0-9_-]+)/);
    if (matchBase64 && matchBase64[1]) {
      let b64 = matchBase64[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const decoded = Buffer.from(b64, 'base64').toString('ascii');
      const urlMatch = decoded.match(/https?:\/\/[^\x00-\x1F"'\s>]+/);
      if (urlMatch && urlMatch[0] && !urlMatch[0].includes('google.com')) {
        return urlMatch[0];
      }
    }

    const res = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    const html = await res.text();
    // Cerca il primo link che NON è di google
    const links = html.match(/<a[^>]+href="([^"]+)"/ig);
    if (links) {
      for (const linkHtml of links) {
        const urlMatch = linkHtml.match(/href="([^"]+)"/i);
        if (urlMatch && urlMatch[1] && urlMatch[1].startsWith('http') && !urlMatch[1].includes('google.com')) {
          return urlMatch[1];
        }
      }
    }
    return googleUrl;
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

  let content = article?.content || '';
    
  // Fallback: se Readability estrae troppo poco (es. paywall o markup complesso), prendiamo brutalmente tutti i paragrafi
  if (!content || content.length < 500) {
    const paragraphs = Array.from(window.document.querySelectorAll('p'));
    const fullText = paragraphs.map(p => p.innerHTML?.trim()).filter(t => t && t.length > 40).join('<br/><br/>');
    if (fullText.length > content.length) {
      content = fullText;
    }
  }

  if (content) {
    return content;
  }

  return '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const snippet = searchParams.get('snippet');
  
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

    const isGoogle = resolvedUrl.includes('google.com');
    
    // Se fallisce l'estrazione testuale (es. per Cloudflare o paywall), usiamo un iframe diretto!
    // MA se la URL è ancora di Google, l'iframe verrà bloccato (Connessione Negata), quindi mettiamo un bottone.
    const iframeFallback = isGoogle ? `
      <div class="mb-4 bg-[#EF4444]/20 border border-[#EF4444]/50 p-6 rounded-lg text-center">
        <div class="text-[#EF4444] font-black text-sm mb-2 uppercase">Protezione Google Attiva</div>
        <p class="text-[#F8FAFC] text-sm mb-4">Per leggere questo articolo devi aprirlo direttamente nel browser.</p>
        <a href="${resolvedUrl}" target="_blank" class="inline-block bg-[#EF4444] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-[#DC2626] transition-colors">
          Apri Articolo
        </a>
      </div>
    ` : `
      <div class="mb-4 bg-[#10B981]/20 border border-[#10B981]/50 p-3 rounded-lg text-[#10B981] text-xs font-bold">
        Modalità Web: l'articolo viene mostrato nella sua versione originale.
      </div>
      <div style="width: 100%; height: 65vh; border-radius: 12px; overflow: hidden; background: white;">
        <iframe src="${resolvedUrl}" width="100%" height="100%" frameborder="0" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
      </div>
    `;

    return NextResponse.json({
      content: iframeFallback,
      resolvedUrl,
      source: 'iframe-fallback'
    });

  } catch {
    const iframeError = `
      <div class="mb-4 bg-[#EF4444]/20 border border-[#EF4444]/50 p-6 rounded-lg text-center">
        <div class="text-[#EF4444] font-black text-sm mb-2 uppercase">Impossibile Caricare</div>
        <a href="${url}" target="_blank" class="inline-block bg-[#EF4444] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-[#DC2626] transition-colors mt-2">
          Apri nel Browser
        </a>
      </div>
    `;
    return NextResponse.json({ 
      content: iframeError,
      resolvedUrl: url,
      source: 'error-iframe'
    });
  }
}

