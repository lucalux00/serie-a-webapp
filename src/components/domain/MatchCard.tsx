"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';

interface MatchProps {
  match: {
    id: string;
    home: string;
    away: string;
    time: string;
    prob: { h: number, d: number, a: number };
    exactResult: string;
    unpredictabilityIndex: number;
    keyFactor: string;
    analysis: string;
  }
}

export default function MatchCard({ match }: MatchProps) {
  const [expanded, setExpanded] = useState(false);

  // Colore indice imprevisto
  const getIndexColor = (idx: number) => {
    if (idx < 5) return 'text-[#10B981]';
    if (idx < 8) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  return (
    <motion.div 
      layout
      className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden mb-4 shadow-lg"
    >
      <div 
        className="p-4 flex flex-col cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider bg-[#0F172A] px-2 py-1 rounded">{match.time}</span>
          {expanded ? <ChevronUp size={16} className="text-[#10B981]" /> : <ChevronDown size={16} className="text-[#10B981]" />}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-lg font-black">{match.home}</div>
          <div className="text-[#10B981] font-black mx-2 text-xs uppercase bg-[#10B981]/20 px-2 py-0.5 rounded">vs</div>
          <div className="text-lg font-black">{match.away}</div>
        </div>

        {/* Probabilities Bar */}
        <div className="mt-4 flex h-2.5 rounded-full overflow-hidden bg-[#334155] shadow-inner">
          <div style={{ width: `${match.prob.h}%` }} className="bg-[#10B981]" />
          <div style={{ width: `${match.prob.d}%` }} className="bg-[#94A3B8]" />
          <div style={{ width: `${match.prob.a}%` }} className="bg-[#0EA5E9]" />
        </div>
        <div className="flex justify-between text-[10px] font-black mt-1.5 text-[#94A3B8] uppercase">
          <span className="text-[#10B981]">1 ({match.prob.h}%)</span>
          <span>X ({match.prob.d}%)</span>
          <span className="text-[#0EA5E9]">2 ({match.prob.a}%)</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 bg-gradient-to-b from-[#0F172A]/50 to-[#0F172A] border-t border-[#334155] pt-4 text-sm"
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#1E293B] border border-[#334155] p-3 rounded-lg text-center">
                <div className="text-[9px] uppercase font-black text-[#94A3B8] mb-1">Risultato Esatto Consigliato</div>
                <div className="text-xl font-black text-[#F8FAFC]">{match.exactResult}</div>
              </div>
              <div className="bg-[#1E293B] border border-[#334155] p-3 rounded-lg text-center">
                <div className="text-[9px] uppercase font-black text-[#94A3B8] mb-1">Indice di Imprevisto</div>
                <div className={`text-xl font-black ${getIndexColor(match.unpredictabilityIndex)}`}>
                  {match.unpredictabilityIndex}/10
                </div>
              </div>
            </div>

            <h4 className="text-[#0EA5E9] font-black mb-1 text-xs uppercase tracking-wider flex items-center">
               Key Factor <ChevronDown size={12} className="ml-1 rotate-[-90deg]"/>
            </h4>
            <p className="text-[#F8FAFC] text-xs leading-relaxed italic mb-4 bg-[#0EA5E9]/10 p-3 rounded-lg border-l-2 border-[#0EA5E9]">
              "{match.keyFactor}"
            </p>

            <h4 className="text-[#10B981] font-black mb-1 text-xs uppercase tracking-wider">
               Simulazione Predittiva (Data Model)
            </h4>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              {match.analysis}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
