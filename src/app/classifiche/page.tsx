"use client";

import React, { useState } from 'react';
import classificheData from '@/data/classifiche.json';
import { Trophy, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

export default function ClassifichePage() {
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const data = activeTab === 'A' ? classificheData.serieA : classificheData.serieB;

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] mr-3">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Campionato</h1>
            <p className="text-xs text-[#0EA5E9] font-bold uppercase tracking-widest">Stagione {data.season}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-4 mb-6">
        <button 
          className={`px-8 py-2 rounded-full font-black text-sm transition-colors ${activeTab === 'A' ? 'bg-[#10B981] text-white shadow-lg' : 'bg-[#1E293B] text-[#94A3B8]'}`}
          onClick={() => setActiveTab('A')}
        >
          SERIE A
        </button>
        <button 
          className={`px-8 py-2 rounded-full font-black text-sm transition-colors ${activeTab === 'B' ? 'bg-[#0EA5E9] text-white shadow-lg' : 'bg-[#1E293B] text-[#94A3B8]'}`}
          onClick={() => setActiveTab('B')}
        >
          SERIE B
        </button>
      </div>

      {/* Standings Table */}
      <div className="bg-[#1E293B] rounded-2xl overflow-hidden border border-[#334155] shadow-xl mb-8">
        <div className="bg-[#0F172A] px-4 py-3 border-b border-[#334155] flex items-center justify-between">
          <span className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">Classifica Attuale</span>
          <span className="text-[10px] text-[#10B981] font-bold uppercase px-2 py-1 bg-[#10B981]/10 rounded-full">Aggiornata al 13 Luglio 2026</span>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-[#94A3B8] uppercase bg-[#1E293B] border-b border-[#334155]">
              <tr>
                <th className="px-4 py-3 font-black text-center w-8">#</th>
                <th className="px-2 py-3 font-black">Squadra</th>
                <th className="px-2 py-3 font-black text-center">Pt</th>
                <th className="px-2 py-3 font-bold text-center text-[#64748B]">G</th>
                <th className="px-2 py-3 font-bold text-center text-[#64748B]">V</th>
                <th className="px-2 py-3 font-bold text-center text-[#64748B]">P</th>
                <th className="px-2 py-3 font-bold text-center text-[#64748B]">S</th>
              </tr>
            </thead>
            <tbody>
              {data.standings.map((team, idx) => {
                // Style per Champions League, Europa League, Retrocessione ecc.
                let rowBg = "border-b border-[#334155]/50 bg-[#1E293B]";
                let posColor = "text-[#94A3B8]";
                
                if (activeTab === 'A') {
                  if (team.pos <= 4) { rowBg = "border-b border-[#334155]/50 bg-[#10B981]/5"; posColor = "text-[#10B981] font-black"; }
                  else if (team.pos === 5 || team.pos === 6) { posColor = "text-[#0EA5E9] font-black"; }
                  else if (team.pos >= 18) { rowBg = "border-b border-[#334155]/50 bg-[#EF4444]/5"; posColor = "text-[#EF4444] font-black"; }
                } else {
                  if (team.pos <= 2) { rowBg = "border-b border-[#334155]/50 bg-[#10B981]/5"; posColor = "text-[#10B981] font-black"; }
                  else if (team.pos >= 3 && team.pos <= 8) { posColor = "text-[#0EA5E9] font-black"; }
                  else if (team.pos >= 16) { rowBg = "border-b border-[#334155]/50 bg-[#EF4444]/5"; posColor = "text-[#EF4444] font-black"; }
                }

                return (
                  <tr key={team.team} className={`${rowBg} hover:bg-[#334155]/30 transition-colors`}>
                    <td className={`px-4 py-3 text-center text-xs ${posColor}`}>{team.pos}</td>
                    <td className="px-2 py-3 font-bold text-white whitespace-nowrap">{team.team}</td>
                    <td className="px-2 py-3 text-center font-black text-[#10B981]">{team.points}</td>
                    <td className="px-2 py-3 text-center font-medium text-[#94A3B8]">{team.played}</td>
                    <td className="px-2 py-3 text-center font-medium text-[#94A3B8]">{team.w}</td>
                    <td className="px-2 py-3 text-center font-medium text-[#94A3B8]">{team.d}</td>
                    <td className="px-2 py-3 text-center font-medium text-[#94A3B8]">{team.l}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar */}
      <h2 className="text-lg font-black mb-4 flex items-center">
        <CalendarIcon size={18} className="mr-2 text-[#0EA5E9]" /> Prossimo Turno
      </h2>
      <div className="space-y-3">
        {data.calendar.map((match, idx) => (
          <div key={idx} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col active:scale-95 transition-transform shadow-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#0EA5E9] uppercase bg-[#0EA5E9]/10 px-2 py-1 rounded">1° Giornata</span>
              <span className="text-xs text-[#94A3B8] font-bold">{match.date}</span>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="flex-1 text-right font-black text-white text-base">{match.home}</div>
              <div className="mx-4 text-[#94A3B8] font-black text-sm bg-[#0F172A] px-3 py-1 rounded-lg border border-[#334155]">-</div>
              <div className="flex-1 text-left font-black text-white text-base">{match.away}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
