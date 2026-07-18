import React from 'react';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
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
    const html = await res.text();
    
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Impossibile estrarre l\'articolo');
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
          
          <h1 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">{article.title}</h1>
          
          {article.byline && (
            <div className="text-sm text-[#94A3B8] font-bold mb-6 pb-6 border-b border-[#334155]">
              Di <span className="text-white">{article.byline}</span>
            </div>
          )}
          
          <div 
            className="prose prose-invert max-w-none text-[#F8FAFC] leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: article.content || '' }} 
          />
        </div>
        
        {/* Anti-copy CSS e script per bloccare il tasto destro e la selezione */}
        <style dangerouslySetInnerHTML={{__html: `
          .select-none {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
          /* Nascondi eventuali immagini rotte o iframes dall'articolo originale */
          .prose iframe { display: none !important; }
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
