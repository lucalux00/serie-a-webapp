"use client";

import React, { useEffect, useState } from 'react';

export default function NewsTicker() {
  const [news, setNews] = useState<{title: string, time: string}[]>([]);

  useEffect(() => {
    // In un app reale chiameremo un'API o useremo i dati passati dal Server Component globale.
    // Per semplicità qui simuliamo il fetch prendendo un file statico o facendo una fetch reale.
    // Dato che siamo lato client e in Vercel non possiamo accedere al fs, carichiamo le ultimissime 
    // news in modo asincrono.
    import('@/data/realNews.json')
      .then(module => {
        const data = module.default as Record<string, any[]>;
        const allNews = Object.values(data).flat();
        // Mescoliamo e prendiamo le prime 15
        const shuffled = allNews.sort(() => 0.5 - Math.random()).slice(0, 15);
        setNews(shuffled);
      });
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="fixed bottom-[60px] left-0 right-0 h-8 bg-[#EF4444] border-y border-[#B91C1C] flex items-center overflow-hidden z-30 shadow-lg">
      <div className="bg-[#B91C1C] h-full flex items-center px-3 z-10 font-black text-[10px] text-white tracking-widest uppercase shrink-0">
        ULTIM'ORA
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="animate-marquee whitespace-nowrap flex items-center space-x-8 text-xs font-semibold text-white">
          {news.map((item, idx) => (
            <span key={idx} className="flex items-center">
              <span className="text-white/70 mr-2">[{item.time}]</span>
              {item.title}
              <span className="mx-8 text-white/40">•</span>
            </span>
          ))}
          {/* Duplicato per scroll continuo senza salti */}
          {news.map((item, idx) => (
            <span key={`dup-${idx}`} className="flex items-center">
              <span className="text-white/70 mr-2">[{item.time}]</span>
              {item.title}
              <span className="mx-8 text-white/40">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
