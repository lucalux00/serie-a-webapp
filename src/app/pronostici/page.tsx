"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Target, ExternalLink, Calculator, AlertTriangle, Loader2, ChevronDown, ChevronUp, Info, CalendarClock, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeamLogoUrl } from '@/utils/teamLogos';

export default function PronosticiPage() {
  const bookmakerName = "SNAI";
  const affiliateLink = "https://www.snai.it/";

  const [mainTab, setMainTab] = useState<'odierni' | 'mlops'>('odierni');

  // MLOps State
  const [singlePredictions, setSinglePredictions] = useState<any[]>([]);
  const [bollette, setBollette] = useState<any[]>([]);
  const [loadingMlops, setLoadingMlops] = useState(false);
  const [expandedBolletta, setExpandedBolletta] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Tutti');
  const [mlopsLoaded, setMlopsLoaded] = useState(false);

  // Odierni State
  const [dailyPredictions, setDailyPredictions] = useState<any[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);

  // Spiegazioni MLOps
  const [expandedMlopsAnalysis, setExpandedMlopsAnalysis] = useState<string | null>(null);
  const [mlopsExplanations, setMlopsExplanations] = useState<Record<string, {text: string, loading: boolean}>>({});

  // Fetch Odierni (Default)
  useEffect(() => {
    async function loadDaily() {
      try {
        const res = await fetch('/api/pronostici/odierni');
        if (res.ok) {
          const data = await res.json();
          setDailyPredictions(data.predictions || []);
        }
      } catch (error) {
        console.error("Failed to fetch daily", error);
      } finally {
        setLoadingDaily(false);
      }
    }
    loadDaily();
  }, []);

  // Fetch MLOps when selected
  useEffect(() => {
    if (mainTab === 'mlops' && !mlopsLoaded) {
      setLoadingMlops(true);
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
          setLoadingMlops(false);
          setMlopsLoaded(true);
        }
      }
      loadPredictions();
    }
  }, [mainTab, mlopsLoaded]);

  const toggleBolletta = (id: string) => {
    setExpandedBolletta(prev => prev === id ? null : id);
  };

  const toggleAnalysis = (id: number) => {
    setExpandedAnalysis(prev => prev === id ? null : id);
  };

  const toggleMlopsAnalysis = async (pred: any) => {
    if (expandedMlopsAnalysis === pred.id) {
      setExpandedMlopsAnalysis(null);
      return;
    }
    setExpandedMlopsAnalysis(pred.id);
    
    if (!mlopsExplanations[pred.id]) {
      setMlopsExplanations(prev => ({ ...prev, [pred.id]: { text: '', loading: true } }));
      try {
        const res = await fetch(`/api/pronostici/spiegazione?match_id=${pred.id}&match=${encodeURIComponent(pred.match)}&pick=${encodeURIComponent(pred.pick)}`);
        const data = await res.json();
        setMlopsExplanations(prev => ({ ...prev, [pred.id]: { text: data.analysis || 'Analisi non disponibile.', loading: false } }));
      } catch (err) {
        setMlopsExplanations(prev => ({ ...prev, [pred.id]: { text: 'Errore nel caricamento.', loading: false } }));
      }
    }
  };

  const availableCompetitions = useMemo(() => {
    const comps = new Set<string>();
    singlePredictions.forEach(p => {
        if (p.competition) comps.add(p.competition);
    });
    return ['Tutti', ...Array.from(comps)];
  }, [singlePredictions]);

  const filteredPredictions = useMemo(() => {
      if (activeTab === 'Tutti') return singlePredictions;
      return singlePredictions.filter(p => p.competition === activeTab);
  }, [activeTab, singlePredictions]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 p-4">
      <div className="flex items-center mb-6 mt-2">
        <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9] mr-3">
          <Target size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">I Pronostici</h1>
          <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Algoritmo Statistico</p>
        </div>
      </div>
      
      {/* Selector Tabs */}
      <div className="flex bg-[#1E293B] p-1 rounded-2xl mb-6 shadow-sm border border-[#334155]">
        <button 
          onClick={() => setMainTab('odierni')}
          className={`flex-1 flex items-center justify-center py-3 rounded-xl font-black text-sm transition-all ${mainTab === 'odierni' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <CalendarClock className="w-4 h-4 mr-2" />
          Prossimi Match
        </button>
        <button 
          onClick={() => setMainTab('mlops')}
          className={`flex-1 flex items-center justify-center py-3 rounded-xl font-black text-sm transition-all ${mainTab === 'mlops' ? 'bg-[#0EA5E9] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <BrainCircuit className="w-4 h-4 mr-2" />
          Singole & Multiple
        </button>
      </div>

      <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 p-3 rounded-lg flex items-start sm:items-center mb-6">
        <Info size={18} className="text-[#f59e0b] mr-3 mt-0.5 sm:mt-0 shrink-0" />
        <p className="text-xs text-[#f59e0b] font-medium leading-relaxed">
          <strong>Attenzione:</strong> Le analisi presenti in questa pagina sono prodotte da modelli matematici a solo scopo statistico. Non rappresentano un incitamento al gioco d'azzardo.
        </p>
      </div>

      {/* ----------- SEZIONE ODIERNI ----------- */}
      {mainTab === 'odierni' && (
        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-black text-white mb-2 flex items-center">
              <CalendarClock className="text-[#10B981] mr-2" size={24} />
              In Programma
            </h2>
            <p className="text-sm text-[#cbd5e1] mb-6">
              Scopri le 6 quote chiave e l'analisi avanzata del nostro algoritmo per i prossimi grandi match in calendario.
            </p>

            {loadingDaily ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-[#10B981] w-10 h-10 mb-4" />
                <p className="text-[#94A3B8] font-bold text-sm">Elaborazione analisi in corso (potrebbe richiedere qualche secondo)...</p>
              </div>
            ) : dailyPredictions.length === 0 ? (
              <div className="bg-[#1E293B] p-8 text-center rounded-2xl border border-[#334155]">
                <CalendarClock className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg">Nessuna partita a breve</h3>
                <p className="text-[#94A3B8] text-sm mt-2">I campionati supportati sono in pausa. Torna a visitare la pagina nei prossimi giorni.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dailyPredictions.map((match) => (
                  <div key={match.id} className="bg-[#1E293B] border border-[#334155] rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-[#334155]/50 bg-gradient-to-r from-[#1E293B] to-[#0F172A]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-1 rounded-full">
                          {match.competition}
                        </span>
                        <span className="text-xs text-[#94A3B8] font-bold bg-[#0F172A] px-2 py-1 rounded-lg">
                          {formatDate(match.date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center space-x-6 py-2">
                        <div className="flex flex-col items-center">
                          <img src={getTeamLogoUrl(match.match.split(' - ')[0])} className="w-12 h-12 object-contain mb-2" alt="Home" />
                          <span className="text-white font-bold text-sm text-center line-clamp-1 w-24">{match.match.split(' - ')[0]}</span>
                        </div>
                        <div className="text-2xl font-black text-[#64748B]">VS</div>
                        <div className="flex flex-col items-center">
                          <img src={getTeamLogoUrl(match.match.split(' - ')[1])} className="w-12 h-12 object-contain mb-2" alt="Away" />
                          <span className="text-white font-bold text-sm text-center line-clamp-1 w-24">{match.match.split(' - ')[1] || 'Avversario'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <h4 className="text-xs font-black text-[#94A3B8] uppercase tracking-widest mb-3 text-center">Le 6 Quote Consigliate</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {match.quotes?.map((q: any, i: number) => (
                          <div key={i} className="bg-[#0F172A] border border-[#334155] rounded-xl p-3 flex flex-col justify-between items-center text-center">
                            <span className="text-[10px] text-[#94A3B8] uppercase font-bold mb-1">{q.type}</span>
                            <span className="text-sm text-white font-bold bg-[#1E293B] px-3 py-1 rounded-lg mb-1 w-full truncate">{q.pick}</span>
                            <span className="text-lg font-black text-[#10B981]">{Number(q.odds).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => toggleAnalysis(match.id)}
                        className="w-full flex items-center justify-center py-3 bg-[#0F172A] hover:bg-[#334155] text-white rounded-xl border border-[#334155] transition-colors font-bold text-sm"
                      >
                        <BrainCircuit className="w-4 h-4 mr-2 text-[#0EA5E9]" />
                        {expandedAnalysis === match.id ? 'Chiudi Analisi' : 'Leggi Analisi Completa'}
                        {expandedAnalysis === match.id ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
                      </button>

                      <AnimatePresence>
                        {expandedAnalysis === match.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4"
                          >
                            <div className="p-4 bg-[#0F172A] rounded-xl border border-[#0EA5E9]/20 text-[#cbd5e1] text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: match.analysis }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ----------- SEZIONE MLOPS ----------- */}
      {mainTab === 'mlops' && (
        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white flex items-center">
                <BrainCircuit className="text-[#0EA5E9] mr-2" size={24} />
                Modello Statistico
              </h2>
              <a href="/pronostici/storico" className="bg-[#1E293B] border border-[#334155] hover:border-[#10B981] text-[#10B981] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center transition-colors">
                <Calculator size={14} className="mr-2" />
                Vedi ROI
              </a>
            </div>

            {loadingMlops ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#0EA5E9]" size={40} /></div>
            ) : (
              <>
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

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-white flex items-center">
                      <Target className="text-[#10B981] mr-2" size={20} />
                      Top Singole {activeTab !== 'Tutti' ? `- ${activeTab}` : ''}
                  </h3>
                  <span className="text-xs font-bold text-[#64748B] bg-[#1E293B] px-2 py-1 rounded-md">{filteredPredictions.length} match</span>
                </div>

                <div className="mb-10 space-y-3 min-h-[200px]">
                  <AnimatePresence mode="popLayout">
                      {filteredPredictions.length > 0 ? filteredPredictions.map((pred, i) => (
                      <motion.div 
                          key={pred.id || i} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-[#1E293B] rounded-xl border border-[#334155] shadow-sm relative overflow-hidden"
                      >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981]" />
                          <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#334155]/40 transition-colors" onClick={() => toggleMlopsAnalysis(pred)}>
                            <div className="pl-2 flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                  <img src={getTeamLogoUrl(pred.match.split(' - ')[0])} alt="" loading="lazy" className="w-5 h-5 object-contain" />
                                  <span className="font-black text-[#F8FAFC] text-sm leading-tight">{pred.match}</span>
                                  {pred.match.split(' - ')[1] && <img src={getTeamLogoUrl(pred.match.split(' - ')[1])} alt="" loading="lazy" className="w-5 h-5 object-contain" />}
                              </div>
                              <div className="flex gap-3">
                                  <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center flex-wrap gap-2">
                                      <span className="bg-[#0F172A] px-1.5 py-0.5 rounded text-[#cbd5e1]">{pred.competition || 'Altro'}</span>
                                      {pred.commence_time && <span className="bg-[#0F172A] px-1.5 py-0.5 rounded text-[#cbd5e1]">{formatDate(pred.commence_time)}</span>}
                                      <span>Esito: <span className="text-[#10B981]">{pred.pick}</span></span>
                                  </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="bg-[#0F172A] px-3 py-2 rounded-lg border border-[#334155] min-w-[60px] text-center shrink-0">
                                <span className="block text-[10px] text-[#64748B] font-bold uppercase mb-0.5">Quota</span>
                                <span className="font-black text-white">{pred.odds.toFixed(2)}</span>
                              </div>
                              <div className="w-6 flex justify-center text-[#94A3B8]">
                                {expandedMlopsAnalysis === pred.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedMlopsAnalysis === pred.id && (
                               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#334155]/50 p-4 bg-[#0F172A]/50">
                                  {mlopsExplanations[pred.id]?.loading ? (
                                     <div className="flex flex-col items-center justify-center py-4">
                                       <Loader2 className="animate-spin text-[#10B981] mb-2" size={24} />
                                       <span className="text-xs text-[#94A3B8] font-bold">Generazione Analisi in corso...</span>
                                     </div>
                                  ) : (
                                     <div className="prose prose-invert text-sm text-[#cbd5e1] leading-relaxed max-w-none" dangerouslySetInnerHTML={{ __html: mlopsExplanations[pred.id]?.text }} />
                                  )}
                               </motion.div>
                            )}
                          </AnimatePresence>
                      </motion.div>
                      )) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1E293B] p-6 text-center rounded-xl border border-[#334155] text-[#94A3B8] flex flex-col items-center justify-center">
                          <Target size={32} className="opacity-20 mb-3" />
                          <p>Nessuna singola trovata al momento.</p>
                      </motion.div>
                      )}
                  </AnimatePresence>
                </div>

                <h3 className="text-lg font-black mb-4 text-white flex items-center">
                  <Calculator className="text-[#0EA5E9] mr-2" size={20} />
                  Le Bollette Globali
                </h3>
                <div className="mb-8 space-y-4">
                  {bollette.length > 0 ? bollette.map(bolletta => (
                    <div key={bolletta.id} className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#334155] rounded-2xl shadow-xl overflow-hidden cursor-pointer" onClick={() => toggleBolletta(bolletta.id)}>
                      <div className="p-5 flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-black text-white">{bolletta.title}</h4>
                          <p className="text-sm text-[#0EA5E9] font-bold mt-1">Quota Totale: {bolletta.totalOdds.toFixed(2)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-white">
                          {expandedBolletta === bolletta.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedBolletta === bolletta.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-5 border-t border-[#334155]/50 pt-4">
                            <div className="space-y-3 mb-5">
                              {bolletta.matches.map((m: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-[#0F172A] p-3 rounded-lg border border-[#334155]/50">
                                  <div className="flex-1 overflow-hidden pr-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-[#94A3B8] truncate">{m.match}</span>
                                    </div>
                                    <div className="flex items-center text-[10px] gap-2">
                                      <span className="text-white font-bold">{m.pick}</span>
                                      {m.commence_time && <span className="text-[#64748B]">{formatDate(m.commence_time)}</span>}
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
                            <a href={affiliateLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center bg-[#0EA5E9] text-white font-black py-4 rounded-xl shadow-lg">
                              VERIFICA QUOTE SU {bookmakerName} <ExternalLink size={18} className="ml-2" />
                            </a>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )) : (
                      <div className="bg-[#1E293B] p-4 text-center rounded-xl border border-[#334155] text-white">Nessuna bolletta disponibile.</div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Disclaimer */}
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
          Questa sezione non intende promuovere al gioco d'azzardo. Il gioco è <strong>vietato ai minori di 18 anni</strong>.
        </p>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
