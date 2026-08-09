"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { Check, Crown, Lightbulb, Plus, Target, TrendingUp, WalletCards } from 'lucide-react';
import PremiumPaywall from '@/components/ui/PremiumPaywall';
import { useSubscription } from '@/contexts/SubscriptionContext';
import FantaPlayerInsightCard, { FantaInsightPlayer } from '@/components/domain/FantaPlayerInsightCard';

const fetcher = async (url: string) => { const response = await fetch(url); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Richiesta non riuscita'); return body; };
type Candidate = FantaInsightPlayer & { name: string; team: string; marketValue: string; costBand: string; priority: number; reason: string; category: 'top' | 'value' | 'sleepers' };
type Market = {
  methodology: string;
  gaps: Array<{ role: string; current: number; target: number; missing: number }>;
  picks: { top: Candidate[]; value: Candidate[]; sleepers: Candidate[] };
  coverage?: { statisticsPercent: number; fixturePercent: number };
  source?: string;
  updatedAt?: string;
};

const categoryMeta = {
  top: { title: 'Top di reparto', subtitle: 'Profili forti per chi vuole investire', icon: Crown, color: 'amber' },
  value: { title: 'Affidabili di valore', subtitle: 'Equilibrio tra qualità e budget', icon: TrendingUp, color: 'sky' },
  sleepers: { title: 'Scommesse low-cost', subtitle: 'Occasioni da monitorare con dati e calendario', icon: Lightbulb, color: 'emerald' },
} as const;

function CandidateCard({ candidate, onAdd, adding, added }: { candidate: Candidate; onAdd: (candidate: Candidate) => void; adding: string | null; added: string[] }) {
  const isAdded = added.includes(candidate.name);
  const action = <button type="button" disabled={adding === candidate.name || isAdded} onClick={() => onAdd(candidate)} className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-emerald-400 px-3 text-xs font-black text-slate-950 disabled:opacity-50">{isAdded ? <><Check size={14} />IN ROSA</> : <><Plus size={14} />{adding === candidate.name ? '…' : 'AGGIUNGI'}</>}</button>;
  return <FantaPlayerInsightCard player={candidate} action={action} reason={candidate.reason} marketValue={candidate.marketValue} />;
}

export default function FantaMarketDashboard({ onOpenRoster }: { onOpenRoster: () => void }) {
  const [role, setRole] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const { data: market, error, mutate } = useSWR<Market>(isPremium ? '/api/fantacalcio/market-ai' : null, fetcher, { dedupingInterval: 300000 });
  const { data: recommendations, error: roleError, mutate: refreshRole } = useSWR<{ candidates: Candidate[] }>(isPremium && role ? `/api/fantacalcio/market-ai?role=${role}` : null, fetcher, { dedupingInterval: 300000 });

  async function add(candidate: Candidate) {
    setAdding(candidate.name);
    setMessage('');
    try {
      const response = await fetch('/api/fanta-roster', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', player_name: candidate.name, team_name: candidate.team, role: candidate.role }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Impossibile aggiungere il giocatore');
      setAdded((items) => [...items, candidate.name]);
      setMessage(`${candidate.name} aggiunto alla rosa.`);
      await Promise.all([mutate(), refreshRole()]);
    } catch (addError: unknown) {
      setMessage(addError instanceof Error ? addError.message : 'Operazione non riuscita');
    } finally {
      setAdding(null);
    }
  }

  if (subscriptionLoading) return <p className="p-6 text-slate-400">Verifico il tuo accesso Fanta Pro…</p>;
  if (!isPremium) return <section className="space-y-4"><div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#35200a] via-[#1E293B] to-[#162033] p-6"><Target className="mb-2 text-amber-400" /><p className="text-xs font-black uppercase tracking-widest text-amber-300">Mercato AI · Fanta Pro</p><h2 className="mt-1 text-2xl font-black text-white">Top, valore e scommesse low-cost</h2><p className="mt-3 text-sm leading-relaxed text-slate-300">Ogni profilo include avversario, orario, stime, statistiche, fonti e affidabilità.</p></div><PremiumPaywall planName="Fanta Pro" price="€0,99" priceLabel="/ mese" ctaLabel="Scopri l’accesso Pro" /></section>;
  if (error) return <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">Scouting board non disponibile. <button type="button" onClick={() => mutate()} className="font-black underline">Riprova</button></div>;
  if (!market) return <p className="p-6 text-slate-400">Incrocio listone, calendario e statistiche…</p>;
  const roleCandidates = recommendations?.candidates || [];
  const updated = market.updatedAt ? new Date(market.updatedAt) : null;

  return <div className="space-y-5">
    <header className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#35200a] via-[#1E293B] to-[#162033] p-6"><Target className="mb-2 text-amber-400" /><p className="text-xs font-black uppercase tracking-widest text-amber-300">Mercato AI · scouting board</p><h2 className="mt-1 text-2xl font-black text-white">Un nome motivato per ogni budget</h2><p className="mt-3 text-xs leading-relaxed text-slate-300">{market.methodology}</p>{market.coverage ? <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[10px]"><div className="rounded-xl bg-slate-950/50 p-2"><b className="block text-lg text-white">{market.coverage.fixturePercent}%</b>calendario coperto</div><div className="rounded-xl bg-slate-950/50 p-2"><b className="block text-lg text-white">{market.coverage.statisticsPercent}%</b>statistiche coperte</div></div> : null}{updated && Number.isFinite(updated.getTime()) ? <p className="mt-2 text-right text-[10px] text-slate-500">Aggiornato {updated.toLocaleString('it-IT')}</p> : null}</header>
    {message ? <button type="button" onClick={message.includes('aggiunto') ? onOpenRoster : undefined} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-center text-xs font-bold text-slate-200">{message}{message.includes('aggiunto') ? ' · Apri la rosa' : ''}</button> : null}
    <section className="space-y-4">{(Object.keys(categoryMeta) as Array<keyof typeof categoryMeta>).map((category) => { const meta = categoryMeta[category]; const Icon = meta.icon; const border = meta.color === 'amber' ? 'border-amber-400/25' : meta.color === 'sky' ? 'border-sky-400/25' : 'border-emerald-400/25'; return <div key={category} className={`rounded-3xl border ${border} bg-slate-800 p-5`}><div className="mb-4 flex items-center gap-2"><div className="rounded-xl bg-slate-900 p-2 text-white"><Icon size={19} /></div><div><h3 className="font-black text-white">{meta.title}</h3><p className="text-xs text-slate-400">{meta.subtitle}</p></div></div><div className="grid gap-3">{market.picks?.[category]?.map((candidate) => <CandidateCard key={candidate.name} candidate={candidate} onAdd={add} adding={adding} added={added} />)}{!market.picks?.[category]?.length ? <p className="rounded-xl border border-dashed border-slate-600 p-4 text-center text-sm text-slate-400">Nessun profilo con copertura sufficiente in questa fascia.</p> : null}</div></div>; })}</section>
    <section className="rounded-3xl border border-amber-400/25 bg-slate-800 p-5"><div className="mb-4 flex items-center gap-2"><WalletCards className="h-5 w-5 text-amber-300" /><div><h3 className="font-black text-white">Analisi per reparto</h3><p className="text-xs text-slate-400">Parti dai buchi della rosa, poi confronta i profili con tutti gli indicatori.</p></div></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{market.gaps.map((gap) => <button type="button" key={gap.role} onClick={() => setRole(gap.role)} className={`rounded-2xl border p-4 text-left ${role === gap.role ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 bg-slate-900'}`}><b className="text-lg text-white">{gap.role}</b><p className="mt-1 text-2xl font-black text-white">{gap.current}/{gap.target}</p><span className="text-xs font-bold text-amber-300">{gap.missing ? `Mancano ${gap.missing}` : 'Reparto coperto'}</span></button>)}</div>{role ? <div className="mt-5 space-y-3"><p className="text-sm font-black text-white">Profili {role} per priorità</p>{roleError ? <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">Confronto reparto non disponibile.</p> : roleCandidates.map((candidate) => <CandidateCard key={candidate.name} candidate={candidate} onAdd={add} adding={adding} added={added} />)}{!roleError && !roleCandidates.length ? <p className="rounded-xl border border-dashed border-slate-600 p-4 text-center text-sm text-slate-400">Carico i profili e verifico la copertura dati…</p> : null}</div> : null}</section>
  </div>;
}
