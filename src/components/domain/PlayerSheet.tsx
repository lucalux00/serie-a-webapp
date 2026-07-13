"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, User, Target, ArrowRightLeft, ExternalLink, Shield } from 'lucide-react';

interface PlayerSheetProps {
  player: any;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function PlayerSheet({ player, onClose }: PlayerSheetProps) {
  const [realData, setRealData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (player && player.name) {
      setLoading(true);
      setRealData(null);
      const role = player.position || player.role || '';
      fetch(`/api/player?name=${encodeURIComponent(player.name)}&role=${encodeURIComponent(role)}`)
        .then(r => r.json())
        .then(data => {
          setRealData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [player]);

  const isGoalkeeper = realData?.stats?.isGoalkeeper;

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
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#1E293B] border-t border-[#334155] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#1E293B] px-6 py-4 border-b border-[#334155] flex justify-between items-center z-10 rounded-t-3xl">
              <div className="w-12 h-1.5 bg-[#334155] rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
              <div className="mt-2">
                <h2 className="text-xl font-black truncate pr-4">{player.name}</h2>
                <div className="text-[#10B981] font-bold uppercase tracking-widest text-xs">
                  {player.isStaff ? player.role : player.position}
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-[#334155] rounded-full text-white mt-2 shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Info Base */}
              {!player.isStaff && (
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#0EA5E9] flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
                    {player.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-3 text-sm text-[#94A3B8] font-semibold">
                      {player.age && <span>{player.age} anni</span>}
                      {player.height && <><span>•</span><span>{player.height} cm</span></>}
                      {player.weight && <><span>•</span><span>{player.weight} kg</span></>}
                    </div>
                    {realData?.anagrafica && (
                      <div className="text-[11px] text-[#64748B] mt-1 font-semibold">
                        {realData.anagrafica.dataNascita && (
                          <span>Nato il {realData.anagrafica.dataNascita}</span>
                        )}
                        {realData.anagrafica.luogoNascita && realData.anagrafica.luogoNascita !== 'Non disponibile' && (
                          <span> a {realData.anagrafica.luogoNascita}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prestito */}
              {player.status === 'In Prestito' && player.loanDetails && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center text-[#F59E0B] font-bold uppercase text-xs">
                    <ArrowRightLeft size={14} className="mr-2" /> Dettagli Prestito
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Destinazione:</span>
                    <span className="font-bold text-white">{player.loanDetails.toTeam}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Formula:</span>
                    <span className="font-bold text-white">{player.loanDetails.type}</span>
                  </div>
                  {player.loanDetails.fee && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Costo:</span>
                      <span className="font-black text-[#10B981]">{player.loanDetails.fee}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Loader */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[#94A3B8] text-sm mt-4 font-bold animate-pulse">Ricerca dati su Wikipedia...</span>
                </div>
              )}

              {/* Dati Reali */}
              {!loading && realData && (
                <>
                  {/* STATISTICHE - 3 sezioni */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#94A3B8] border-b border-[#334155] pb-1">Statistiche</h3>

                    {/* Carriera Club */}
                    <div className="bg-[#0F172A] rounded-xl border border-[#334155] p-4">
                      <div className="text-[9px] text-[#10B981] font-black uppercase tracking-widest mb-3">Carriera Club Totale</div>
                      <div className="flex justify-around text-center">
                        <div>
                          <div className="text-2xl font-black text-white">{realData.stats?.carriera?.presenze ?? '—'}</div>
                          <div className="text-[9px] text-[#64748B] uppercase font-bold mt-0.5">Presenze</div>
                        </div>
                        <div className="w-px bg-[#334155]" />
                        <div>
                          <div className="text-2xl font-black text-white">
                            {isGoalkeeper ? '—' : (realData.stats?.carriera?.gol ?? '—')}
                          </div>
                          <div className="text-[9px] text-[#64748B] uppercase font-bold mt-0.5">
                            {isGoalkeeper ? 'Portiere' : 'Gol'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Squadra Attuale */}
                    {(realData.stats?.squadraAttuale?.presenze > 0) && (
                      <div className="bg-[#0F172A] rounded-xl border border-[#0EA5E9]/40 p-4">
                        <div className="text-[9px] text-[#0EA5E9] font-black uppercase tracking-widest mb-3">
                          Ultima Stagione {realData.stats?.squadraAttuale?.nome ? `· ${realData.stats.squadraAttuale.nome}` : ''}
                        </div>
                        <div className="flex justify-around text-center">
                          <div>
                            <div className="text-2xl font-black text-white">{realData.stats?.squadraAttuale?.presenze ?? '—'}</div>
                            <div className="text-[9px] text-[#64748B] uppercase font-bold mt-0.5">Presenze</div>
                          </div>
                          <div className="w-px bg-[#334155]" />
                          <div>
                            <div className="text-2xl font-black text-white">
                              {isGoalkeeper ? '—' : (realData.stats?.squadraAttuale?.gol ?? '—')}
                            </div>
                            <div className="text-[9px] text-[#64748B] uppercase font-bold mt-0.5">
                              {isGoalkeeper ? 'Portiere' : 'Gol'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nazionale */}
                    {realData.stats?.nazionale?.presenze > 0 && (
                      <div className="bg-[#0F172A] rounded-xl border border-[#F59E0B]/30 p-4">
                        <div className="text-[9px] text-[#F59E0B] font-black uppercase tracking-widest mb-3 flex items-center">
                          <Shield size={10} className="mr-1.5" /> Nazionale
                        </div>
                        <div className="flex justify-around text-center">
                          <div>
                            <div className="text-2xl font-black text-white">{realData.stats?.nazionale?.presenze ?? '—'}</div>
                            <div className="text-[9px] text-[#64748B] uppercase font-bold mt-0.5">Presenze</div>
                          </div>
                          <div className="w-px bg-[#334155]" />
                          <div>
                            <div className="text-2xl font-black text-white">
                              {isGoalkeeper ? '—' : (realData.stats?.nazionale?.gol ?? '—')}
                            </div>
                            <div className="text-[9px] text-[#64748B] uppercase font-bold mt-0.5">
                              {isGoalkeeper ? 'Portiere' : 'Gol'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Biografia */}
                  {realData.biografia && realData.biografia.length > 30 && (
                    <div className="bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden">
                      <div className="bg-[#334155]/30 px-4 py-2 border-b border-[#334155] font-bold text-xs uppercase tracking-wider text-[#94A3B8]">
                        Biografia
                      </div>
                      <div className="p-4 text-sm text-[#94A3B8] leading-relaxed">
                        {realData.biografia}
                      </div>
                    </div>
                  )}

                  {/* Caratteristiche */}
                  {realData.caratteristiche && realData.caratteristiche.length > 30 && (
                    <div className="bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden">
                      <div className="bg-[#334155]/30 px-4 py-2 border-b border-[#334155] font-bold text-xs uppercase tracking-wider text-[#94A3B8]">
                        Caratteristiche Tecniche
                      </div>
                      <div className="p-4 text-sm text-[#94A3B8] leading-relaxed">
                        {realData.caratteristiche}
                      </div>
                    </div>
                  )}

                  {/* Profilo Economico */}
                  <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-5 rounded-2xl border border-[#334155]">
                    <h3 className="font-bold text-[#F8FAFC] mb-4 flex items-center text-sm">
                      <User size={16} className="mr-2 text-[#10B981]" /> Profilo Economico
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-[#334155] pb-3">
                        <span className="text-[#94A3B8] text-[10px] uppercase font-black tracking-wider">Valore di Mercato</span>
                        <span className="font-black text-[#10B981]">{realData.marketValue}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#334155] pb-3">
                        <span className="text-[#94A3B8] text-[10px] uppercase font-black tracking-wider">Stipendio Annuo Netto</span>
                        <span className="font-black text-[#0EA5E9]">{realData.salary}</span>
                      </div>

                      {realData.instagram ? (
                        <a
                          href={realData.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 via-red-500 to-yellow-500 text-white font-black py-3 rounded-xl active:scale-95 transition-transform shadow-lg text-sm"
                        >
                          <ExternalLink size={16} /> Instagram Ufficiale
                        </a>
                      ) : (
                        <div className="text-center text-[10px] text-[#475569] font-black uppercase tracking-widest bg-[#0F172A] py-3 rounded-xl border border-[#334155]">
                          Instagram non trovato
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
