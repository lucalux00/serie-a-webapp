"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AuthForms from '@/components/auth/AuthForms';
import { LogOut, User, Settings, Heart, Trophy } from 'lucide-react';

export default function ProfiloPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-[#10B981] w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tight">Area <span className="text-[#10B981]">Personale</span></h1>
          <p className="text-[#64748B] mt-2">Accedi per personalizzare la tua esperienza Serie A</p>
        </motion.div>

        <AuthForms />
      </div>
    );
  }

  // Se l'utente è l'utente legacy (generato dal vecchio onboarding) non ha email.
  const isLegacy = user.id === 'legacy-id';

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1E293B] rounded-3xl p-6 shadow-2xl border border-[#334155] mb-6"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-[#10B981] overflow-hidden bg-[#0F172A]">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-4 text-[#10B981]" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{user.name}</h2>
            <p className="text-[#94A3B8] text-sm font-medium">{user.email || 'Utente Ospite'}</p>
          </div>
        </div>

        {user.favoriteTeamName && (
          <div className="bg-[#0F172A] rounded-xl p-4 border border-[#334155] flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="text-[#10B981] w-5 h-5 mr-3" />
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-widest font-bold">Squadra del Cuore</p>
                <p className="text-white font-bold">{user.favoriteTeamName}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="space-y-3">
        <button className="w-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] rounded-xl p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center text-white font-bold">
            <Settings className="w-5 h-5 mr-3 text-[#64748B]" />
            Impostazioni Account
          </div>
          <div className="text-[#64748B] text-xs">Presto disponibile</div>
        </button>

        <button className="w-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] rounded-xl p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center text-white font-bold">
            <Trophy className="w-5 h-5 mr-3 text-[#F59E0B]" />
            I Miei Pronostici
          </div>
          <div className="text-[#64748B] text-xs">Presto disponibile</div>
        </button>

        <button 
          onClick={logout}
          className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/50 text-[#EF4444] rounded-xl p-4 flex items-center justify-center font-black transition-colors mt-8"
        >
          <LogOut className="w-5 h-5 mr-2" />
          ESCI DALL'ACCOUNT
        </button>
      </div>
    </div>
  );
}
