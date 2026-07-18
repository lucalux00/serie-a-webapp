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
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error('Failed to fetch');
    const html = await res.text();
    
    const $ = cheerio.load(html);
    
    // Rimuovi elementi di disturbo
    $('script, style, iframe, nav, footer, header, aside, .ad, .ads, .advertisement, .cookie-banner, .social-share').remove();
    
    let contentHtml = '';
    const selectors = ['article', '.article-content', '.article-body', '.entry-content', '.post-content', 'main'];
    
    for (const selector of selectors) {
      const el = $(selector);
      if (el.length > 0) {
        contentHtml = el.html() || '';
        break;
      }
    }

    if (!contentHtml) {
      contentHtml = $('body').html() || '<p>Contenuto non disponibile.</p>';
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
