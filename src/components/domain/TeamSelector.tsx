"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_TEAMS } from '@/data/teams';
import { useRouter } from 'next/navigation';

const LEAGUES = [
  { id: 'A', name: 'Serie A', color: 'bg-[#10B981]' },
  { id: 'B', name: 'Serie B', color: 'bg-[#0EA5E9]' },
  { id: 'PL', name: 'Premier League', color: 'bg-[#3B82F6]' },
  { id: 'LL', name: 'La Liga', color: 'bg-[#F59E0B]' },
  { id: 'BL', name: 'Bundesliga', color: 'bg-[#EF4444]' },
  { id: 'L1', name: 'Ligue 1', color: 'bg-[#8B5CF6]' }
];

export default function TeamSelector() {
  const [activeTab, setActiveTab] = useState<string>('A');
  const router = useRouter();

  const filteredTeams = ALL_TEAMS.filter(t => t.league === activeTab);

  return (
    <div className="w-full py-4">
      {/* Scrollable Tab Menu */}
      <div className="flex overflow-x-auto space-x-3 mb-6 px-4 no-scrollbar pb-2">
        {LEAGUES.map((league) => (
          <button 
            key={league.id}
            className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-colors shadow-sm ${
              activeTab === league.id 
                ? `${league.color} text-white shadow-lg` 
                : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
            }`}
            onClick={() => setActiveTab(league.id)}
          >
            {league.name}
          </button>
        ))}
      </div>

      {/* Grid of Teams */}
      <motion.div 
        key={activeTab} // re-animate on tab change
        className="flex overflow-x-auto space-x-4 px-4 pb-4 snap-x no-scrollbar"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {filteredTeams.map(team => (
          <motion.div 
            key={team.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/squadra/${team.id}`)}
            className="flex-shrink-0 snap-center w-24 h-24 bg-[#1E293B] rounded-2xl flex flex-col items-center justify-center border border-[#334155] shadow-lg cursor-pointer hover:border-[#10B981] transition-colors"
          >
            <div className="text-3xl font-black text-white mb-2 drop-shadow-md">{team.logo}</div>
            <div className="text-xs font-semibold text-[#94A3B8] text-center px-1 truncate w-full">{team.name}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
