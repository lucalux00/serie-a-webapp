"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_MARKET } from '@/data/mockData';

export default function MarketFeed() {
  const [filter, setFilter] = useState('tutte');

  const filters = ['tutte', 'ufficiale', 'trattativa', 'rumor'];

  const filteredNews = MOCK_MARKET.filter(news => 
    filter === 'tutte' ? true : news.status === filter
  );

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'ufficiale': return 'bg-[#10B981] text-[#0F172A]';
      case 'trattativa': return 'bg-[#F59E0B] text-[#0F172A]';
      case 'rumor': return 'bg-[#EF4444] text-[#F8FAFC]';
      default: return 'bg-[#334155] text-white';
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Filters */}
      <div className="flex overflow-x-auto space-x-2 pb-4 no-scrollbar">
        {filters.map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors whitespace-nowrap ${filter === f ? 'bg-[#0EA5E9] text-white' : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex flex-col space-y-4">
        <AnimatePresence>
          {filteredNews.map(news => (
            <motion.div 
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#94A3B8]">{news.teamName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${getBadgeColor(news.status)}`}>
                  {news.status}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug">{news.text}</p>
              <div className="text-[10px] text-[#94A3B8] text-right mt-2">{news.time}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
