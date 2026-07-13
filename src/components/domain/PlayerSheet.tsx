"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, User, BookOpen, Star, Target, Goal, ArrowRightLeft } from 'lucide-react';

interface PlayerSheetProps {
  player: any;
  onClose: () => void;
}

export default function PlayerSheet({ player, onClose }: PlayerSheetProps) {
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
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#1E293B] border-t border-[#334155] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 overflow-y-auto no-scrollbar"
          >
            <div className="sticky top-0 bg-[#1E293B] px-6 py-4 border-b border-[#334155] flex justify-between items-center z-10 rounded-t-3xl">
              <div className="w-12 h-1.5 bg-[#334155] rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
              <h2 className="text-xl font-black truncate pr-4 mt-2">{player.name}</h2>
              <button onClick={onClose} className="p-2 bg-[#334155] rounded-full text-white mt-2">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-center space-x-4">
                {!player.isStaff && (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#0EA5E9] flex items-center justify-center text-4xl font-black shadow-lg">
                    {player.number}
                  </div>
                )}
                <div>
                  <div className="text-[#10B981] font-bold uppercase tracking-widest text-sm mb-1">
                    {player.isStaff ? player.role : player.position}
                  </div>
                  {!player.isStaff && (
                    <div className="flex space-x-3 text-sm text-[#94A3B8] font-semibold">
                      <span>{player.age} anni</span>
                      <span>•</span>
                      <span>{player.height} cm</span>
                      <span>•</span>
                      <span>{player.weight} kg</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prestiti / Mercato Info */}
              {player.status === 'In Prestito' && player.loanDetails && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4 flex flex-col space-y-2">
                  <div className="flex items-center text-[#F59E0B] font-bold uppercase text-xs">
                    <ArrowRightLeft size={14} className="mr-2" /> Dettagli Prestito
                  </div>
                  <div className="text-sm">
                    <span className="text-[#94A3B8]">Squadra Destinazione:</span> <span className="font-bold text-white">{player.loanDetails.toTeam}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[#94A3B8]">Formula:</span> <span className="font-bold text-white">{player.loanDetails.type}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <div>
                      <span className="text-[#94A3B8] block text-[10px] uppercase">Costo Prestito</span>
                      <span className="font-black text-[#10B981]">{player.loanDetails.fee}</span>
                    </div>
                    {player.loanDetails.buyOption && (
                      <div className="text-right">
                        <span className="text-[#94A3B8] block text-[10px] uppercase">Diritto/Obbligo di Riscatto</span>
                        <span className="font-black text-[#10B981]">{player.loanDetails.buyOption}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {player.status && (
                <div className={`p-3 rounded-xl border flex items-center font-bold text-sm ${player.status === 'In Prestito' ? 'bg-[#F59E0B]/10 border-[#F59E0B]/50 text-[#F59E0B]' : 'bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]'}`}>
                  <Activity size={16} className="mr-2" />
                  {player.status === 'In Prestito' ? 'Giocatore in Prestito' : 'In Rosa Ufficiale'}
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#94A3B8] text-sm mt-4 font-bold animate-pulse">Estrazione dati reali da Wikipedia...</span>
                </div>
              ) : realData ? (
                <>
                  {/* Stats Reali */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-4 rounded-2xl border border-[#0EA5E9]/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                      <div className="flex items-center text-[#0EA5E9] mb-2 text-[10px] font-black uppercase tracking-wider"><Activity size={14} className="mr-1"/> Presenze Club</div>
                      <div className="text-2xl font-black text-white">{realData.stats?.presenze || '-'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-4 rounded-2xl border border-[#10B981]/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <div className="flex items-center text-[#10B981] mb-2 text-[10px] font-black uppercase tracking-wider"><Target size={14} className="mr-1"/> Reti Club</div>
                      <div className="text-2xl font-black text-white">{realData.stats?.reti || '-'}</div>
                    </div>
                  </div>

                  {/* Biografia Reale */}
                  <div className="bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden">
                    <div className="bg-[#334155]/30 px-4 py-2 border-b border-[#334155] font-bold text-xs uppercase tracking-wider text-[#94A3B8]">
                      Profilo e Biografia
                    </div>
                    <div className="p-4 text-sm text-[#94A3B8] leading-relaxed">
                      {realData.biografia}
                    </div>
                  </div>

                  {/* Caratteristiche Reali */}
                  {realData.caratteristiche !== 'Nessuna caratteristica tecnica specificata.' && (
                    <div className="bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden">
                      <div className="bg-[#334155]/30 px-4 py-2 border-b border-[#334155] font-bold text-xs uppercase tracking-wider text-[#94A3B8]">
                        Caratteristiche Tecniche
                      </div>
                      <div className="p-4 text-sm text-[#94A3B8] leading-relaxed italic">
                        "{realData.caratteristiche}"
                      </div>
                    </div>
                  )}
                </>
              ) : null}

              {/* Curiosità e Diploma */}
              <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-5 rounded-2xl border border-[#334155]">
                <h3 className="font-bold text-[#F8FAFC] mb-4 flex items-center">
                  <BookOpen size={18} className="mr-2 text-[#10B981]"/> Profilo Personale
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-[#334155] pb-2">
                    <span className="text-[#94A3B8]">Voto di Diploma</span>
                    <span className="font-bold">{player.isStaff ? player.diploma : player.curiosities?.diploma}</span>
                  </div>
                  {!player.isStaff && (
                    <>
                      <div className="flex justify-between border-b border-[#334155] pb-2">
                        <span className="text-[#94A3B8]">Piede Preferito</span>
                        <span className="font-bold">{player.foot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Hobby Principale</span>
                        <span className="font-bold">{player.curiosities?.hobby}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
