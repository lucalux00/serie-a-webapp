"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Outfit } from 'next/font/google';
import { ShieldAlert, ArrowRight, UserCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const outfit = Outfit({ subsets: ['latin'], weight: ['900'] });

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

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<1 | 2>(1);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNextRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Inserisci un nome valido.');
      return;
    }
    if (!email.includes('@')) {
      setError('Inserisci un\'email valida.');
      return;
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    setStep(2);
  };

  const handleRegisterSubmit = async () => {
    if (!selectedTeam) {
      setError('Seleziona una squadra.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(name, email, password, selectedTeam.id);
    } catch (err: any) {
      setError(err.message || 'Errore di registrazione');
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Errore di login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--color-sport-primary)]/20 via-[#0F172A] to-[#0F172A] opacity-60 pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <ShieldAlert className="text-white w-8 h-8" />
          </div>
          <h1 className={`text-3xl text-white tracking-widest leading-none uppercase italic ${outfit.className}`}>
            TATTICA <span className="text-[var(--color-sport-primary)]">&</span> PRONOSTICI
          </h1>
          <p className="text-sm text-[#94A3B8] font-semibold mt-2">L'Ecosistema Calcistico Definitivo</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-[#94A3B8] mb-2 tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="La tua email"
                  autoComplete="email"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-[#475569] focus:outline-none focus:border-[var(--color-sport-primary)] focus:ring-1 focus:ring-[var(--color-sport-primary)] transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-[#94A3B8] mb-2 tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La tua password"
                  autoComplete="current-password"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-4 pl-12 pr-12 text-white font-bold placeholder:text-[#475569] focus:outline-none focus:border-[var(--color-sport-primary)] focus:ring-1 focus:ring-[var(--color-sport-primary)] transition-all"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[var(--color-sport-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)] text-white font-black py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              {loading ? 'Accesso...' : 'Entra'} <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-xs text-[#94A3B8] font-bold hover:text-white transition-colors">
                Non hai un account? Registrati
              </button>
            </div>
          </form>
        ) : (
          <>
            {step === 1 ? (
              <form onSubmit={handleNextRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-[#94A3B8] mb-2 tracking-wider">Nome</label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Il tuo nome o nickname"
                      autoComplete="name"
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-3 pl-12 pr-4 text-white font-bold placeholder:text-[#475569] focus:outline-none focus:border-[var(--color-sport-primary)] focus:ring-1 focus:ring-[var(--color-sport-primary)] transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-[#94A3B8] mb-2 tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="La tua email"
                      autoComplete="email"
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-3 pl-12 pr-4 text-white font-bold placeholder:text-[#475569] focus:outline-none focus:border-[var(--color-sport-primary)] focus:ring-1 focus:ring-[var(--color-sport-primary)] transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-[#94A3B8] mb-2 tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crea una password (min 6 car.)"
                      autoComplete="new-password"
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-3 pl-12 pr-12 text-white font-bold placeholder:text-[#475569] focus:outline-none focus:border-[var(--color-sport-primary)] focus:ring-1 focus:ring-[var(--color-sport-primary)] transition-all"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[var(--color-sport-primary)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-[#94A3B8] mb-2 tracking-wider">Conferma Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ripeti la password"
                      autoComplete="new-password"
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-3 pl-12 pr-12 text-white font-bold placeholder:text-[#475569] focus:outline-none focus:border-[var(--color-sport-primary)] focus:ring-1 focus:ring-[var(--color-sport-primary)] transition-all"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[var(--color-sport-primary)] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full mt-4 bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)] text-white font-black py-4 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  Scegli Squadra <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-xs text-[#94A3B8] font-bold hover:text-white transition-colors">
                    Hai già un account? Accedi
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-[#94A3B8] mb-3 tracking-wider text-center">Seleziona la tua Squadra</label>
                  <div className="h-64 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                    {ALL_TEAMS.map((team) => (
                      <button 
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`w-full flex items-center p-3 rounded-xl border transition-all ${selectedTeam?.id === team.id ? 'border-[var(--color-sport-primary)] bg-[var(--color-sport-primary)]/10' : 'border-[#334155] bg-[#0F172A] hover:border-[#475569]'}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${team.color} mr-3 border border-white/20 shadow-inner`} />
                        <span className="font-bold text-white">{team.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleRegisterSubmit}
                  disabled={!selectedTeam || loading}
                  className="w-full bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)] text-white font-black py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  {loading ? 'Registrazione...' : 'Completa Registrazione'}
                </button>
                <button onClick={() => setStep(1)} className="w-full text-center text-xs text-[#94A3B8] font-bold mt-2 hover:text-white transition-colors">
                  Indietro
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
