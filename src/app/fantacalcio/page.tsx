import React from 'react';
import FantaLiveTable from '@/components/domain/FantaLiveTable';

export default function FantacalcioPage() {
  return (
    <div className="flex flex-col w-full h-full p-4 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          Voti Live <span className="ml-2 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
        </h1>
        <FantaLiveTable />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Consigli della Settimana</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1E293B] border border-[#10B981]/50 rounded-xl p-4 shadow-md flex flex-col justify-end h-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-[#10B981]/10 rounded-bl-full">
               <span className="text-[#10B981] font-black text-2xl">+3</span>
            </div>
            <h3 className="font-bold text-sm z-10 leading-tight">Top 5 Difensori per questa giornata</h3>
          </div>
          
          <div className="bg-[#1E293B] border border-[#F59E0B]/50 rounded-xl p-4 shadow-md flex flex-col justify-end h-32">
            <h3 className="font-bold text-sm leading-tight text-[#F59E0B]">Scommesse e Sorprese</h3>
          </div>
        </div>
      </section>

      <section>
        <div className="bg-gradient-to-br from-[#1E3A8A]/50 to-[#0F172A] border border-[#3B82F6]/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
              <span className="text-[#3B82F6] text-xl">🤖</span>
            </div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">Fanta-Advisor AI</h2>
          </div>
          <p className="text-[#94A3B8] text-sm mb-4 leading-relaxed">
            Il nostro sistema analizzerà la tua rosa e i crediti rimanenti per suggerirti <strong>chi tagliare</strong> e <strong>chi acquistare</strong>, calcolando il miglior ROI per il tuo centrocampo e attacco.
          </p>
          <div className="flex items-center justify-between bg-[#0F172A]/50 rounded-xl p-3 border border-[#1E293B]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#10B981]">In addestramento</span>
            </div>
            <span className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider">Coming Soon</span>
          </div>
        </div>
      </section>
    </div>
  );
}
