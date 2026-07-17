"use client";

import React, { useState, useEffect } from 'react';
import { Target, Calendar, Calculator, Shield, Cpu, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import FantaLineupBuilder from '@/components/domain/FantaLineupBuilder';
import FantaMatchdayVotes from '@/components/domain/FantaMatchdayVotes';

export default function FantacalcioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'formazione' | 'calendario' | 'advisor'>('formazione');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] p-4 text-[#94A3B8]">
        <Shield size={48} className="text-[#10B981] mb-4 opacity-50" />
        <h2 className="text-xl font-black text-white mb-2">Area Riservata</h2>
        <p className="text-sm text-center">Devi effettuare l'accesso per gestire la tua squadra di Fantacalcio.</p>
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
          <h1 className="text-2xl font-black text-white">Fantacalcio HUB</h1>
          <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Gestione Manageriale</p>
        </div>
      </div>

      <div className="flex bg-[#1E293B] p-1 rounded-xl mb-6 shadow-md border border-[#334155]">
        <button
          onClick={() => setActiveTab('formazione')}
          className={`flex-1 flex items-center justify-center py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'formazione' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <Target size={16} className="mr-2" /> FORMAZIONE
        </button>
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex-1 flex items-center justify-center py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'calendario' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <Calendar size={16} className="mr-2" /> VOTI
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex-1 flex items-center justify-center py-3 text-xs font-bold rounded-lg transition-all ${activeTab === 'advisor' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <Cpu size={16} className="mr-2" /> AI ADVISOR
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'formazione' && (
          <motion.div key="formazione" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <FantaLineupBuilder />
          </motion.div>
        )}
        {activeTab === 'calendario' && (
          <motion.div key="calendario" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <FantaMatchdayVotes />
          </motion.div>
        )}
        {activeTab === 'advisor' && (
          <motion.div key="advisor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-gradient-to-br from-[#1E3A8A]/50 to-[#0F172A] border border-[#3B82F6]/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Cpu size={100} />
              </div>
              <div className="flex items-center space-x-3 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
                  <span className="text-[#3B82F6] text-2xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F8FAFC]">Fanta-Advisor AI</h2>
                  <p className="text-xs text-[#3B82F6] font-bold uppercase tracking-wider">In addestramento</p>
                </div>
              </div>
              <p className="text-[#94A3B8] text-sm mb-6 leading-relaxed relative z-10">
                Il nostro sistema analizzerà la tua rosa e i dati storici per suggerirti <strong>la miglior formazione titolare</strong> e calcolerà chi tagliare in base ai crediti rimanenti.
              </p>
              
              <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155] relative z-10">
                <div className="flex items-center text-[#10B981] mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse mr-2"></span>
                  <span className="text-xs font-bold uppercase">Stato Algoritmo</span>
                </div>
                <p className="text-xs text-[#64748B]">Apprendimento sulle formazioni passate in corso... (Coming Soon)</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
