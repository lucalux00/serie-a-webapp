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
    analysis: string;
  }
}

export default function MatchCard({ match }: MatchProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden mb-4"
    >
      <div 
        className="p-4 flex flex-col cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#94A3B8] text-xs font-semibold">{match.time}</span>
          {expanded ? <ChevronUp size={16} className="text-[#94A3B8]" /> : <ChevronDown size={16} className="text-[#94A3B8]" />}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">{match.home}</div>
          <div className="text-[#10B981] font-black mx-2">vs</div>
          <div className="text-lg font-bold">{match.away}</div>
        </div>

        <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-[#334155]">
          <div style={{ width: `${match.prob.h}%` }} className="bg-[#10B981]" />
          <div style={{ width: `${match.prob.d}%` }} className="bg-[#94A3B8]" />
          <div style={{ width: `${match.prob.a}%` }} className="bg-[#0EA5E9]" />
        </div>
        <div className="flex justify-between text-[10px] font-bold mt-1 text-[#94A3B8]">
          <span>1: {match.prob.h}%</span>
          <span>X: {match.prob.d}%</span>
          <span>2: {match.prob.a}%</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 bg-[#0F172A]/50 border-t border-[#334155] pt-4 text-sm"
          >
            <h4 className="text-[#0EA5E9] font-bold mb-2 text-xs uppercase tracking-wider">Analisi Algoritmica</h4>
            <p className="text-[#F8FAFC] leading-relaxed">{match.analysis}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
