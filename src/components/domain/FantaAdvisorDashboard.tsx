"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { Cpu, Shield, AlertTriangle, TrendingUp, TrendingDown, Info, Loader2, Lock, BarChart3, BrainCircuit, Zap } from 'lucide-react';
import PremiumPaywall from '@/components/ui/PremiumPaywall';
import { useSubscription } from '@/contexts/SubscriptionContext';

const fetcher = (url: string) => fetch(url).then(res => res.json());
const PREMIUM_PREVIEW_SCORES = [7.8, 7.4, 7.1];

interface AdvisorPlayer {
  id: number | string;
  playerName: string;
  teamName?: string;
  role: string;
  score: number;
  successProbability?: number;
  matchInfo: string;
}

// Componente demo delle stat premium (sfocato in background)
function PremiumPreviewBlur() {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Contenuto demo sfocato */}
      <div className="blur-sm pointer-events-none select-none space-y-3 opacity-70">
        <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit size={16} className="text-indigo-400" />
            <span className="text-white font-black text-sm">Predizione Rendimento AI</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Martinez', 'Theo', 'Barella'].map((n, index) => (
              <div key={n} className="bg-[#0f172a] rounded-lg p-2 text-center">
                <p className="text-xs text-[#94A3B8]">{n}</p>
                <p className="text-[#10B981] font-black">{PREMIUM_PREVIEW_SCORES[index]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-purple-400" />
            <span className="text-white font-black text-sm">Heat Map Forma Recente</span>
          </div>
          <div className="flex gap-1">
            {[8, 6, 7, 5, 9, 7, 6, 8, 7, 9].map((v, i) => (
              <div key={i} className="flex-1 rounded" style={{ height: 32, backgroundColor: `rgba(16,185,129,${v / 10})` }} />
            ))}
          </div>
        </div>
        <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-[#F59E0B]" />
            <span className="text-white font-black text-sm">Capitano Consigliato AI</span>
          </div>
          <p className="text-2xl font-black text-[#F59E0B]">Lautaro M.</p>
          <p className="text-xs text-[#94A3B8]">Score predetto: 8.4 — Avversario debole in trasferta</p>
        </div>
      </div>

      {/* Overlay lock */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#0f172a]/90 via-[#0f172a]/60 to-transparent">
        <Lock className="text-[#F59E0B] w-10 h-10 drop-shadow-lg" />
      </div>
    </div>
  );
}

export default function FantaAdvisorDashboard() {
  const { data, error, isLoading } = useSWR('/api/fantacalcio/advisor', fetcher);
  const { isPremium } = useSubscription();
  const [comparisonPlayer, setComparisonPlayer] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mb-4" />
        <p className="text-[#94A3B8] font-bold text-sm animate-pulse">L&apos;IA sta analizzando la tua rosa...</p>
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
        <p className="text-[#94A3B8] text-sm">Aggiungi giocatori al tuo roster per ricevere i consigli dell&apos;Intelligenza Artificiale.</p>
        <a href="/profilo" className="text-[#10B981] font-bold text-sm block mt-4">Vai al Profilo</a>
      </div>
    );
  }

  const playerScores = data.playerScores as AdvisorPlayer[];
  const avgScore = playerScores.reduce((acc, player) => acc + player.score, 0) / playerScores.length;
  
  // Trova i 3 migliori e i 3 peggiori tra tutti i giocatori
  const topPlayers = playerScores.slice(0, 3);
  const bottomPlayers = (data.suggestedCuts || []) as AdvisorPlayer[];
  const comparisonOptions = playerScores.slice(0, 8);
  const comparisonBase = topPlayers[0];
  const comparisonTarget = comparisonOptions.find((player) => player.playerName === comparisonPlayer) || topPlayers[1] || comparisonBase;
  const comparisonDelta = comparisonTarget.score - comparisonBase.score;
  const startingPlayerNames = new Set(((data.recommendedLineup || []) as AdvisorPlayer[]).map((player) => player.playerName));
  const substitutionCandidates = playerScores.filter((player) => !startingPlayerNames.has(player.playerName)).slice(0, 3);

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
            <h2 className="text-xl font-bold text-[#F8FAFC]">Consigli per la giornata</h2>
            <p className="text-xs text-[#10B981] font-bold uppercase tracking-wider">La tua decisione room • Giornata {data.matchday}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155]">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1">Indice rosa</p>
            <div className="text-2xl font-black text-white flex items-end">
              {avgScore.toFixed(1)} <span className="text-sm text-[#64748B] ml-1 mb-1">/100</span>
            </div>
          </div>
          <div className="bg-[#0F172A] p-4 rounded-xl border border-[#334155]">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-1">Modulo suggerito</p>
            <div className="text-2xl font-black text-[#10B981]">
              {data.bestFormation || '4-3-3'}
            </div>
          </div>
        </div>
      </div>

      {/* TOP PLAYERS DELLA GIORNATA */}
      <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155]">
        <h3 className="text-white font-black flex items-center mb-4">
          <TrendingUp className="text-[#10B981] mr-2" /> Da schierare
        </h3>
        <div className="space-y-3">
          {topPlayers.map((p) => (
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
          <TrendingDown className="text-[#EF4444] mr-2" /> Da evitare o monitorare
        </h3>
        <p className="text-xs text-[#94A3B8] mb-4">Giocatori con indice basso (partite difficili o squadre in difficoltà).</p>
        
        {bottomPlayers.length > 0 ? (
          <div className="space-y-3">
            {bottomPlayers.map((p) => (
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

      {/* ==================== SEZIONE PREMIUM ==================== */}
      <div className="relative">
        {/* Divisore premium */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#F59E0B]/30 to-transparent" />
          <div className="flex items-center gap-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3 py-1.5 rounded-full">
            <Shield size={12} className="text-[#F59E0B]" />
            <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">AI Pro</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#F59E0B]/30 to-transparent" />
        </div>

        {isPremium ? (
          <div className="mb-4 rounded-2xl border border-[#F59E0B]/40 bg-gradient-to-br from-[#2A1A06] via-[#1E293B] to-[#17133B] p-5 shadow-[0_10px_30px_rgba(245,158,11,0.12)]">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F59E0B]/20 text-[#F59E0B]">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F59E0B]">AI Pro • Sbloccato</p>
                  <h3 className="text-base font-black text-white">Decisioni avanzate</h3>
                </div>
              </div>
              <span className="rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-2 py-1 text-[9px] font-black text-[#FCD34D]">PRO</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-indigo-400/30 bg-[#0F172A]/80 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Capitano AI</p>
                <p className="mt-2 truncate text-lg font-black text-white">{topPlayers[0]?.playerName || '—'}</p>
                <p className="text-[11px] font-bold text-[#10B981]">Indice {topPlayers[0]?.score ?? '—'}/100</p>
              </div>
              <div className="rounded-xl border border-[#F59E0B]/30 bg-[#0F172A]/80 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">Forma recente</p>
                <div className="mt-3 flex h-7 items-end gap-1">
                  {[45, 65, 52, 78, 68, 92].map((height, index) => (
                    <span key={index} className="flex-1 rounded-sm bg-gradient-to-t from-[#F59E0B] to-[#FDE68A]" style={{ height: `${height}%` }} />
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-[#94A3B8]">Trend in crescita</p>
              </div>
              <div className="rounded-xl border border-violet-400/30 bg-[#0F172A]/80 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Panchina smart</p>
                <p className="mt-2 truncate text-lg font-black text-white">{topPlayers[1]?.playerName || '—'}</p>
                <p className="text-[11px] text-[#94A3B8]">Prima alternativa consigliata</p>
              </div>
            </div>
            <p className="mt-4 text-center text-[10px] text-[#94A3B8]">Le schede ambra e viola sono funzioni Pro. Le sezioni verdi restano disponibili per tutti.</p>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-violet-400/30 bg-[#0F172A]/75 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-black text-white">Confronto schieramento</p>
                  <span className="text-[9px] font-black uppercase tracking-wider text-violet-300">Pro</span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">Confronta il miglior profilo della rosa con un&apos;alternativa prima di consegnare la formazione.</p>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="rounded-lg bg-[#1E293B] p-2 text-center">
                    <p className="truncate text-xs font-bold text-white">{comparisonBase.playerName}</p>
                    <p className="text-lg font-black text-[#10B981]">{comparisonBase.score}</p>
                  </div>
                  <span className="text-xs font-black text-[#FCD34D]">VS</span>
                  <div className="rounded-lg bg-[#1E293B] p-2 text-center">
                    <select value={comparisonPlayer} onChange={(event) => setComparisonPlayer(event.target.value)} className="w-full bg-transparent text-center text-xs font-bold text-white outline-none">
                      {comparisonOptions.filter((player) => player.playerName !== comparisonBase.playerName).map((player) => (
                        <option key={player.id} value={player.playerName} className="bg-[#1E293B]">{player.playerName}</option>
                      ))}
                    </select>
                    <p className={`text-lg font-black ${comparisonDelta > 0 ? 'text-[#10B981]' : 'text-[#FCA5A5]'}`}>{comparisonTarget.score}</p>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] text-[#CBD5E1]">{comparisonDelta === 0 ? 'Profili equivalenti: scegli in base al rischio.' : `${comparisonDelta > 0 ? comparisonTarget.playerName : comparisonBase.playerName} ha un vantaggio di ${Math.abs(comparisonDelta)} punti FantaScore.`}</p>
                <p className="mt-1 text-center text-[10px] text-[#FCD34D]">Probabilità di rendimento positivo: {comparisonBase.playerName} {comparisonBase.successProbability ?? '—'}% • {comparisonTarget.playerName} {comparisonTarget.successProbability ?? '—'}%</p>
              </div>

              <div className="rounded-xl border border-[#F59E0B]/30 bg-[#0F172A]/75 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-black text-white">Radar azioni personali</p>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#FCD34D]">Pro</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="rounded-lg border border-[#10B981]/20 bg-[#10B981]/10 p-2 text-[#D1FAE5]">Schiera {comparisonBase.playerName}: {comparisonBase.matchInfo}</div>
                  {bottomPlayers[0] ? <div className="rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 p-2 text-[#FECACA]">Monitora {bottomPlayers[0].playerName}: indice {bottomPlayers[0].score}/100 per questa giornata.</div> : <div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-2 text-[#FEF3C7]">Nessun rischio critico rilevato nella rosa per questa giornata.</div>}
                  <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-100">Piano 5 giornate: conserva i tuoi migliori profili e rivaluta il mercato dopo la prossima giornata.</div>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#F59E0B]/30 bg-[#0F172A]/75 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white">Sostituzioni consigliate</p>
                  <p className="text-[11px] text-[#94A3B8]">Prime alternative dalla tua rosa, ordinate per FantaScore.</p>
                  <p className="mt-1 text-[10px] font-bold text-[#FCD34D]">Capitano consigliato: {comparisonBase.playerName} • {comparisonBase.successProbability ?? '—'}% di rendimento positivo</p>
                </div>
                <span className="rounded-full bg-[#F59E0B]/10 px-2 py-1 text-[9px] font-black text-[#FCD34D]">AI PRO</span>
              </div>
              {substitutionCandidates.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {substitutionCandidates.map((player) => (
                    <div key={player.id} className="rounded-lg border border-[#334155] bg-[#1E293B] p-3">
                      <p className="truncate text-sm font-black text-white">{player.playerName}</p>
                      <p className="mt-1 text-[10px] text-[#CBD5E1]">{player.matchInfo}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-[#FCD34D]">{player.score}/100</span>
                        <span className="text-[10px] font-bold text-[#10B981]">{player.successProbability ?? '—'}% positivo</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-[#475569] p-3 text-center text-xs text-[#94A3B8]">Aggiungi più giocatori alla rosa per ricevere alternative di sostituzione.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview sfocata */}
            <PremiumPreviewBlur />
            {/* Paywall */}
            <PremiumPaywall
              planName="AI Pro"
              price="€0,99"
              priceLabel="/ mese"
              ctaLabel="Sblocca AI Pro"
            />
          </div>
        )}
      </div>

    </div>
  );
}

