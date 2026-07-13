"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthForms() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) throw new Error('Compila tutti i campi.');
        await login(email, password);
      } else {
        if (!name || !email || !password || !confirmPassword) throw new Error('Compila tutti i campi.');
        if (password.length < 6) throw new Error('La password deve essere di almeno 6 caratteri.');
        if (password !== confirmPassword) throw new Error('Le password non coincidono.');
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#1E293B] rounded-3xl p-6 md:p-8 shadow-2xl border border-[#334155] relative overflow-hidden">
        
        {/* Header Tabs */}
        <div className="flex mb-8 border-b border-[#334155]">
          <button 
            type="button"
            className={`flex-1 pb-3 text-center font-black transition-colors ${isLogin ? 'text-[#10B981] border-b-2 border-[#10B981]' : 'text-[#64748B] hover:text-white'}`}
            onClick={() => !loading && setIsLogin(true)}
          >
            ACCEDI
          </button>
          <button 
            type="button"
            className={`flex-1 pb-3 text-center font-black transition-colors ${!isLogin ? 'text-[#10B981] border-b-2 border-[#10B981]' : 'text-[#64748B] hover:text-white'}`}
            onClick={() => !loading && setIsLogin(false)}
          >
            REGISTRATI
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {error && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-xl p-3 flex items-start text-[#EF4444] text-sm font-bold">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#64748B]" />
                </div>
                <input
                  type="text"
                  placeholder="Nome utente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-[#334155] rounded-xl text-white placeholder-[#64748B] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#64748B]" />
              </div>
              <input
                type="email"
                placeholder="Indirizzo Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-[#334155] rounded-xl text-white placeholder-[#64748B] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#64748B]" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-[#334155] rounded-xl text-white placeholder-[#64748B] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#64748B]" />
                </div>
                <input
                  type="password"
                  placeholder="Conferma Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-[#334155] rounded-xl text-white placeholder-[#64748B] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-[#0F172A] bg-[#10B981] hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10B981] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Accedi all\'App' : 'Crea Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
            
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
