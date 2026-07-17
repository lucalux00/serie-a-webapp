"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Target, ExternalLink, Calculator, AlertTriangle, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeamLogoUrl } from '@/utils/teamLogos';

export default function PronosticiPage() {
  const bookmakerName = "SNAI";
  const affiliateLink = "https://www.snai.it/";

  const [singlePredictions, setSinglePredictions] = useState<any[]>([]);
  const [bollette, setBollette] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBolletta, setExpandedBolletta] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Tutti');

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

  // Otteniamo la lista di campionati unici disponibili nelle previsioni attuali
  const availableCompetitions = useMemo(() => {
    const comps = new Set<string>();
    singlePredictions.forEach(p => {
        if (p.competition) comps.add(p.competition);
    });
    return ['Tutti', ...Array.from(comps)];
  }, [singlePredictions]);

  // Filtriamo le singole in base alla tab attiva
  const filteredPredictions = useMemo(() => {
      if (activeTab === 'Tutti') return singlePredictions;
      return singlePredictions.filter(p => p.competition === activeTab);
  }, [activeTab, singlePredictions]);

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
          <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Algoritmo Statistico</p>
        </div>
      </div>
      
      <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 p-3 rounded-lg flex items-start sm:items-center mb-6">
        <Info size={18} className="text-[#f59e0b] mr-3 mt-0.5 sm:mt-0 shrink-0" />
        <p className="text-xs text-[#f59e0b] font-medium leading-relaxed">
          <strong>Attenzione:</strong> Le analisi presenti in questa pagina sono prodotte da modelli matematici a solo scopo statistico e di studio. Non rappresentano in alcun modo un invito o un incitamento al gioco d'azzardo.
        </p>
      </div>

      <p className="text-sm text-[#cbd5e1] mb-6 bg-[#1E293B] p-4 rounded-xl border border-[#334155] shadow-sm">
        Scopri le elaborazioni statistiche esclusive generate dal nostro algoritmo MLOps. Naviga tra i maggiori campionati europei per esplorare le probabilità matematiche degli eventi.
      </p>

      {/* Tabs Scorrevoli */}
      {availableCompetitions.length > 1 && (
          <div className="flex overflow-x-auto hide-scrollbar mb-6 gap-2 pb-2">
              {availableCompetitions.map(tab => (
                  <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                          activeTab === tab 
                          ? 'bg-[#0EA5E9] text-white shadow-md shadow-[#0EA5E9]/20' 
                          : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155] hover:text-white'
                      }`}
                  >
                      {tab}
                  </button>
              ))}
          </div>
      )}

      {/* Singole */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-black text-white flex items-center">
            <Target className="text-[#10B981] mr-2" size={20} />
            Top Singole {activeTab !== 'Tutti' ? `- ${activeTab}` : ''}
        </h2>
        <span className="text-xs font-bold text-[#64748B] bg-[#1E293B] px-2 py-1 rounded-md">{filteredPredictions.length} match</span>
      </div>

      <div className="mb-10 space-y-3 min-h-[200px]">
        <AnimatePresence mode="popLayout">
            {filteredPredictions.length > 0 ? filteredPredictions.map((pred, i) => (
            <motion.div 
                key={pred.id || i} 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-[#1E293B] rounded-xl p-4 flex justify-between items-center border border-[#334155] shadow-sm relative overflow-hidden"
            >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981]" />
                <div className="pl-2 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                    <img src={getTeamLogoUrl(pred.match.split(' - ')[0])} alt="" loading="lazy" className="w-5 h-5 object-contain" />
                    <span className="font-black text-[#F8FAFC] text-sm leading-tight">{pred.match}</span>
                    {pred.match.split(' - ')[1] && <img src={getTeamLogoUrl(pred.match.split(' - ')[1])} alt="" loading="lazy" className="w-5 h-5 object-contain" />}
                </div>
                <div className="flex gap-3">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center">
                        <span className="bg-[#0F172A] px-1.5 py-0.5 rounded text-[#cbd5e1] mr-2">{pred.competition || 'Altro'}</span>
                        Esito: <span className="text-[#10B981] ml-1">{pred.pick}</span>
                    </div>
                </div>
                </div>
                <div className="bg-[#0F172A] px-3 py-2 rounded-lg border border-[#334155] min-w-[60px] text-center shrink-0">
                <span className="block text-[10px] text-[#64748B] font-bold uppercase mb-0.5">Quota</span>
                <span className="font-black text-white">{pred.odds.toFixed(2)}</span>
                </div>
            </motion.div>
            )) : (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-[#1E293B] p-6 text-center rounded-xl border border-[#334155] text-[#94A3B8] flex flex-col items-center justify-center"
            >
                <Target size={32} className="opacity-20 mb-3" />
                <p>Nessuna singola di valore trovata per questo campionato al momento.</p>
            </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Bollette */}
      <h2 className="text-lg font-black mb-4 text-white flex items-center">
        <Calculator className="text-[#0EA5E9] mr-2" size={20} />
        Le Bollette Globali
      </h2>
      <p className="text-xs text-[#94A3B8] mb-4">Le bollette mescolano i match di maggior valore di tutta Europa.</p>
      <div className="mb-8 space-y-4">
        {bollette.length > 0 ? bollette.map(bolletta => (
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
                        <div className="flex-1 overflow-hidden pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <img src={getTeamLogoUrl(m.match.split(' - ')[0])} alt="" loading="lazy" className="w-4 h-4 object-contain shrink-0" />
                            <span className="text-xs font-bold text-[#94A3B8] truncate">{m.match}</span>
                          </div>
                          <div className="flex items-center text-[10px]">
                            <span className="text-white font-bold mr-2">{m.pick}</span>
                            <span className="text-[#64748B]">{m.competition || 'Altro'}</span>
                          </div>
                        </div>
                        <div className="font-black text-[#10B981] shrink-0">{m.odds.toFixed(2)}</div>
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
        )) : (
            <div className="bg-[#1E293B] p-4 text-center rounded-xl border border-[#334155] text-white">Nessuna bolletta algoritmica disponibile.</div>
        )}
      </div>

      {/* Disclaimer Legale & Statistico */}
      <div className="bg-[#0F172A] border border-[#f59e0b]/30 p-5 rounded-xl text-center flex flex-col items-center mt-8">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#f59e0b] flex items-center justify-center bg-[#f59e0b]/10">
            <span className="text-[#f59e0b] font-black text-sm">+18</span>
          </div>
          <AlertTriangle className="text-[#f59e0b]" size={24} />
        </div>
        <h3 className="text-[#f59e0b] font-bold text-sm mb-2 uppercase tracking-widest">Avvertenza Legale e Scopo Statistico</h3>
        <p className="text-[11px] text-[#94A3B8] font-medium leading-relaxed max-w-[95%]">
          I contenuti forniti in questa pagina hanno uno scopo <strong>esclusivamente statistico, matematico e di intrattenimento</strong>. 
          Questa sezione non intende in alcun modo promuovere, incoraggiare o incitare al gioco d'azzardo, nel pieno rispetto del Decreto Dignità (DL 87/2018). 
          L'algoritmo si limita ad analizzare dati storici e quote di mercato per elaborare modelli probabilistici. 
          Ricordiamo che il gioco d'azzardo è <strong>vietato ai minori di 18 anni</strong> e può causare dipendenza patologica. Se decidi di giocare, fallo in modo responsabile e sui siti dei concessionari ufficiali ADM.
        </p>
      </div>
      
      {/* Stile per nascondere la scrollbar nativa nei tab */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
