"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_TEAMS } from '@/data/teams';
import { useRouter } from 'next/navigation';

export default function TeamSelector() {
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const router = useRouter();

  const filteredTeams = ALL_TEAMS.filter(t => t.league === activeTab);

  return (
    <div className="w-full py-4">
      <div className="flex justify-center space-x-4 mb-6">
        <button 
          className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeTab === 'A' ? 'bg-[#10B981] text-white' : 'bg-[#1E293B] text-[#94A3B8]'}`}
          onClick={() => setActiveTab('A')}
        >
          SERIE A
        </button>
        <button 
          className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeTab === 'B' ? 'bg-[#0EA5E9] text-white' : 'bg-[#1E293B] text-[#94A3B8]'}`}
          onClick={() => setActiveTab('B')}
        >
          SERIE B
        </button>
      </div>

      <motion.div 
        className="flex overflow-x-auto space-x-4 px-4 pb-4 snap-x no-scrollbar"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {filteredTeams.map(team => (
          <motion.div 
            key={team.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/squadra/${team.id}`)}
            className="flex-shrink-0 snap-center w-24 h-24 bg-[#1E293B] rounded-2xl flex flex-col items-center justify-center border border-[#334155] shadow-lg cursor-pointer"
          >
            <div className="text-3xl font-black text-white mb-2">{team.logo}</div>
            <div className="text-xs font-semibold text-[#94A3B8] text-center px-1 truncate w-full">{team.name}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
