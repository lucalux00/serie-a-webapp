"use client";

import React, { useState, useEffect } from 'react';
import { Target, ExternalLink, Calculator, AlertTriangle, Info, Loader2 } from 'lucide-react';

export default function PronosticiPage() {
  // Variabili di affiliazione (da compilare)
  const bookmakerName = "SNAI"; // Es. "SNAI", "Bet365", "Eurobet"
  const affiliateLink = ""; // Es. "https://..."

  const baseBetAmount = 10; // Importo base per il calcolo della stima di vincita

  const [weeklyPredictions, setWeeklyPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPredictions() {
      try {
        const res = await fetch('/api/pronostici');
        if (res.ok) {
          const data = await res.json();
          setWeeklyPredictions(data.predictions || []);
        }
      } catch (error) {
        console.error("Failed to fetch real predictions", error);
      } finally {
        setLoading(false);
      }
    }
    loadPredictions();
  }, []);

  const totalOdds = weeklyPredictions.reduce((acc, curr) => acc * curr.odds, 1);
  const potentialWin = totalOdds * baseBetAmount;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] p-4 text-[#94A3B8]">
        <Loader2 className="animate-spin mb-4 text-[#0EA5E9]" size={40} />
        <p className="font-bold uppercase tracking-widest text-xs">Calcolo pronostici sui match reali...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 p-4">
      {/* Intestazione */}
      <div className="flex items-center mb-4 mt-2">
        <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9] mr-3">
          <Target size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">I Pronostici del Weekend</h1>
          <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest">Match Analysis & Dati</p>
        </div>
      </div>
      
      <p className="text-sm text-[#cbd5e1] mb-6 bg-[#1E293B] p-4 rounded-xl border border-[#334155] shadow-sm">
        Scopri le selezioni esclusive del nostro algoritmo basate sulle statistiche reali dei prossimi incontri di Serie A.
      </p>

      {/* Lista Pronostici */}
      <div className="mb-8 space-y-3">
        {weeklyPredictions.length > 0 ? weeklyPredictions.map(pred => (
          <div key={pred.id} className="bg-[#1E293B] rounded-xl p-4 flex justify-between items-center border border-[#334155] shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0EA5E9]" />
            <div className="pl-2">
              <div className="font-black text-[#F8FAFC] text-sm mb-1">{pred.match}</div>
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Pronostico: <span className="text-[#10B981]">{pred.pick}</span></div>
            </div>
            <div className="bg-[#0F172A] px-3 py-2 rounded-lg border border-[#334155] min-w-[60px] text-center">
              <span className="block text-[10px] text-[#64748B] font-bold uppercase mb-0.5">Quota</span>
              <span className="font-black text-white">{pred.odds.toFixed(2)}</span>
            </div>
          </div>
        )) : (
          <div className="bg-[#1E293B] p-4 text-center rounded-xl border border-[#334155] text-white">Nessuna partita in programma trovata.</div>
        )}
      </div>

      {/* La Bolletta */}
      {weeklyPredictions.length > 0 && (
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#334155] p-5 rounded-2xl shadow-xl relative overflow-hidden mb-6">
        <div className="flex items-center mb-4 border-b border-[#334155] pb-3">
          <Calculator className="text-[#0EA5E9] mr-2" size={20} />
          <h2 className="text-lg font-black text-white">La Bolletta</h2>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#94A3B8] font-bold">Quota Totale</span>
          <span className="font-black text-xl text-[#0EA5E9]">{totalOdds.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-5">
          <span className="text-sm text-[#94A3B8] font-bold flex items-center">
            Moltiplicatore con {baseBetAmount}€
            <Info size={12} className="ml-1 text-[#64748B]" />
          </span>
          <span className="font-black text-2xl text-[#10B981]">~ {potentialWin.toFixed(2)}€</span>
        </div>

        {/* Bottone di Affiliazione Neutro (Decreto Dignità compliance) */}
        <a 
          href={affiliateLink || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center bg-[#0EA5E9] hover:bg-[#0284c7] text-white font-black py-4 rounded-xl active:scale-95 transition-transform shadow-lg group"
        >
          {bookmakerName ? `COMPARA LA BOLLETTA SU ${bookmakerName.toUpperCase()}` : "COMPARA LA BOLLETTA SUL SITO"}
          <ExternalLink size={18} className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
      )}

      {/* Sezione Legale / Decreto Dignità */}
      <div className="bg-[#0F172A] border border-[#334155]/50 p-4 rounded-xl text-center flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#64748B] flex items-center justify-center">
            <span className="text-[#64748B] font-black text-xs">+18</span>
          </div>
          <AlertTriangle className="text-[#64748B]" size={20} />
        </div>
        <p className="text-[10px] text-[#64748B] font-medium leading-relaxed max-w-[90%] uppercase tracking-wide">
          Riservato ai maggiori di 18 anni. Il gioco può causare dipendenza patologica. 
          Le quote indicate sono soggette a variazioni. Consulta le probabilità di vincita sul sito del concessionario ufficiale.
        </p>
      </div>
    </div>
  );
}
