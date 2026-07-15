"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Flag, Briefcase, TrendingUp, Star, Award, CalendarDays, Euro, Activity } from 'lucide-react';

interface PlayerSheetProps {
  player: any;
  teamName: string;
  onClose: () => void;
}

const positionColors: Record<string, string> = {
  POR: 'from-[#6366F1] to-[#4F46E5]',
  DIF: 'from-[#10B981] to-[#059669]',
  CEN: 'from-[#0EA5E9] to-[#0284C7]',
  ATT: 'from-[#EF4444] to-[#DC2626]',
};

export default function PlayerSheet({ player, teamName, onClose }: PlayerSheetProps) {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!player) {
      setAiData(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setAiData(null);
    setError(false);

    const role = player.position || player.role || '';
    const encodedName = encodeURIComponent(player.name);
    const encodedRole = encodeURIComponent(role);
    const encodedTeam = encodeURIComponent(teamName || '');

    fetch(`/api/player?name=${encodedName}&role=${encodedRole}&team=${encodedTeam}`)
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        setAiData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [player, teamName]);

  const gradientClass = positionColors[player?.position] || 'from-[#334155] to-[#1E293B]';

  const renderStatBox = (label: string, value: any, unit?: string, icon?: React.ReactNode, colorClass = "text-white") => (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
      {icon && <div className="absolute top-2 right-2 opacity-10">{icon}</div>}
      <div className={`text-2xl font-black ${colorClass} mb-1 drop-shadow-sm`}>
        {value !== undefined && value !== null ? value : '—'}
        {value && unit ? <span className="text-xs font-bold text-[#64748B] ml-1">{unit}</span> : null}
      </div>
      <div className="text-[10px] text-[#94A3B8] uppercase font-black tracking-widest">{label}</div>
    </div>
  );

  return (
    <AnimatePresence>
      {player && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-md z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[92vh] bg-[#0B1120] border-t border-[#334155] rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-50 flex flex-col"
          >
            {/* Handle */}
            <div className="w-14 h-1.5 bg-[#475569] rounded-full absolute top-3 left-1/2 -translate-x-1/2 z-10" />

            {/* Hero Header */}
            <div className={`bg-gradient-to-br ${gradientClass} px-8 pt-10 pb-8 rounded-t-[40px] flex items-end justify-between shrink-0 relative overflow-hidden shadow-inner`}>
              <div className="absolute -right-10 -bottom-10 opacity-10 text-[180px] font-black">
                {player.number || (player.isStaff ? 'S' : 'M')}
              </div>
              <div className="flex-1 relative z-10">
                <div className="text-xs text-white/70 uppercase font-black tracking-[0.2em] mb-2 flex items-center">
                  <span className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm mr-2 border border-white/10">
                    {player.isStaff ? player.role : player.position}
                  </span>
                  {aiData?.anagrafica?.nazionalita && (
                    <span className="flex items-center text-white/90">
                      <Flag size={12} className="mr-1" /> {aiData.anagrafica.nazionalita}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-black text-white leading-none drop-shadow-md">{player.name}</h2>
              </div>
              {!player.isStaff && (
                <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-black text-white shadow-xl ml-4 shrink-0 relative z-10">
                  {player.number || '?'}
                </div>
              )}
              <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-black/20 hover:bg-black/40 transition-colors rounded-full text-white backdrop-blur-sm z-20">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar flex-1 pb-10 bg-[#0F172A]">
              
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-[#10B981]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="text-[#10B981] text-xs font-black uppercase tracking-widest animate-pulse">Generazione Profilo AI...</span>
                  <p className="text-[#64748B] text-[10px] uppercase font-bold text-center px-10">Analisi statistiche avanzate, contratti e valutazioni in corso tramite Gemini.</p>
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="px-6 py-12">
                  <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-3xl p-6 text-center shadow-lg">
                    <X size={40} className="text-[#EF4444] mx-auto mb-4 opacity-80" />
                    <p className="text-[#EF4444] font-black text-lg mb-2">Analisi Fallita</p>
                    <p className="text-[#94A3B8] text-sm">Impossibile generare il profilo avanzato. Riprova più tardi.</p>
                  </div>
                </div>
              )}

              {/* Success Data Presentation */}
              {!loading && !error && aiData && (
                <div className="px-6 py-6 space-y-8">
                  
                  {/* Anagrafica Rapida */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md">
                      <div className="text-lg font-black text-white">{aiData.anagrafica?.eta || '—'}</div>
                      <div className="text-[9px] text-[#64748B] uppercase font-black tracking-wider">Anni</div>
                    </div>
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md">
                      <div className="text-lg font-black text-white">{aiData.anagrafica?.altezza || '—'}</div>
                      <div className="text-[9px] text-[#64748B] uppercase font-black tracking-wider">Alt.</div>
                    </div>
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md">
                      <div className="text-lg font-black text-white">{aiData.anagrafica?.peso || '—'}</div>
                      <div className="text-[9px] text-[#64748B] uppercase font-black tracking-wider">Peso</div>
                    </div>
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md">
                      <div className="text-lg font-black text-white capitalize">{aiData.anagrafica?.piede || '—'}</div>
                      <div className="text-[9px] text-[#64748B] uppercase font-black tracking-wider">Piede</div>
                    </div>
                  </div>

                  {/* Profilo Economico (Very prominent) */}
                  {(aiData.economia?.stipendio || aiData.economia?.valoreMercato) && (
                    <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-[#10B981]/30 rounded-3xl p-6 shadow-[0_10px_30px_rgba(16,185,129,0.1)] relative overflow-hidden">
                      <Euro className="absolute -right-4 -bottom-4 text-[#10B981] opacity-5" size={150} />
                      <h3 className="text-xs text-[#10B981] uppercase font-black tracking-widest mb-4 flex items-center">
                        <TrendingUp size={14} className="mr-2" /> Dati Finanziari
                      </h3>
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                          <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-wider mb-1">Valore Mercato</p>
                          <p className="text-2xl font-black text-white">{aiData.economia?.valoreMercato || 'N/D'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-wider mb-1">Stipendio Netto</p>
                          <p className="text-2xl font-black text-white">{aiData.economia?.stipendio || 'N/D'}</p>
                        </div>
                        <div className="col-span-2 mt-2 pt-4 border-t border-[#334155]/50 flex items-center justify-between">
                          <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-wider">Scadenza Contratto</p>
                          <p className="text-sm font-bold text-[#E2E8F0] bg-[#334155]/50 px-3 py-1 rounded-lg">
                            {aiData.economia?.scadenzaContratto || 'Sconosciuta'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistiche Staff / Coach */}
                  {aiData.isCoach && aiData.stats?.coach && (
                    <div className="space-y-4">
                      <h3 className="text-xs text-[#0EA5E9] uppercase font-black tracking-widest flex items-center">
                        <Award size={14} className="mr-2" /> Carriera in panchina
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {renderStatBox('Modulo Preferito', aiData.stats.coach.moduloPreferito, '', undefined, 'text-[#0EA5E9]')}
                        {renderStatBox('Win Rate', aiData.stats.coach.winRate, '', undefined, 'text-[#10B981]')}
                        {renderStatBox('Partite Gestite', aiData.stats.coach.partiteGestite, '', undefined, 'text-white')}
                        {renderStatBox('Trofei Vinti', aiData.stats.coach.trofeiVinti, '', <Award />, 'text-[#F59E0B]')}
                      </div>
                    </div>
                  )}

                  {/* Statistiche Ruolo Specifiche (Only for players) */}
                  {!aiData.isCoach && aiData.stats?.ruoloSpeciale && Object.keys(aiData.stats.ruoloSpeciale).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs text-[#F59E0B] uppercase font-black tracking-widest flex items-center">
                        <Activity size={14} className="mr-2" /> Metriche Chiave di Ruolo
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(aiData.stats.ruoloSpeciale).map(([key, value], idx) => (
                           <div key={idx} className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-[#334155] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
                             <div className="text-xl font-black text-[#F59E0B] mb-2">{value as string}</div>
                             <div className="text-[9px] text-[#94A3B8] uppercase font-black tracking-wide leading-tight">{key}</div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statistiche Stagione e Carriera */}
                  {!aiData.isCoach && (
                    <div className="space-y-4">
                      <h3 className="text-xs text-white/60 uppercase font-black tracking-widest flex items-center">
                        <CalendarDays size={14} className="mr-2" /> Storico Presenze
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="bg-[#1E293B] rounded-2xl p-4 flex justify-between items-center border border-[#334155]">
                          <div>
                            <p className="text-[10px] text-[#10B981] font-black uppercase tracking-widest">Stagione Attuale</p>
                            <p className="text-sm font-bold text-white mt-0.5">{aiData.stats?.squadraAttuale?.nome || teamName}</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <p className="text-xl font-black text-white">{aiData.stats?.stagioneCorrente?.presenze || 0}</p>
                              <p className="text-[9px] text-[#64748B] uppercase font-bold">Pres</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-black text-white">{aiData.stats?.stagioneCorrente?.minutiGiocati || 0}</p>
                              <p className="text-[9px] text-[#64748B] uppercase font-bold">Min</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#1E293B] rounded-2xl p-4 flex justify-between items-center border border-[#334155]">
                          <div>
                            <p className="text-[10px] text-[#0EA5E9] font-black uppercase tracking-widest">Carriera Totale</p>
                            <p className="text-sm font-bold text-white mt-0.5">Club</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <p className="text-xl font-black text-white">{aiData.stats?.carriera?.presenze || 0}</p>
                              <p className="text-[9px] text-[#64748B] uppercase font-bold">Pres</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-black text-white">{aiData.stats?.isGoalkeeper ? '—' : (aiData.stats?.carriera?.gol || 0)}</p>
                              <p className="text-[9px] text-[#64748B] uppercase font-bold">Gol</p>
                            </div>
                          </div>
                        </div>

                        {aiData.stats?.nazionale && aiData.stats.nazionale.presenze > 0 && (
                          <div className="bg-[#1E293B] rounded-2xl p-4 flex justify-between items-center border border-[#334155]">
                            <div>
                              <p className="text-[10px] text-[#6366F1] font-black uppercase tracking-widest">Nazionale</p>
                              <p className="text-sm font-bold text-white mt-0.5">{aiData.anagrafica?.nazionalita || 'Selezione'}</p>
                            </div>
                            <div className="flex gap-4">
                              <div className="text-center">
                                <p className="text-xl font-black text-white">{aiData.stats.nazionale.presenze}</p>
                                <p className="text-[9px] text-[#64748B] uppercase font-bold">Pres</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-black text-white">{aiData.stats?.isGoalkeeper ? '—' : aiData.stats.nazionale.gol}</p>
                                <p className="text-[9px] text-[#64748B] uppercase font-bold">Gol</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Biografia e Caratteristiche */}
                  <div className="space-y-4 pt-4 border-t border-[#334155]">
                    {aiData.caratteristiche && (
                      <div className="bg-[#1E293B]/50 border border-[#334155] rounded-3xl p-5">
                        <h3 className="text-xs text-[#94A3B8] uppercase font-black tracking-widest flex items-center mb-3">
                          <Star size={14} className="mr-2 text-[#F59E0B]" /> Profilo Tecnico
                        </h3>
                        <p className="text-sm text-[#E2E8F0] leading-relaxed font-medium">
                          {aiData.caratteristiche}
                        </p>
                      </div>
                    )}

                    {aiData.biografia && (
                      <div className="bg-[#1E293B]/50 border border-[#334155] rounded-3xl p-5">
                        <h3 className="text-xs text-[#94A3B8] uppercase font-black tracking-widest flex items-center mb-3">
                          <User size={14} className="mr-2" /> Storia e Biografia
                        </h3>
                        <p className="text-sm text-[#CBD5E1] leading-relaxed">
                          {aiData.biografia}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
