"use client";

import React, { useState, useEffect, use } from 'react';
import { ALL_TEAMS } from '@/data/teams';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeamHub({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'news' | 'rosa' | 'stats'>('news');
  const [news, setNews] = useState<any[]>([]);

  // Resolve params Promise (Next.js 15 App Router dynamic params)
  const resolvedParams = use(params);
  const teamId = resolvedParams.id;
  
  const team = ALL_TEAMS.find(t => t.id === teamId) || { name: 'Squadra', logo: '?', league: 'A' };

  useEffect(() => {
    // Carichiamo dinamicamente il file generato dallo script
    import('@/data/realNews.json')
      .then(module => {
        const data = module.default as Record<string, any[]>;
        const teamNews = data[teamId] || [];
        setNews(teamNews);
      })
      .catch(() => {
        console.log('Nessuna news reale trovata per questa squadra.');
      });
  }, [teamId]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#0F172A]">
      {/* Header Squadra */}
      <div className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155] p-4 flex items-center shadow-lg">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-[#94A3B8]">
          <ChevronLeft size={28} />
        </button>
        <div className="ml-2 flex items-center">
          <div className="w-12 h-12 bg-[#0F172A] rounded-full flex items-center justify-center text-xl font-black text-white border-2 border-[#10B981]">
            {team.logo}
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-bold">{team.name}</h1>
            <span className="text-xs font-semibold text-[#94A3B8] uppercase">Serie {team.league}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#334155] bg-[#1E293B] sticky top-[80px] z-30">
        <button 
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'news' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
        >
          NEWS
        </button>
        <button 
          onClick={() => setActiveTab('rosa')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'rosa' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
        >
          ROSA
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'stats' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-[#94A3B8]'}`}
        >
          STATISTICHE
        </button>
      </div>

      {/* Contenuto Tabs */}
      <div className="p-4 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'news' && (
            <motion.div 
              key="news"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pb-20"
            >
              {news.length === 0 ? (
                <div className="text-center p-8 text-[#94A3B8]">Caricamento notizie in corso...</div>
              ) : (
                news.map((item, idx) => (
                  <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="block bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-md active:scale-95 transition-transform">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-[#0EA5E9] uppercase">{item.source}</span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(item.pubDate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug">{item.cleanTitle}</h3>
                  </a>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'rosa' && (
            <motion.div 
              key="rosa"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-center p-8 text-[#94A3B8] border border-dashed border-[#334155] rounded-xl"
            >
              Database Giocatori in aggiornamento per {team.name}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-center p-8 text-[#94A3B8] border border-dashed border-[#334155] rounded-xl"
            >
              Metriche Stagionali in aggiornamento per {team.name}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
