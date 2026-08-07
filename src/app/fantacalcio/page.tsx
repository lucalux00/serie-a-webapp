"use client";

import React, { useState } from 'react';
import { Target, Shield, Sparkles, Users, Crown, ClipboardList } from 'lucide-react';
import FantaMarketDashboard from '@/components/domain/FantaMarketDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import FantaLineupBuilder from '@/components/domain/FantaLineupBuilder';
import FantaAdviceCenter from '@/components/domain/FantaAdviceCenter';
import FantaRoster from '@/components/domain/FantaRoster';
import FantaProHub from '@/components/domain/FantaProHub';
import { useSubscription } from '@/contexts/SubscriptionContext';
import FantaUsageGuide from '@/components/ui/FantaUsageGuide';

const tabGuides = {
  lineup: {
    title: 'Come usare Formazione',
    steps: ['Parti dalla Rosa disponibile e usa TIT o PAN per spostare ogni giocatore.', 'Completa 11 titolari; Auto-schiera propone una base, ma puoi modificarla.', 'Controlla titolari e panchina, poi premi Salva prima della chiusura della giornata.'],
  },
  rosa: {
    title: 'Come usare La mia rosa',
    steps: ['Cerca un calciatore per nome e selezionalo dal menu dei risultati.', 'Aggiungi solo i giocatori che possiedi nella tua lega.', 'Rimuovi con il cestino chi non fa piu parte della rosa: consigli e formazione si aggiornano da qui.'],
  },
  advisor: {
    title: 'Come usare Consigli',
    steps: ['Scegli la sotto-tab in base al dubbio che devi risolvere.', 'Leggi indice, partita e segnali di disponibilita come supporto alla scelta.', 'Quando hai deciso, passa a Formazione per applicare il consiglio.'],
  },
  mercato: {
    title: 'Come usare Mercato AI',
    steps: ['Guarda prima i reparti scoperti nella sezione Analisi per reparto.', 'Confronta Top, Valore e Scommesse in base al tuo budget e al rischio.', 'Usa Aggiungi solo per inserire un acquisto reale nella tua rosa.'],
  },
  pro: {
    title: 'Come usare Hub Pro',
    steps: ['Segui le tre priorita nell’ordine proposto per preparare la giornata.', 'Usa il confronto per un ballottaggio tra due giocatori della tua rosa.', 'Controlla il planner prima di confermare formazione o operazioni di mercato.'],
  },
} as const;

export default function FantacalcioPage() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<'lineup' | 'rosa' | 'advisor' | 'mercato' | 'pro'>('lineup');

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
          onClick={() => setActiveTab('lineup')}
          className={`flex items-center justify-center px-3 py-3 text-xs font-bold rounded-xl transition-all sm:min-w-32 ${activeTab === 'lineup' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <ClipboardList size={16} className="mr-2" /> FORMAZIONE
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
          <Sparkles size={17} className="mr-2" /> CONSIGLI
        </button>
        <button
          onClick={() => setActiveTab('mercato')}
          className={`flex items-center justify-center px-3 py-3 text-xs font-bold rounded-xl transition-all sm:min-w-32 ${activeTab === 'mercato' ? 'bg-[#10B981] text-[#0F172A] shadow-md' : 'text-[#94A3B8] hover:text-white'}`}
        >
          <Target size={16} className="mr-2" /> MERCATO AI
        </button>
        <button
          onClick={() => setActiveTab('pro')}
          className={`relative flex items-center justify-center px-3 py-3 text-xs font-black rounded-xl transition-all sm:min-w-32 ${activeTab === 'pro' ? 'bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] text-[#0F172A] shadow-md' : 'text-[#FCD34D] hover:bg-[#F59E0B]/10'}`}
        >
          <Crown size={16} className="mr-2" /> {isPremium ? 'HUB PRO' : 'SCOPRI PRO'}
        </button>
        </div>
      </div>

      <p className="mb-6 text-center text-xs text-[#94A3B8]">Rosa, formazione, consigli e mercato: una tab per ogni azione, senza duplicazioni.</p>

      <div className="mb-5">
        <FantaUsageGuide
          title={tabGuides[activeTab].title}
          steps={[...tabGuides[activeTab].steps]}
          accentClassName={activeTab === 'advisor' || activeTab === 'pro' ? 'text-violet-300' : activeTab === 'mercato' ? 'text-amber-300' : 'text-emerald-300'}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'lineup' && (
          <motion.div key="lineup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaLineupBuilder />
          </motion.div>
        )}
        {activeTab === 'rosa' && (
          <motion.div key="rosa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <FantaRoster />
          </motion.div>
        )}
        {activeTab === 'advisor' && (
          <motion.div key="advisor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaAdviceCenter onNavigate={setActiveTab} />
          </motion.div>
        )}
        {activeTab === 'mercato' && (
          <motion.div key="mercato" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaMarketDashboard onOpenRoster={() => setActiveTab('rosa')} />
          </motion.div>
        )}
        {activeTab === 'pro' && (
          <motion.div key="pro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <FantaProHub onNavigate={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
