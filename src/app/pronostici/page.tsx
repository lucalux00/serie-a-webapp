"use client";

import React from 'react';
import MatchCard from '@/components/domain/MatchCard';
import { MOCK_MATCHES } from '@/data/mockData';
import { Copy } from 'lucide-react';

export default function PronosticiPage() {
  return (
    <div className="flex flex-col w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-4">Pronostici AI</h1>
      
      <div className="mb-8">
        {MOCK_MATCHES.map(m => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#10B981]/20 to-[#0EA5E9]/20 border border-[#10B981]/50 p-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 bg-[#10B981] rounded-bl-xl text-[#0F172A] font-black text-xs uppercase shadow-md">Bolletta Pronta</div>
        <h2 className="text-xl font-bold mb-4 mt-2">La Multipla del Sabato</h2>
        
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm border-b border-[#334155]/50 pb-2">
            <span>Napoli - Inter</span>
            <span className="font-bold text-[#10B981]">1 (2.40)</span>
          </div>
          <div className="flex justify-between text-sm border-b border-[#334155]/50 pb-2">
            <span>Juventus - Milan</span>
            <span className="font-bold text-[#10B981]">Under 2.5 (1.75)</span>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-[#94A3B8] font-semibold uppercase text-xs">Quota Totale</span>
            <span className="font-black text-lg text-[#0EA5E9]">4.20</span>
          </div>
        </div>

        <button className="w-full flex items-center justify-center bg-[#10B981] text-[#0F172A] font-bold py-3 rounded-xl active:scale-95 transition-transform">
          <Copy size={18} className="mr-2" /> COPIA GIOCATA
        </button>
      </div>
    </div>
  );
}
