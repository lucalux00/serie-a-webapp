"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Flag, Briefcase, TrendingUp, Star } from 'lucide-react';

interface PlayerSheetProps {
  player: any;
  onClose: () => void;
}

const positionColors: Record<string, string> = {
  POR: 'from-[#6366F1] to-[#4F46E5]',
  DIF: 'from-[#10B981] to-[#059669]',
  CEN: 'from-[#0EA5E9] to-[#0284C7]',
  ATT: 'from-[#EF4444] to-[#DC2626]',
};

export default function PlayerSheet({ player, onClose }: PlayerSheetProps) {
  const [wikiData, setWikiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!player) {
      setWikiData(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setWikiData(null);
    setError(false);

    const role = player.position || player.role || '';
    fetch(`/api/player?name=${encodeURIComponent(player.name)}&role=${encodeURIComponent(role)}`)
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        setWikiData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [player]);

  const gradientClass = positionColors[player?.position] || 'from-[#334155] to-[#1E293B]';

  const renderStat = (label: string, value: any, unit?: string) => (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-black text-white">
        {value !== undefined && value !== null && value !== 0 ? value : '—'}
        {value && unit ? <span className="text-sm font-bold text-[#64748B] ml-0.5">{unit}</span> : null}
      </div>
      <div className="text-[9px] text-[#64748B] uppercase font-bold mt-0.5 text-center">{label}</div>
    </div>
  );

  return (
    <AnimatePresence>
      {player && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[92vh] bg-[#0B1120] border-t border-[#334155] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] z-50 flex flex-col"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-[#334155] rounded-full absolute top-2 left-1/2 -translate-x-1/2 z-10" />

            {/* Hero Header */}
            <div className={`bg-gradient-to-br ${gradientClass} px-6 pt-7 pb-5 rounded-t-3xl flex items-end justify-between shrink-0`}>
              <div className="flex-1">
                <div className="text-[10px] text-white/60 uppercase font-black tracking-widest mb-1">
                  {player.isStaff ? player.role : player.position}
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">{player.name}</h2>
                {wikiData?.anagrafica?.nazionalita && (
                  <div className="flex items-center mt-1.5 text-white/70 text-xs font-semibold">
                    <Flag size={11} className="mr-1" />
                    {wikiData.anagrafica.nazionalita}
                  </div>
                )}
              </div>
              {!player.isStaff && (
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-black text-white shadow-lg ml-4 shrink-0">
                  {player.number || '?'}
                </div>
              )}
              <button onClick={onClose} className="absolute top-5 right-4 p-2 bg-black/20 rounded-full text-white">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar flex-1 pb-8">
              
              {/* Info Anagrafiche */}
              <div className="px-5 py-4 flex gap-3 flex-wrap">
                {player.age && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-center min-w-[70px]">
                    <div className="text-sm font-black text-white">{player.age}</div>
                    <div className="text-[9px] text-[#64748B] uppercase font-bold">Età</div>
                  </div>
                )}
                {player.height && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-center min-w-[70px]">
                    <div className="text-sm font-black text-white">{player.height}</div>
                    <div className="text-[9px] text-[#64748B] uppercase font-bold">Altezza</div>
                  </div>
                )}
                {player.weight && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-center min-w-[70px]">
                    <div className="text-sm font-black text-white">{player.weight}</div>
                    <div className="text-[9px] text-[#64748B] uppercase font-bold">Peso</div>
                  </div>
                )}
                {player.foot && player.foot !== 'N/A' && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-center min-w-[70px]">
                    <div className="text-sm font-black text-white">{player.foot}</div>
                    <div className="text-[9px] text-[#64748B] uppercase font-bold">Piede</div>
                  </div>
                )}
                {wikiData?.anagrafica?.dataNascita && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-center">
                    <div className="text-sm font-black text-white">{wikiData.anagrafica.dataNascita}</div>
                    <div className="text-[9px] text-[#64748B] uppercase font-bold">Nascita</div>
                  </div>
                )}
                {wikiData?.anagrafica?.luogoNascita && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-center">
                    <div className="text-sm font-black text-white">{wikiData.anagrafica.luogoNascita}</div>
                    <div className="text-[9px] text-[#64748B] uppercase font-bold">Luogo</div>
                  </div>
                )}
              </div>

              {/* Loading / Error state */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-3 border-[#10B981] border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-[#64748B] text-xs font-bold uppercase tracking-widest animate-pulse">Caricamento statistiche...</span>
                </div>
              )}

              {!loading && !error && wikiData && (
                <div className="px-5 space-y-4">

                  {/* STATS: Squadra Attuale */}
                  {!player.isStaff && (
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
                      <div className="bg-[#10B981]/10 border-b border-[#334155] px-4 py-2 flex items-center">
                        <TrendingUp size={13} className="mr-2 text-[#10B981]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">Stagione Corrente</span>
                      </div>
                      <div className="flex justify-around p-4">
                        {renderStat('Presenze', player.stats?.appearances)}
                        <div className="w-px bg-[#334155]" />
                        {renderStat(player.position === 'POR' ? 'Portiere' : 'Gol', player.position === 'POR' ? '—' : player.stats?.goals)}
                      </div>
                    </div>
                  )}

                  {/* STATS: Carriera Totale (da Wikipedia) */}
                  {!player.isStaff && wikiData.stats?.carriera && (
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
                      <div className="bg-[#0EA5E9]/10 border-b border-[#334155] px-4 py-2 flex items-center">
                        <Briefcase size={13} className="mr-2 text-[#0EA5E9]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0EA5E9]">Carriera Club (Totale)</span>
                      </div>
                      <div className="flex justify-around p-4">
                        {renderStat('Presenze', wikiData.stats.carriera.presenze > 0 ? wikiData.stats.carriera.presenze : null)}
                        <div className="w-px bg-[#334155]" />
                        {renderStat(wikiData.stats.isGoalkeeper ? 'Portiere' : 'Gol', wikiData.stats.isGoalkeeper ? '—' : (wikiData.stats.carriera.gol > 0 ? wikiData.stats.carriera.gol : null))}
                      </div>
                    </div>
                  )}

                  {/* STATS: Nazionale */}
                  {!player.isStaff && wikiData.stats?.nazionale && (wikiData.stats.nazionale.presenze > 0 || wikiData.stats.nazionale.gol > 0) && (
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
                      <div className="bg-[#F59E0B]/10 border-b border-[#334155] px-4 py-2 flex items-center">
                        <Flag size={13} className="mr-2 text-[#F59E0B]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">Nazionale</span>
                      </div>
                      <div className="flex justify-around p-4">
                        {renderStat('Caps', wikiData.stats.nazionale.presenze > 0 ? wikiData.stats.nazionale.presenze : null)}
                        <div className="w-px bg-[#334155]" />
                        {renderStat(wikiData.stats.isGoalkeeper ? '—' : 'Gol', wikiData.stats.isGoalkeeper ? '—' : (wikiData.stats.nazionale.gol > 0 ? wikiData.stats.nazionale.gol : null))}
                      </div>
                    </div>
                  )}

                  {/* Biografia */}
                  {wikiData.biografia && wikiData.biografia.length > 30 && !wikiData.biografia.includes('Nessuna biografia') && (
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
                      <div className="bg-[#334155]/30 px-4 py-2 border-b border-[#334155] flex items-center">
                        <User size={13} className="mr-2 text-[#94A3B8]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Biografia</span>
                      </div>
                      <div className="p-4 text-sm text-[#94A3B8] leading-relaxed">
                        {wikiData.biografia}
                      </div>
                    </div>
                  )}

                  {/* Caratteristiche Tecniche */}
                  {wikiData.caratteristiche && wikiData.caratteristiche.length > 30 && (
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
                      <div className="bg-[#334155]/30 px-4 py-2 border-b border-[#334155] flex items-center">
                        <Star size={13} className="mr-2 text-[#F59E0B]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Caratteristiche Tecniche</span>
                      </div>
                      <div className="p-4 text-sm text-[#94A3B8] leading-relaxed">
                        {wikiData.caratteristiche}
                      </div>
                    </div>
                  )}

                  {/* Profilo Economico */}
                  {(player.marketValue || player.salary || player.contractUntil || wikiData.marketValue) && (
                    <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-5 rounded-2xl border border-[#334155]">
                      <h3 className="font-bold text-[#F8FAFC] mb-4 flex items-center text-sm">
                        <User size={16} className="mr-2 text-[#10B981]" /> Profilo Economico
                      </h3>
                      <div className="space-y-3">
                        {(player.marketValue || wikiData.marketValue) && (
                          <div className="flex justify-between items-center border-b border-[#334155] pb-3">
                            <span className="text-[#94A3B8] text-[10px] uppercase font-black tracking-wider">Valore di Mercato</span>
                            <span className="font-black text-[#10B981]">{player.marketValue || wikiData.marketValue}</span>
                          </div>
                        )}
                        {(player.salary || wikiData.salary) && (
                          <div className="flex justify-between items-center border-b border-[#334155] pb-3">
                            <span className="text-[#94A3B8] text-[10px] uppercase font-black tracking-wider">Stipendio Annuo Netto</span>
                            <span className="font-black text-[#0EA5E9]">{player.salary || wikiData.salary}</span>
                          </div>
                        )}
                        {player.contractUntil && (
                          <div className="flex justify-between items-center">
                            <span className="text-[#94A3B8] text-[10px] uppercase font-black tracking-wider">Scadenza Contratto</span>
                            <span className="font-black text-white">{player.contractUntil}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dati locali se wiki non ha caricato bene */}
              {!loading && !wikiData && !error && player && (
                <div className="px-5 space-y-4">
                  {!player.isStaff && player.stats && (
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4">
                      <div className="flex justify-around">
                        {renderStat('Presenze', player.stats.appearances)}
                        <div className="w-px bg-[#334155]" />
                        {renderStat('Gol', player.position === 'POR' ? '—' : player.stats.goals)}
                      </div>
                    </div>
                  )}
                  {player.biography && player.biography.length > 5 && (
                    <div className="p-4 bg-[#1E293B] rounded-2xl border border-[#334155] text-sm text-[#94A3B8]">
                      {player.biography}
                    </div>
                  )}
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="px-5 py-6">
                  <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-center">
                    <p className="text-[#EF4444] font-bold text-sm">Impossibile caricare dati da Wikipedia.</p>
                    <p className="text-[#94A3B8] text-xs mt-1">Controlla la connessione e riprova.</p>
                  </div>
                  {/* Mostra almeno i dati locali */}
                  {player.stats && (
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 mt-4">
                      <div className="flex justify-around">
                        {renderStat('Presenze', player.stats.appearances)}
                        <div className="w-px bg-[#334155]" />
                        {renderStat('Gol', player.position === 'POR' ? '—' : player.stats.goals)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
