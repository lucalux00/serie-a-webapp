"use client";

import React from 'react';
import MatchCard from '@/components/domain/MatchCard';
import predictionsData from '@/data/worldCupPredictions.json';
import { Copy, BrainCircuit } from 'lucide-react';

export default function PronosticiPage() {
  const { matches, accumulator } = predictionsData;

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 p-4">
      <div className="flex items-center mb-6 mt-2">
        <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] mr-3">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black">AI Data Scientist</h1>
          <p className="text-xs text-[#0EA5E9] font-bold uppercase tracking-widest">Simulatore Predittivo 2026</p>
        </div>
      </div>
      
      {/* Disclaimer / Intro */}
      <div className="bg-[#1E293B] border-l-4 border-[#0EA5E9] p-3 rounded-r-xl mb-6 text-xs text-[#94A3B8] shadow-md">
        In attesa della Serie A, il network neurale sta analizzando miliardi di datapoint sul Mondiale 2026. L'algoritmo valuta lo storico, le variabili ambientali, gli arbitri e il mercato scommesse.
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-black text-[#94A3B8] uppercase mb-3">Semifinali Mondiali</h2>
        {matches.map(m => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#10B981]/20 to-[#0EA5E9]/20 border border-[#10B981]/50 p-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 px-3 py-1 bg-[#10B981] rounded-bl-xl text-[#0F172A] font-black text-[10px] uppercase shadow-md">Algoritmo Ottimizzato</div>
        <h2 className="text-xl font-black mb-5">{accumulator.title}</h2>
        
        <div className="space-y-3 mb-6">
          {accumulator.bets.map((bet, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm border-b border-[#334155]/50 pb-2">
              <span className="font-bold text-[#F8FAFC]">{bet.match}</span>
              <div className="text-right">
                <span className="block text-[10px] text-[#94A3B8] uppercase">Pronostico</span>
                <span className="font-black text-[#10B981]">{bet.pick} <span className="text-xs text-white">({bet.odds})</span></span>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-end pt-3">
            <span className="text-[#94A3B8] font-bold uppercase text-[10px] tracking-widest">Quota Combinata</span>
            <span className="font-black text-3xl text-[#0EA5E9] drop-shadow-md">{accumulator.totalOdds}</span>
          </div>
        </div>

        <button className="w-full flex items-center justify-center bg-[#10B981] hover:bg-[#059669] text-[#0F172A] font-black py-4 rounded-xl active:scale-95 transition-transform shadow-lg">
          <Copy size={20} className="mr-2" /> COPIA E GIOCA
        </button>
      </div>
    </div>
  );
}
