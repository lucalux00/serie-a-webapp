import React from 'react';
import * as cheerio from 'cheerio';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ReadNewsPage(props: { searchParams: Promise<{ url?: string, source?: string }> }) {
  const searchParams = await props.searchParams;
  const url = searchParams?.url;
  const source = searchParams?.source || 'Fonte Sconosciuta';

  if (!url) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center text-white">
        <h1 className="text-2xl font-bold text-red-500 mb-4">URL non valido</h1>
        <Link href="/" className="text-[#10B981] font-bold">Torna alla Home</Link>
      </div>
    );
  }

  try {
    let html = '';
    
    // 1. Proviamo la fetch diretta con headers avanzati che simulano un browser reale
    // Usiamo anche la cache di Next.js (revalidate) per non tempestare i siti di news di richieste
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/'
      },
      next: { revalidate: 3600 } // Cache di 1 ora
    });

    if (res.ok) {
      html = await res.text();
    } else {
      // 2. Se Vercel viene comunque bloccato (errore 403 da Cloudflare, ecc.), usiamo AllOrigins come proxy gratuito
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyRes = await fetch(proxyUrl, { next: { revalidate: 3600 } });
      if (!proxyRes.ok) throw new Error('Proxy fetch failed');
      html = await proxyRes.text();
    }
    
    const $ = cheerio.load(html);
    
    // Rimuovi elementi di disturbo: blocchi pubblicitari, link correlati e player multimediali (video, audio, iframe)
    $('script, style, iframe, nav, footer, header, aside, form, button, video, audio, object, embed, figure, picture, .ad, .ads, .advertisement, .cookie-banner, .social-share, .related, .comments, [class*="banner"], [id*="banner"], [class*="sidebar"], [class*="menu"], [class*="newsletter"], [id*="newsletter"], [class*="subscribe"], [class*="sponsor"], [id*="sponsor"], [class*="adv"], [id*="adv"], amp-video, amp-iframe').remove();
    
    let contentHtml = '';
    const selectors = ['article', '.article-content', '.article-body', '.entry-content', '.post-content', 'main', '#main-content'];
    
    let targetEl = null;
    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        targetEl = el;
        break;
      }
    }

    if (!targetEl) {
      targetEl = $('body');
    }

    // Rimuovi anche i contenitori generici che spesso ospitano il tasto play testuale
    $('[class*="video"], [class*="player"], [id*="video"], [id*="player"], .play, .play-button, .play-btn, .jwplayer, .vjs').remove();

    // Estrapola solo il testo (paragrafi e titoli) per evitare HTML rotto o pubblicità
    const elements = targetEl.find('p, h2, h3, h4');
    if (elements.length > 0) {
      const textBlocks: string[] = [];
      elements.each((i, el) => {
        const tagName = el.tagName.toLowerCase();
        const text = $(el).text().trim();
        const lowerText = text.toLowerCase();
        
        // Filtra frasi tipiche dei bottoni video, pubblicità testuali o sezioni promozionali
        if (
          lowerText === 'play' || 
          lowerText === 'replay' || 
          lowerText === 'video' ||
          lowerText.includes('pubblicità') ||
          lowerText.includes('pubblicita') ||
          lowerText.includes('sponsorizzato') ||
          lowerText.includes('guarda il video') || 
          lowerText.includes('leggi anche') || 
          lowerText.includes('scopri di più') ||
          lowerText.includes('leggi di più') ||
          lowerText.includes('potrebbe interessarti') ||
          lowerText.includes('tutti i diritti riservati') ||
          lowerText.includes('riproduzione riservata') ||
          lowerText.includes('iscriviti') ||
          lowerText.includes("scarica l'app") ||
          lowerText.includes('abbonati') ||
          lowerText.includes('registrati') ||
          lowerText.includes('seguici su') ||
          lowerText.includes('clicca qui') ||
          lowerText.startsWith('video:') || 
          lowerText.startsWith('guarda:') ||
          lowerText.startsWith('scopri:')
        ) {
          return; // salta e ignora questo elemento
        }
        
        if (tagName === 'p' && text.length > 25) {
          textBlocks.push(`<p>${text}</p>`);
        } else if (tagName.startsWith('h') && text.length > 5) {
          textBlocks.push(`<${tagName}>${text}</${tagName}>`);
        }
      });
      contentHtml = textBlocks.join('');
    } else {
      // Fallback estremo
      const rawText = targetEl.text().trim();
      if (rawText.length > 0) {
        contentHtml = `<p>${rawText}</p>`;
      }
    }

    if (!contentHtml) {
      contentHtml = '<p>Contenuto non disponibile.</p>';
    }

    const title = $('h1').first().text() || $('title').text() || 'Articolo';
    
    // Estrai l'autore (giornalista)
    let author = $('meta[name="author"]').attr('content') || 
                 $('meta[property="article:author"]').attr('content') || 
                 $('.author, .byline, [rel="author"], .article-author').first().text().trim() || null;
                 
    // Pulisci eventuale testo "di " dall'autore
    if (author && author.toLowerCase().startsWith('di ')) {
      author = author.substring(3).trim();
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl relative">
        <div className="mb-6">
          <Link href="javascript:history.back()" className="text-[#10B981] font-bold flex items-center hover:underline">
            <ArrowLeft className="w-5 h-5 mr-2" /> Torna Indietro
          </Link>
        </div>
        
        <div className="bg-[#1E293B] p-6 rounded-3xl shadow-xl border border-[#334155] select-none">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-[#0EA5E9] uppercase tracking-widest bg-[#0EA5E9]/10 inline-block px-3 py-1 rounded-full">
              {source}
            </div>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">{title}</h1>
          
          {author && (
            <div className="text-sm text-[#94A3B8] font-bold mb-6 pb-6 border-b border-[#334155]">
              Di <span className="text-white">{author}</span>
            </div>
          )}
          
          <div 
            className="prose prose-invert max-w-none text-[#F8FAFC] leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: contentHtml }} 
          />
          
          {/* Disclaimer Legale */}
          <div className="mt-8 pt-6 border-t border-[#334155] text-[#94A3B8] text-sm bg-[#0F172A] p-4 rounded-xl">
            <p>
              Questo articolo è stato originariamente pubblicato da <strong className="text-white">{source}</strong>
              {author ? ` a cura di ${author}` : ''}. I diritti d'autore e il contenuto testuale appartengono ai rispettivi proprietari.
            </p>
            <p className="mt-3">
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#10B981] font-bold hover:underline">
                Leggi l'articolo originale sul sito della fonte <ArrowLeft className="w-4 h-4 ml-1 rotate-135" style={{ transform: 'rotate(135deg)' }} />
              </a>
            </p>
          </div>
        </div>
        
        {/* Anti-copy CSS e script */}
        <style dangerouslySetInnerHTML={{__html: `
          .select-none {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
        `}} />
        <script dangerouslySetInnerHTML={{__html: `
          document.addEventListener('contextmenu', event => event.preventDefault());
          document.addEventListener('copy', event => {
             event.clipboardData.setData('text/plain', 'Contenuto protetto - Non copiabile.');
             event.preventDefault();
          });
        `}} />
      </div>
    );
  } catch (e) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center text-white">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Impossibile caricare l'articolo completo</h1>
        <p className="text-[#94A3B8] mb-6">Il sito originale non consente la lettura interna o richiede un abbonamento.</p>
        <Link href="javascript:history.back()" className="text-[#10B981] font-bold">Torna Indietro</Link>
      </div>
    );
  }
}
