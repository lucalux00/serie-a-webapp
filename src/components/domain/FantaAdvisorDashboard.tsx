"use client";

import React from 'react';
import useSWR from 'swr';
import { Cpu, Shield, AlertTriangle, TrendingUp, TrendingDown, Info, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FantaAdvisorDashboard() {
  const { data, error, isLoading } = useSWR('/api/fantacalcio/advisor', fetcher);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mb-4" />
        <p className="text-[#94A3B8] font-bold text-sm animate-pulse">L'IA sta analizzando la tua rosa...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#1E293B] border border-[#EF4444]/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
        <p className="text-[#94A3B8] text-sm">Errore nel caricamento del Fanta-Advisor.</p>
      </div>
    );
  }

  if (!data.playerScores || data.playerScores.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 text-center">
        <Info className="w-8 h-8 text-[#3B82F6] mx-auto mb-2" />
        <p className="text-white font-bold mb-2">La tua rosa è vuota!</p>
        <p className="text-[#94A3B8] text-sm">Aggiungi giocatori al tuo roster per ricevere i consigli dell'Intelligenza Artificiale.</p>
        <a href="/profilo" className="text-[#10B981] font-bold text-sm block mt-4">Vai al Profilo</a>
      </div>
    );
  }

  const avgScore = data.playerScores.reduce((acc: number, p: any) => acc + p.score, 0) / data.playerScores.length;
  
  // Trova i 3 migliori e i 3 peggiori tra tutti i giocatori
  const topPlayers = [...data.playerScores].slice(0, 3);
  const bottomPlayers = data.suggestedCuts || [];

  return (
    <div className="space-y-6">
      
      {/* HEADER AI */}
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
            <p className="text-xs text-[#10B981] font-bold uppercase tracking-wider">Algoritmo Attivo (Giornata {data.matchday})</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155]">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1">Valutazione Rosa</p>
            <div className="text-2xl font-black text-white flex items-end">
              {avgScore.toFixed(1)} <span className="text-sm text-[#64748B] ml-1 mb-1">/100</span>
            </div>
          </div>
          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155]">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1">Modulo Consigliato</p>
            <div className="text-2xl font-black text-[#10B981]">
              {data.bestFormation || '4-3-3'}
            </div>
          </div>
        </div>
      </div>

      {/* TOP PLAYERS DELLA GIORNATA */}
      <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155]">
        <h3 className="text-white font-black flex items-center mb-4">
          <TrendingUp className="text-[#10B981] mr-2" /> Top di Giornata (Consigliati)
        </h3>
        <div className="space-y-3">
          {topPlayers.map((p: any) => (
            <div key={p.id} className="bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-white font-bold">{p.playerName}</span>
                <span className="text-[10px] text-[#94A3B8]">{p.matchInfo}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] font-black px-2 py-1 rounded">{p.role}</span>
                <div className="w-10 h-10 rounded-full border-2 border-[#10B981] flex items-center justify-center font-black text-sm text-[#10B981]">
                  {p.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHI TAGLIARE / DA EVITARE */}
      <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155]">
        <h3 className="text-white font-black flex items-center mb-4">
          <TrendingDown className="text-[#EF4444] mr-2" /> Da Evitare / Svincolare
        </h3>
        <p className="text-xs text-[#94A3B8] mb-4">Giocatori con indice basso (partite difficili o squadre in difficoltà).</p>
        
        {bottomPlayers.length > 0 ? (
          <div className="space-y-3">
            {bottomPlayers.map((p: any) => (
              <div key={p.id} className="bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-white font-bold">{p.playerName}</span>
                  <span className="text-[10px] text-[#94A3B8]">{p.matchInfo}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] bg-[#EF4444]/20 text-[#EF4444] font-black px-2 py-1 rounded">{p.role}</span>
                  <div className="w-10 h-10 rounded-full border-2 border-[#EF4444] flex items-center justify-center font-black text-sm text-[#EF4444]">
                    {p.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0F172A] p-4 rounded-xl border border-dashed border-[#334155] text-center text-sm text-[#10B981] font-bold">
            La tua rosa ha tutti giocatori con indici accettabili per questa giornata!
          </div>
        )}
      </div>

    </div>
  );
}
