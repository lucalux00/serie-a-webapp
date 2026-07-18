"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function NewsTicker() {
  const { user } = useAuth();
  const [news, setNews] = useState<{title: string, time: string}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Caricamento asincrono lato client delle news per simulare il ticker
    import('@/data/realNews.json')
      .then(module => {
        const data = module.default as Record<string, any[]>;
        const allNews = Object.values(data).flat();
        
        let filteredNews = allNews;
        if (user?.favoriteTeamName) {
          const teamName = user.favoriteTeamName.toLowerCase();
          filteredNews = allNews.filter(n => 
            n.title?.toLowerCase().includes(teamName) || 
            n.snippet?.toLowerCase().includes(teamName)
          );
        }

        // Se non ci sono notizie per la squadra, mostriamo quelle generali
        if (filteredNews.length === 0) {
          filteredNews = allNews;
        }

        // Mescoliamo e prendiamo le prime 15 notizie
        const shuffled = filteredNews.sort(() => 0.5 - Math.random()).slice(0, 15);
        setNews(shuffled);
      });
  }, [user?.favoriteTeamName]);

  // Logica per cambiare notizia ogni 4 secondi
  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 4000); // 4 secondi per leggere la notizia
    
    return () => clearInterval(interval);
  }, [news]);

  if (news.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#1E293B] border-y border-[#334155] flex items-center overflow-hidden z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
      {/* Badge Fisso "ULTIM'ORA" */}
      <div className="bg-[#EF4444] h-full flex items-center px-3 z-10 font-black text-[10px] text-white tracking-widest uppercase shrink-0 shadow-lg relative">
        ULTIM'ORA
        {/* Effetto pulsante per dare senso di live */}
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
      </div>

      {/* Contenitore Animato della Notizia */}
      <div className="flex-1 overflow-hidden relative h-full bg-[#0F172A]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center px-3"
          >
            <span className="text-[var(--color-sport-secondary)] font-black text-xs mr-2 shrink-0">
              {news[currentIndex].time}
            </span>
            <span className="text-[#F8FAFC] font-semibold text-xs truncate">
              {news[currentIndex].title}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
