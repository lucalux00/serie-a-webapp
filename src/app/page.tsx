"use client";

import React from 'react';
import TeamSelector from '@/components/domain/TeamSelector';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, Star } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Mappa colori per squadra (semplificata per le big, fallback per le altre)
  const getTeamColor = (id: string | null) => {
    switch (id) {
      case 'napoli': return 'from-[#0EA5E9] to-[#0284C7] shadow-[0_0_40px_rgba(14,165,233,0.3)] border-[#0EA5E9]/50';
      case 'inter': return 'from-[#1E3A8A] to-[#000000] shadow-[0_0_40px_rgba(30,58,138,0.3)] border-[#1E3A8A]/50';
      case 'milan': return 'from-[#DC2626] to-[#000000] shadow-[0_0_40px_rgba(220,38,38,0.3)] border-[#DC2626]/50';
      case 'juventus': return 'from-[#475569] to-[#000000] shadow-[0_0_40px_rgba(255,255,255,0.2)] border-[#94A3B8]/50';
      case 'roma': return 'from-[#B91C1C] to-[#D97706] shadow-[0_0_40px_rgba(185,28,28,0.3)] border-[#D97706]/50';
      case 'lazio': return 'from-[#38BDF8] to-[#0F172A] shadow-[0_0_40px_rgba(56,189,248,0.3)] border-[#38BDF8]/50';
      case 'atalanta': return 'from-[#1E3A8A] to-[#0F172A] shadow-[0_0_40px_rgba(30,58,138,0.3)] border-[#38BDF8]/50';
      case 'fiorentina': return 'from-[#7C3AED] to-[#4C1D95] shadow-[0_0_40px_rgba(124,58,237,0.3)] border-[#7C3AED]/50';
      default: return 'from-[#10B981] to-[#059669] shadow-[0_0_40px_rgba(16,185,129,0.3)] border-[#10B981]/50';
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 space-y-6">
      
      {/* Saluto Utente */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h2 className="text-[#94A3B8] text-sm font-bold uppercase tracking-wider">Bentornato,</h2>
          <h1 className="text-3xl font-black text-white">{user?.username}</h1>
        </div>
        <div className="w-12 h-12 bg-[#1E293B] rounded-full border-2 border-[#334155] flex items-center justify-center font-black text-xl text-[#10B981]">
          {user?.username.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Banner Squadra Preferita */}
      {user?.favoriteTeamId && (
        <div 
          onClick={() => router.push(`/squadra/${user.favoriteTeamId}`)}
          className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br border cursor-pointer active:scale-95 transition-transform ${getTeamColor(user.favoriteTeamId)}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star size={100} />
          </div>
          <div className="flex items-center text-white/80 font-bold text-xs uppercase tracking-widest mb-1">
            <Star size={12} className="mr-1" /> La Tua Squadra
          </div>
          <h2 className="text-4xl font-black text-white mb-4 drop-shadow-md capitalize">{user.favoriteTeamName}</h2>
          
          <button className="bg-white/20 hover:bg-white/30 text-white font-black py-2 px-4 rounded-xl flex items-center backdrop-blur-sm transition-colors text-sm">
            Entra nel Club Hub <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-black mb-4">Esplora altre squadre</h2>
        <TeamSelector />
      </div>
    </div>
  );
}
