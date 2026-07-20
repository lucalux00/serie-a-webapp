'use client';

import React from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface LiveCommentaryProps {
  teamName: string;
  /** Polling attivo solo quando il tab LIVE è selezionato */
  isActive?: boolean;
}

export default function LiveCommentary({ teamName, isActive = false }: LiveCommentaryProps) {
  // Polling ogni 30s solo quando il tab è visibile (isActive = true)
  const { data, error, isLoading } = useSWR(
    isActive ? `/api/live-match?team=${encodeURIComponent(teamName)}` : null,
    fetcher,
    { refreshInterval: isActive ? 30000 : 0, revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-[#EF4444] text-[10px] font-black uppercase animate-pulse tracking-widest">
          Ricerca match in corso...
        </span>
      </div>
    );
  }

  if (error || (data && data.error)) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📡</div>
        <p className="font-bold text-[#94A3B8]">Connessione Live interrotta</p>
        <p className="text-xs text-[#475569] mt-1">Impossibile recuperare la cronaca.</p>
      </div>
    );
  }

  const isLive = data?.isLive;
  const events = data?.events || [];

  if (!isLive) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3 opacity-50">🏟️</div>
        <p className="font-bold text-[#94A3B8]">Nessuna partita in corso</p>
        <p className="text-xs text-[#475569] mt-1">
          La diretta testuale sarà attiva durante i match ufficiali di {teamName}.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-4"
    >
      <div className="flex items-center justify-between bg-[#1E293B]/80 backdrop-blur-md border border-[#EF4444]/30 rounded-xl p-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EF4444]"></span>
          </span>
          <span className="text-[#EF4444] font-black uppercase tracking-widest text-sm drop-shadow-md">
            DIRETTA
          </span>
        </div>
        <div className="text-xs text-[#94A3B8] font-bold">
          {data.matchTitle || 'Match in corso'}
        </div>
      </div>

      <div className="relative pl-4 space-y-4 mt-6">
        <div className="absolute left-[21px] top-2 bottom-0 w-0.5 bg-gradient-to-b from-[#EF4444] to-[#334155]" />
        
        <AnimatePresence>
          {events.length > 0 ? (
            events.map((ev: any, idx: number) => {
              const isGoal = ev.text.toLowerCase().includes('gol') || ev.text.includes('⚽');
              const isCard = ev.text.toLowerCase().includes('cartellino') || ev.text.includes('🟨') || ev.text.includes('🟥');
              
              let dotColor = 'bg-[#64748B]';
              let ringColor = 'ring-[#1E293B]';
              
              if (isGoal) {
                dotColor = 'bg-[#10B981]';
                ringColor = 'ring-[#10B981]/30';
              } else if (isCard) {
                dotColor = 'bg-[#F59E0B]';
                ringColor = 'ring-[#F59E0B]/30';
              } else if (idx === 0) {
                dotColor = 'bg-[#EF4444]'; // L'ultimo evento in rosso
                ringColor = 'ring-[#EF4444]/30';
              }

              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative pl-8"
                >
                  <div className={`absolute left-[0px] top-1.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ${ringColor}`} />
                  
                  <div className="bg-[#1E293B]/60 backdrop-blur-sm border border-[#334155] rounded-xl p-3 shadow-sm hover:border-[#475569] transition-colors">
                    {ev.time && (
                      <span className="text-[10px] font-black text-[#EF4444] mb-1 block">
                        {ev.time}'
                      </span>
                    )}
                    <p className={`text-sm leading-relaxed ${isGoal ? 'font-bold text-white' : 'text-[#CBD5E1]'}`}>
                      {ev.text}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="pl-8 text-sm text-[#64748B] italic">In attesa di eventi...</div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
