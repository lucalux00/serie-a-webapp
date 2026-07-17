"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AuthForms from '@/components/auth/AuthForms';
import { LogOut, User, Settings, Heart, Trophy, Bell, BellRing, X } from 'lucide-react';
import Link from 'next/link';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ALL_TEAMS } from '@/data/teams';
import FantaRoster from '@/components/domain/FantaRoster';
import FantaNewsFeed from '@/components/domain/FantaNewsFeed';

export default function ProfiloPage() {
  const { user, logout } = useAuth();
  const { isSupported, isSubscribed, subscribe, testNotification } = usePushNotifications(user?.id);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail })
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

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

        {user.favoriteTeamName ? (
          <div className="bg-[#0F172A] rounded-xl p-4 border border-[#334155] flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="text-[#10B981] w-5 h-5 mr-3" />
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-widest font-bold">Squadra del Cuore</p>
                <p className="text-white font-bold">{user.favoriteTeamName}</p>
              </div>
            </div>
            <div className="text-xs text-[#10B981] font-black uppercase tracking-widest bg-[#10B981]/10 px-3 py-1.5 rounded-full">Selezionata</div>
          </div>
        ) : (
          <div className="bg-[#0F172A] rounded-xl p-4 border border-[#334155]">
             <p className="text-xs text-[#64748B] uppercase tracking-widest font-bold mb-2">Seleziona Squadra del Cuore</p>
             <select 
               className="w-full bg-[#1E293B] border border-[#334155] rounded-lg p-2 text-white text-sm outline-none focus:border-[#10B981]"
               onChange={async (e) => {
                 if (!e.target.value) return;
                 await fetch('/api/auth/me', { 
                   method: 'POST', 
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ favoriteTeamId: e.target.value }) 
                 });
                 window.location.reload();
               }}
             >
               <option value="">-- Seleziona una squadra --</option>
               {ALL_TEAMS.filter(t => t.league === 'A').map(t => (
                 <option key={t.id} value={t.id}>{t.name}</option>
               ))}
             </select>
          </div>
        )}
      </motion.div>

      <FantaRoster />
      <FantaNewsFeed />

      <div className="space-y-3">
        <button 
          onClick={() => {
            setEditName(user.name || '');
            setEditEmail(user.email || '');
            setIsSettingsOpen(true);
          }}
          className="w-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] rounded-xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center text-white font-bold">
            <Settings className="w-5 h-5 mr-3 text-[#64748B]" />
            Impostazioni Account
          </div>
          <div className="text-[#64748B] text-xs">Modifica</div>
        </button>

        {/* Notifiche Push Panel */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center text-white font-bold mb-3">
            <Bell className="w-5 h-5 mr-3 text-[#10B981]" />
            Notifiche Push
          </div>
          {!isSupported ? (
            <p className="text-xs text-[#EF4444]">Il tuo browser non supporta le notifiche Push.</p>
          ) : !isSubscribed ? (
            <div className="space-y-3">
              <p className="text-xs text-[#94A3B8]">Attiva le notifiche per ricevere aggiornamenti sui match della tua squadra del cuore.</p>
              <button 
                onClick={subscribe}
                className="w-full bg-[#10B981] text-[#0F172A] font-black rounded-lg py-2 flex items-center justify-center text-sm"
              >
                <BellRing className="w-4 h-4 mr-2" />
                ATTIVA NOTIFICHE
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[#10B981] font-bold">✓ Notifiche Attive</p>
              <button 
                onClick={testNotification}
                className="w-full bg-[#0F172A] border border-[#334155] text-white hover:bg-[#334155] font-black rounded-lg py-2 flex items-center justify-center text-sm transition-colors"
              >
                Testa Notifica (Finto Gol)
              </button>
            </div>
          )}
        </div>

        <Link href="/profilo/pronostici" className="w-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] rounded-xl p-4 flex items-center justify-between transition-colors block">
          <div className="flex items-center text-white font-bold">
            <Trophy className="w-5 h-5 mr-3 text-[#F59E0B]" />
            I Miei Pronostici
          </div>
          <div className="text-[#64748B] text-xs">Storico Vinti</div>
        </Link>

        <button 
          onClick={logout}
          className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/50 text-[#EF4444] rounded-xl p-4 flex items-center justify-center font-black transition-colors mt-8"
        >
          <LogOut className="w-5 h-5 mr-2" />
          ESCI DALL'ACCOUNT
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 text-[#64748B] hover:text-white"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-black text-white mb-6">Impostazioni Account</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Nome Utente</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-white focus:border-[#10B981] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Email</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-white focus:border-[#10B981] outline-none transition-colors"
                  />
                </div>
                
                <button 
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="w-full mt-6 bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white font-black rounded-xl p-3 shadow-lg hover:shadow-xl transition-all"
                >
                  {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
