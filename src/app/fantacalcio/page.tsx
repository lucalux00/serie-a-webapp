"use client";

import React, { useState } from 'react';
import { Target, Shield, Newspaper, Sparkles, Users, Crown } from 'lucide-react';
import FantaMarketDashboard from '@/components/domain/FantaMarketDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import FantaLineupBuilder from '@/components/domain/FantaLineupBuilder';
import FantaNewsFeed from '@/components/domain/FantaNewsFeed';
import FantaAdvisorDashboard from '@/components/domain/FantaAdvisorDashboard';
import FantaRoster from '@/components/domain/FantaRoster';
import FantaProHub from '@/components/domain/FantaProHub';

export default function FantacalcioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'hub' | 'rosa' | 'advisor' | 'mercato' | 'news'>('hub');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] p-4 text-[#94A3B8]">
        <Shield size={48} className="text-[#10B981] mb-4 opacity-50" />
        <h2 className="text-xl font-black text-white mb-2">Area Riservata</h2>
        <p className="text-sm text-center">Accedi per gestire la tua squadra di Fantacalcio.</p>
        <a href="/profilo" className="mt-6 bg-[#10B981] text-[#0F172A] font-black px-6 py-3 rounded-xl">Vai al Login</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 p-4">
      <div className="flex items-center mb-6 mt-2">
        <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] mr-3">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Fanta Copilota</h1>
          <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Vinci la tua lega, ovunque tu giochi</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[#334155] bg-[#1E293B] p-1.5 shadow-md">
        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:justify-center">
        <button
          onClick={() => setActiveTab('hub')}
          className={`relative flex items-center justify-center px-3 py-3 text-xs font-black rounded-xl transition-all sm:min-w-32 ${activeTab === 'hub' ? 'bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] text-[#0F172A] shadow-md' : 'text-[#FCD34D] hover:bg-[#F59E0B]/10'}`}
        >
          <Crown size={16} className="mr-2" /> HUB PRO
        </button>
        <button
          onClick={() => setActiveTab('rosa')}
          className={`flex items-center justify-center px-3 py-3 text-xs font-bold rounded-xl transition-all sm:min-w-32 ${activeTab === 'rosa' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <Users size={16} className="mr-2" /> LA MIA ROSA
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`relative flex items-center justify-center px-3 py-3 text-sm font-black rounded-xl transition-all sm:min-w-48 ${activeTab === 'advisor' ? 'bg-gradient-to-r from-[#7C3AED] via-[#4F46E5] to-[#2563EB] text-white shadow-[0_4px_20px_rgba(79,70,229,0.45)]' : 'bg-[#334155] text-white hover:bg-[#475569]'}`}
        >
          <Sparkles size={17} className="mr-2" /> CONSIGLI AI
          <span className="absolute -top-2 right-2 rounded-full bg-[#F59E0B] px-1.5 py-0.5 text-[8px] font-black text-[#0F172A]">IL FULCRO</span>
        </button>
        <button
          onClick={() => setActiveTab('mercato')}
          className={`flex items-center justify-center px-3 py-3 text-xs font-bold rounded-xl transition-all sm:min-w-32 ${activeTab === 'mercato' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <Target size={16} className="mr-2" /> MERCATO AI
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center justify-center px-3 py-3 text-xs font-bold rounded-xl transition-all sm:min-w-28 ${activeTab === 'news' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <Newspaper size={16} className="mr-2" /> RADAR ROSA
        </button>
        </div>
      </div>

      <p className="mb-6 text-center text-xs text-[#94A3B8]">Non gestiamo la tua lega: ti aiutiamo a vincerla con scelte migliori.</p>

      <AnimatePresence mode="wait">
        {activeTab === 'hub' && (
          <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaProHub onNavigate={setActiveTab} />
          </motion.div>
        )}
        {activeTab === 'rosa' && (
          <motion.div key="rosa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <FantaRoster />
             <FantaLineupBuilder />
          </motion.div>
        )}
        {activeTab === 'advisor' && (
          <motion.div key="advisor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaAdvisorDashboard />
          </motion.div>
        )}
        {activeTab === 'mercato' && (
          <motion.div key="mercato" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaMarketDashboard onOpenRoster={() => setActiveTab('rosa')} />
          </motion.div>
        )}
        {activeTab === 'news' && (
          <motion.div key="news" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaNewsFeed />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
