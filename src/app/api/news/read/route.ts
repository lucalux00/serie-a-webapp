import { NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

// Risolve URL da Google News
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    // Tenta decode base64 dal path
    const matchBase64 = googleUrl.match(/articles\/([A-Za-z0-9_-]+)/);
    if (matchBase64?.[1]) {
      let b64 = matchBase64[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      try {
        const decoded = Buffer.from(b64, 'base64').toString('utf-8');
        const urlMatch = decoded.match(/https?:\/\/(?!.*google\.com)[^\x00-\x1F"'\s>]+/);
        if (urlMatch?.[0]) return urlMatch[0];
      } catch { /* non decodificabile, continua */ }
    }

    // Segui il redirect reale
    const res = await fetch(googleUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      }
    });
    if (!res.url.includes('google.com')) return res.url;

    // Fallback: cerca il link diretto nell'HTML restituito
    const html = await res.text();
    const $ = cheerio.load(html);
    let found = '';
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('http') && !href.includes('google.com') && !found) {
        found = href;
      }
    });
    return found || googleUrl;
  } catch {
    return googleUrl;
  }
}

// Tenta di estrarre articolo con Readability
async function extractWithReadability(url: string): Promise<string> {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  ];

  let lastErr: any;
  for (const ua of userAgents) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.google.com/',
        }
      });

      if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }

      const html = await res.text();
      const doc = new JSDOM(html, { url });
      const win = doc.window;

      // Rimuovi elementi non utili prima di Readability
      const selectorsToRemove = [
        'script', 'style', 'nav', 'footer', 'aside', 'header',
        '.cookie', '.gdpr', '.piano-modal', '.paywall', '.subscription',
        '[class*="cookie"]', '[class*="paywall"]', '[class*="modal"]',
        '[class*="newsletter"]', '[class*="popup"]', '[id*="cookie"]',
        '[id*="paywall"]', '[id*="modal"]', '[id*="newsletter"]',
        '.ad', '.advertisement', '.pub', '[class*="advert"]',
        '.social-share', '.related-articles', '.tag-list',
      ];
      selectorsToRemove.forEach(sel => {
        win.document.querySelectorAll(sel).forEach(el => el.remove());
      });

      const reader = new Readability(win.document, {
        charThreshold: 200,
        keepClasses: false,
      });
      const article = reader.parse();
      const content = article?.content || '';

      if (content.length > 300) return content;

      // Fallback Readability: prendi paragrafi grezzi
      const paragraphs = Array.from(win.document.querySelectorAll('article p, .article p, .content p, [class*="article"] p, [class*="body"] p, p'));
      const rawText = (paragraphs as any[])
        .map((p: any) => p.innerHTML?.trim())
        .filter((t: string) => t && t.length > 50)
        .slice(0, 30)
        .join('<br/><br/>');

      if (rawText.length > content.length) return rawText;
      if (content.length > 0) return content;

    } catch (err) {
      lastErr = err;
      continue;
    }
  }
  throw lastErr || new Error('Tutti i tentativi falliti');
}

// Estrazione con Cheerio (puro HTML parsing, nessun DOM virtuale pesante)
async function extractWithCheerio(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9',
      'Referer': 'https://www.google.com/',
    }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Cerca selettori comuni degli articoli italiani
  const articleSelectors = [
    'article', '.article-body', '.article__body', '[class*="article-content"]',
    '[class*="articleBody"]', '[itemprop="articleBody"]', '.entry-content',
    '.post-content', '.story-body', '.main-content', '[class*="story"]',
    '[class*="content-article"]', '.text', '[class*="body-text"]',
    '.corrieredellosport-article', '.gazzetta-body', '.tuttomercatoweb-body',
  ];

  let bestContent = '';
  for (const sel of articleSelectors) {
    const el = $(sel).first();
    if (el.length > 0) {
      // Rimuovi elementi di distrazione
      el.find('script, style, .ad, .advertisement, .social, nav, figure figcaption, .related').remove();
      const paragraphs = el.find('p').map((_, p) => $(p).text().trim()).get().filter(t => t.length > 40);
      const text = '<p>' + paragraphs.join('</p><p>') + '</p>';
      if (text.length > bestContent.length) bestContent = text;
    }
  }

  // Se non trovato, prendi tutti i <p> della pagina
  if (bestContent.length < 200) {
    const allPs = $('p').map((_, p) => $(p).text().trim()).get().filter(t => t.length > 40);
    bestContent = '<p>' + allPs.slice(0, 30).join('</p><p>') + '</p>';
  }

  return bestContent;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const snippet = searchParams.get('snippet');

  if (!rawUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Se lo snippet RSS è già lungo e significativo, lo mostriamo direttamente
  if (snippet && snippet.length > 400) {
    const cleanSnippet = `<p style="font-size:0.85rem;color:#F59E0B;font-weight:bold;margin-bottom:1rem;">⚡ Anteprima RSS — Per il testo completo apri l'articolo nel browser.</p><p>${snippet}</p>`;
    return NextResponse.json({ content: cleanSnippet, resolvedUrl: rawUrl, source: 'rss-snippet' });
  }

  let resolvedUrl = rawUrl;
  let content = '';

  try {
    // Passo 1: Risolvi il redirect Google News se necessario
    if (rawUrl.includes('google.com') || rawUrl.includes('news.google.com')) {
      resolvedUrl = await resolveGoogleNewsUrl(rawUrl);
    }

    const isStillGoogle = resolvedUrl.includes('google.com');
    if (!isStillGoogle) {
      // Passo 2: Estrazione con Readability (più accurata)
      try {
        content = await extractWithReadability(resolvedUrl);
      } catch {
        // Passo 3: Fallback con Cheerio (più leggero)
        try {
          content = await extractWithCheerio(resolvedUrl);
        } catch {
          content = '';
        }
      }
    }

    if (content && content.length > 200) {
      // Aggiungi un disclaimer estetico
      const disclaimer = `<p style="font-size:0.75rem;color:#64748B;margin-bottom:1.5rem;padding:0.5rem;background:rgba(16,185,129,0.1);border-radius:0.5rem;border-left:3px solid #10B981;">
        Contenuto estratto da <strong>${new URL(resolvedUrl).hostname}</strong>
      </p>`;
      return NextResponse.json({
        content: disclaimer + content,
        resolvedUrl,
        source: 'readability-extractor',
      });
    }

    // Passo 4: Snippet RSS se disponibile
    if (snippet && snippet.length > 100) {
      const snippetContent = `
        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:0.75rem;padding:1rem;margin-bottom:1rem;">
          <p style="color:#F59E0B;font-size:0.75rem;font-weight:bold;margin-bottom:0.5rem;">⚡ ANTEPRIMA — L'articolo completo è protetto da paywall o anti-bot.</p>
        </div>
        <p>${snippet}</p>
      `;
      return NextResponse.json({ content: snippetContent, resolvedUrl, source: 'rss-snippet-fallback' });
    }

    // Passo 5: Iframe come ultima spiaggia (solo se non è Google)
    if (!isStillGoogle && resolvedUrl !== rawUrl) {
      const iframeContent = `
        <div style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.3);border-radius:0.75rem;padding:0.75rem;margin-bottom:0.75rem;font-size:0.75rem;color:#0EA5E9;font-weight:bold;">
          Modalità Web: articolo visualizzato dal sito originale.
        </div>
        <div style="width:100%;height:65vh;border-radius:12px;overflow:hidden;background:white;">
          <iframe src="${resolvedUrl}" width="100%" height="100%" frameborder="0" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
        </div>
      `;
      return NextResponse.json({ content: iframeContent, resolvedUrl, source: 'iframe-fallback' });
    }

    // Caso Google bloccato
    const googleBlockedContent = `
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:0.75rem;padding:1.5rem;text-align:center;">
        <p style="color:#EF4444;font-weight:bold;font-size:0.875rem;margin-bottom:0.5rem;">🔒 Articolo protetto da Google News</p>
        <p style="color:#94A3B8;font-size:0.8rem;margin-bottom:1rem;">
          Il sito originale impedisce la lettura diretta. Clicca su "Apri nel Browser" per leggere l'articolo completo.
        </p>
        ${snippet ? `<p style="color:#F8FAFC;margin-top:1rem;font-style:italic;">${snippet}</p>` : ''}
      </div>
    `;
    return NextResponse.json({ content: googleBlockedContent, resolvedUrl, source: 'google-blocked' });

  } catch {
    const errorContent = `
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:0.75rem;padding:1.5rem;text-align:center;">
        <p style="color:#EF4444;font-weight:bold;font-size:0.875rem;margin-bottom:0.5rem;">⚠️ Errore di Caricamento</p>
        <p style="color:#94A3B8;font-size:0.8rem;">Impossibile recuperare l'articolo in questo momento.</p>
        ${snippet ? `<p style="color:#F8FAFC;margin-top:1rem;font-style:italic;">${snippet}</p>` : ''}
      </div>
    `;
    return NextResponse.json({ content: errorContent, resolvedUrl: rawUrl, source: 'error' });
  }
}
