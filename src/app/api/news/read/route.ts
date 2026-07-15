import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    const matchBase64 = googleUrl.match(/articles\/([A-Za-z0-9_-]+)/);
    if (matchBase64?.[1]) {
      let b64 = matchBase64[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      try {
        const decoded = Buffer.from(b64, 'base64').toString('utf-8');
        const urlMatch = decoded.match(/https?:\/\/(?!.*google\.com)[^\x00-\x1F"'\s>]+/);
        if (urlMatch?.[0]) return urlMatch[0];
      } catch { }
    }

    const res = await fetch(googleUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      }
    });
    if (!res.url.includes('google.com')) return res.url;

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

async function extractWithCheerio(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9',
      'Referer': 'https://www.google.com/',
    }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const articleSelectors = [
    'article', '.article-body', '.article__body', '[class*="article-content"]',
    '[class*="articleBody"]', '[itemprop="articleBody"]', '.entry-content',
    '.corrieredellosport-article', '.gazzetta-body', '.tuttomercatoweb-body',
  ];

  let bestContent = '';
  for (const sel of articleSelectors) {
    const el = $(sel).first();
    if (el.length > 0) {
      el.find('script, style, .ad, .advertisement, .social, nav, figure figcaption, .related').remove();
      const paragraphs = el.find('p').map((_, p) => $(p).text().trim()).get().filter(t => t.length > 40);
      const text = paragraphs.join('\n\n');
      if (text.length > bestContent.length) bestContent = text;
    }
  }

  if (bestContent.length < 200) {
    const allPs = $('p').map((_, p) => $(p).text().trim()).get().filter(t => t.length > 40);
    bestContent = allPs.slice(0, 30).join('\n\n');
  }
  return bestContent;
}

async function rewriteWithAI(text: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI API KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Sei un redattore sportivo professionista. Ho estratto questo frammento di testo da una notizia online.
Il tuo compito è RISCRIVERE la notizia in modo completamente originale e con parole tue, per evitare il plagio, ma mantenendo la veridicità dei fatti sportivi al 100%. 
Non copiare frasi, crea un piccolo articolo giornalistico originale di 2 o 3 paragrafi ben formattati.
Usa i tag HTML <p> e <strong> dove appropriato per evidenziare i nomi, ma NON usare i tag <html> o <body> o \`\`\`html. Restituisci SOLO il contenuto HTML puro del corpo del testo.

Testo sorgente (potrebbe essere frammentato, riassumilo in modo logico):
"${text.substring(0, 4000)}"`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let rewritten = response.text();
  rewritten = rewritten.replace(/```html/g, '').replace(/```/g, '').trim();
  return rewritten;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const snippet = searchParams.get('snippet');

  if (!rawUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let resolvedUrl = rawUrl;
  let content = '';

  try {
    if (rawUrl.includes('google.com') || rawUrl.includes('news.google.com')) {
      resolvedUrl = await resolveGoogleNewsUrl(rawUrl);
    }

    const isStillGoogle = resolvedUrl.includes('google.com');
    if (!isStillGoogle) {
      try {
        content = await extractWithCheerio(resolvedUrl);
      } catch {
        content = '';
      }
    }

    // Se abbiamo estratto un buon testo, lo riscriviamo con l'AI
    if (content && content.length > 200) {
      try {
        const rewrittenContent = await rewriteWithAI(content);
        const disclaimer = `<p style="font-size:0.75rem;color:#10B981;margin-bottom:1.5rem;padding:0.5rem;background:rgba(16,185,129,0.1);border-radius:0.5rem;border-left:3px solid #10B981;font-weight:bold;">✨ Articolo redatto in esclusiva dalla nostra AI per questioni di copyright.</p>`;
        return NextResponse.json({ content: disclaimer + rewrittenContent, resolvedUrl, source: 'ai-rewritten' });
      } catch (e) {
        console.error("AI Error:", e);
        // Fallback: articolo estratto ma non riscritto
        const disclaimer = `<p style="font-size:0.75rem;color:#64748B;margin-bottom:1.5rem;padding:0.5rem;background:rgba(16,185,129,0.1);border-radius:0.5rem;border-left:3px solid #10B981;">Contenuto originale estratto da <strong>${new URL(resolvedUrl).hostname}</strong></p>`;
        return NextResponse.json({ content: disclaimer + content.replace(/\n\n/g, '<br/><br/>'), resolvedUrl, source: 'cheerio-extractor' });
      }
    }

    // Se l'estrazione fallisce (anti-bot) usiamo l'AI sullo snippet per generare un micro-articolo!
    if (snippet && snippet.length > 50) {
      try {
        const rewrittenSnippet = await rewriteWithAI(snippet);
        const disclaimer = `<p style="font-size:0.75rem;color:#10B981;margin-bottom:1.5rem;padding:0.5rem;background:rgba(16,185,129,0.1);border-radius:0.5rem;border-left:3px solid #10B981;font-weight:bold;">✨ Flash News redatta dalla nostra AI sulla base delle ultime indiscrezioni.</p>`;
        return NextResponse.json({ content: disclaimer + rewrittenSnippet, resolvedUrl, source: 'ai-snippet' });
      } catch (e) {
        // Fallback totale: mostra lo snippet
        const snippetContent = `
          <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:0.75rem;padding:1rem;margin-bottom:1rem;">
            <p style="color:#F59E0B;font-size:0.75rem;font-weight:bold;margin-bottom:0.5rem;">⚡ ANTEPRIMA — L'articolo completo è protetto da paywall o anti-bot e l'AI non è disponibile.</p>
          </div>
          <p>${snippet}</p>
        `;
        return NextResponse.json({ content: snippetContent, resolvedUrl, source: 'rss-snippet-fallback' });
      }
    }

    // Ultima spiaggia: iframe
    if (!isStillGoogle && resolvedUrl !== rawUrl) {
      const iframeContent = `
        <div style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.3);border-radius:0.75rem;padding:0.75rem;margin-bottom:0.75rem;font-size:0.75rem;color:#0EA5E9;font-weight:bold;">
          Modalità Web Originale
        </div>
        <div style="width:100%;height:65vh;border-radius:12px;overflow:hidden;background:white;">
          <iframe src="${resolvedUrl}" width="100%" height="100%" frameborder="0" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
        </div>
      `;
      return NextResponse.json({ content: iframeContent, resolvedUrl, source: 'iframe-fallback' });
    }

    throw new Error('All fallbacks failed');
  } catch (error) {
    return NextResponse.json({ 
      content: `<p style="color:#EF4444;">Impossibile recuperare l'articolo in questo momento.</p>${snippet ? `<p>${snippet}</p>` : ''}`,
      resolvedUrl: rawUrl, 
      source: 'error' 
    });
  }
}
