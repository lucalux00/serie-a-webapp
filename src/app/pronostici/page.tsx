"use client";

import React, { useState, useEffect } from 'react';
import { Target, ExternalLink, Calculator, AlertTriangle, Info, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeamLogoUrl } from '@/utils/teamLogos';

export default function PronosticiPage() {
  const bookmakerName = "SNAI";
  const affiliateLink = "https://www.snai.it/";

  const [singlePredictions, setSinglePredictions] = useState<any[]>([]);
  const [bollette, setBollette] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBolletta, setExpandedBolletta] = useState<string | null>(null);

  useEffect(() => {
    async function loadPredictions() {
      try {
        const res = await fetch('/api/pronostici');
        if (res.ok) {
          const data = await res.json();
          setSinglePredictions(data.singlePredictions || []);
          setBollette(data.bollette || []);
        }
      } catch (error) {
        console.error("Failed to fetch predictions", error);
      } finally {
        setLoading(false);
      }
    }
    loadPredictions();
  }, []);

  const toggleBolletta = (id: string) => {
    if (expandedBolletta === id) {
      setExpandedBolletta(null);
    } else {
      setExpandedBolletta(id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] p-4 text-[#94A3B8]">
        <Loader2 className="animate-spin mb-4 text-[#0EA5E9]" size={40} />
        <p className="font-bold uppercase tracking-widest text-xs">Ricerca migliori quote in corso...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 p-4">
      <div className="flex items-center mb-4 mt-2">
        <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9] mr-3">
          <Target size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">I Pronostici</h1>
          <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Singole & Bollette</p>
        </div>
      </div>
      
      <p className="text-sm text-[#cbd5e1] mb-6 bg-[#1E293B] p-4 rounded-xl border border-[#334155] shadow-sm">
        Scopri le analisi statistiche esclusive e le combinazioni algoritmiche calcolate sulle partite e amichevoli in programma. Il nostro algoritmo confronta le probabilità implicite del mercato per estrarre le selezioni di maggior valore matematico.
      </p>

      {/* Singole */}
      <h2 className="text-lg font-black mb-4 text-white flex items-center">
        <Target className="text-[#10B981] mr-2" size={20} />
        Top 4 Singole Più Sicure
      </h2>
      <div className="mb-8 space-y-3">
        {singlePredictions.length > 0 ? singlePredictions.map((pred, i) => (
          <div key={pred.id || i} className="bg-[#1E293B] rounded-xl p-4 flex justify-between items-center border border-[#334155] shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981]" />
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-1.5">
                <img src={getTeamLogoUrl(pred.match.split(' - ')[0])} alt="" loading="lazy" className="w-5 h-5 object-contain" />
                <span className="font-black text-[#F8FAFC] text-sm">{pred.match}</span>
                {pred.match.split(' - ')[1] && <img src={getTeamLogoUrl(pred.match.split(' - ')[1])} alt="" loading="lazy" className="w-5 h-5 object-contain" />}
              </div>
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Esito: <span className="text-[#10B981]">{pred.pick}</span></div>
            </div>
            <div className="bg-[#0F172A] px-3 py-2 rounded-lg border border-[#334155] min-w-[60px] text-center">
              <span className="block text-[10px] text-[#64748B] font-bold uppercase mb-0.5">Quota</span>
              <span className="font-black text-white">{pred.odds.toFixed(2)}</span>
            </div>
          </div>
        )) : (
          <div className="bg-[#1E293B] p-4 text-center rounded-xl border border-[#334155] text-white">Nessuna singola trovata.</div>
        )}
      </div>

      {/* Bollette */}
      <h2 className="text-lg font-black mb-4 text-white flex items-center">
        <Calculator className="text-[#0EA5E9] mr-2" size={20} />
        Le Nostre Multiple
      </h2>
      <div className="mb-8 space-y-4">
        {bollette.map(bolletta => (
          <div key={bolletta.id} className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#334155] rounded-2xl shadow-xl overflow-hidden cursor-pointer" onClick={() => toggleBolletta(bolletta.id)}>
            <div className="p-5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">{bolletta.title}</h3>
                <p className="text-sm text-[#0EA5E9] font-bold mt-1">Quota Totale: {bolletta.totalOdds.toFixed(2)}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-white">
                {expandedBolletta === bolletta.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
            
            <AnimatePresence>
              {expandedBolletta === bolletta.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 border-t border-[#334155]/50 pt-4"
                >
                  <div className="space-y-3 mb-5">
                    {bolletta.matches.map((m: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-[#0F172A] p-3 rounded-lg border border-[#334155]/50">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <img src={getTeamLogoUrl(m.match.split(' - ')[0])} alt="" loading="lazy" className="w-4 h-4 object-contain" />
                            <span className="text-xs font-bold text-[#94A3B8]">{m.match}</span>
                            {m.match.split(' - ')[1] && <img src={getTeamLogoUrl(m.match.split(' - ')[1])} alt="" loading="lazy" className="w-4 h-4 object-contain" />}
                          </div>
                          <div className="font-bold text-white text-sm">{m.pick}</div>
                        </div>
                        <div className="font-black text-[#10B981]">{m.odds.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-5 bg-[#0B1120] p-3 rounded-xl border border-[#334155]/50">
                    <span className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Moltiplicatore Totale</span>
                    <span className="font-black text-xl text-[#10B981]">{bolletta.totalOdds.toFixed(2)}x</span>
                  </div>

                  <a 
                    href={affiliateLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center bg-[#0EA5E9] hover:bg-[#0284c7] text-white font-black py-4 rounded-xl active:scale-95 transition-transform shadow-lg group"
                  >
                    VERIFICA QUOTE SU {bookmakerName}
                    <ExternalLink size={18} className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Legale */}
      <div className="bg-[#0F172A] border border-[#334155]/50 p-4 rounded-xl text-center flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#64748B] flex items-center justify-center">
            <span className="text-[#64748B] font-black text-xs">+18</span>
          </div>
          <AlertTriangle className="text-[#64748B]" size={20} />
        </div>
        <p className="text-[10px] text-[#64748B] font-medium leading-relaxed max-w-[90%] uppercase tracking-wide">
          Riservato ai maggiori di 18 anni. Il gioco può causare dipendenza patologica. 
          Le quote indicate sono soggette a variazioni. Consulta le probabilità di vincita sul sito del concessionario ufficiale.
        </p>
      </div>
    </div>
  );
}
