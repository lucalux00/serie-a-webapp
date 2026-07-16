"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

import { ShieldAlert, ArrowRight, UserCircle } from 'lucide-react';

export default function LoginPage() {
  const { legacyLogin } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const handleNext = () => {
    if (username.trim().length > 2) setStep(2);
  };

  const handleRegister = () => {
    if (selectedTeam) {
      legacyLogin(username, selectedTeam.id, selectedTeam.name);
    }
  };

  // Mock list of teams for the registration screen
  const ALL_TEAMS = [
    { id: 'atalanta', name: 'Atalanta', color: 'bg-blue-600' },
    { id: 'bologna', name: 'Bologna', color: 'bg-red-700' },
    { id: 'cagliari', name: 'Cagliari', color: 'bg-blue-900' },
    { id: 'como', name: 'Como', color: 'bg-blue-500' },
    { id: 'empoli', name: 'Empoli', color: 'bg-blue-700' },
    { id: 'fiorentina', name: 'Fiorentina', color: 'bg-purple-600' },
    { id: 'genoa', name: 'Genoa', color: 'bg-red-800' },
    { id: 'inter', name: 'Inter', color: 'bg-blue-800' },
    { id: 'juventus', name: 'Juventus', color: 'bg-black' },
    { id: 'lazio', name: 'Lazio', color: 'bg-sky-400' },
    { id: 'lecce', name: 'Lecce', color: 'bg-yellow-500' },
    { id: 'milan', name: 'Milan', color: 'bg-red-600' },
    { id: 'monza', name: 'Monza', color: 'bg-red-500' },
    { id: 'napoli', name: 'Napoli', color: 'bg-sky-500' },
    { id: 'parma', name: 'Parma', color: 'bg-yellow-400' },
    { id: 'roma', name: 'Roma', color: 'bg-red-700' },
    { id: 'torino', name: 'Torino', color: 'bg-red-900' },
    { id: 'udinese', name: 'Udinese', color: 'bg-black' },
    { id: 'venezia', name: 'Venezia', color: 'bg-orange-500' },
    { id: 'verona', name: 'Verona', color: 'bg-blue-800' }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10B981]/20 via-[#0F172A] to-[#0F172A] opacity-60 pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#0EA5E9] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <ShieldAlert className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest leading-none uppercase italic" style={{ fontFamily: 'impact, sans-serif' }}>
            Tattica <span className="text-[#10B981]">&</span> Pronostici
          </h1>
          <p className="text-sm text-[#94A3B8] font-semibold mt-2">L'Ecosistema Calcistico Definitivo</p>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-[#94A3B8] mb-2 tracking-wider">Crea il tuo Account</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Il tuo nome o nickname"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-[#475569] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                />
              </div>
            </div>
            <button 
              onClick={handleNext}
              disabled={username.trim().length < 3}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white font-black py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              Continua <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-[#94A3B8] mb-3 tracking-wider text-center">Seleziona la tua Squadra</label>
              <div className="h-64 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                {ALL_TEAMS.map((team) => (
                  <button 
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full flex items-center p-3 rounded-xl border transition-all ${selectedTeam?.id === team.id ? 'border-[#10B981] bg-[#10B981]/10' : 'border-[#334155] bg-[#0F172A] hover:border-[#475569]'}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${team.color} mr-3 border border-white/20 shadow-inner`} />
                    <span className="font-bold text-white">{team.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={handleRegister}
              disabled={!selectedTeam}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#0EA5E9] text-white font-black py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              Entra nel Portale
            </button>
            <button onClick={() => setStep(1)} className="w-full text-center text-xs text-[#94A3B8] font-bold mt-2">
              Indietro
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 text-[#64748B] text-[10px] font-black uppercase tracking-widest">
        Created by <span className="text-[#10B981]">Luca Pinelli</span>
      </div>
    </div>
  );
}
