"use client";

import useSWR from 'swr';
import { Crown, Sparkles } from 'lucide-react';
import PremiumPaywall from '@/components/ui/PremiumPaywall';
import { useSubscription } from '@/contexts/SubscriptionContext';
import FantaFixturePlanner from '@/components/domain/FantaFixturePlanner';
import FantaPlayerCompare, { FantaScoredPlayer } from '@/components/domain/FantaPlayerCompare';

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function FantaProHub() {
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const { data, isLoading } = useSWR<{ matchday?: number; playerScores?: FantaScoredPlayer[]; suggestedCuts?: FantaScoredPlayer[] }>(isPremium ? '/api/fantacalcio/advisor?scope=pro' : null, fetcher);

  if (subscriptionLoading || (isPremium && isLoading)) return <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-950 to-slate-900 p-8 text-center text-sm text-slate-300">Sto preparando la tua Fanta control room…</div>;

  if (!isPremium) return <section className="space-y-4"><div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#2A1A06] via-[#17133B] to-slate-900 p-6"><div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-400/15 p-3 text-amber-300"><Crown /></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Fanta Pro</p><h2 className="text-2xl font-black text-white">Le decisioni che richiedono più dati</h2></div></div><p className="mt-4 text-sm leading-relaxed text-slate-300">Confronto ballottaggi, planner delle prossime 5 giornate e Mercato AI: strumenti distinti dalle funzioni gratuite, senza ripetere gli stessi consigli.</p></div><PremiumPaywall planName="Fanta Pro" price="€0,99" priceLabel="/ mese" ctaLabel="Scopri l’accesso Pro" /></section>;

  const players = data?.playerScores ?? [];
  const captain = players[0];
  const concern = data?.suggestedCuts?.[0];

  return <section className="space-y-5"><div className="relative overflow-hidden rounded-3xl border border-violet-400/35 bg-gradient-to-br from-[#2A1A5B] via-[#17133B] to-[#0F172A] p-6"><Sparkles className="absolute -right-5 -top-5 h-28 w-28 text-violet-300/10" /><div className="relative"><div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-400/15 p-3 text-violet-200"><Crown /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">Fanta Pro · Giornata {data?.matchday ?? '—'}</p><h2 className="text-2xl font-black text-white">La tua control room</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Capitano AI</p><p className="mt-2 text-lg font-black text-amber-300">{captain?.playerName ?? 'Completa la rosa'}</p><p className="text-xs text-emerald-300">{captain?.score ?? '—'}/100 · {captain?.successProbability ?? '—'}% positivo</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Rischio da monitorare</p><p className="mt-2 text-lg font-black text-rose-300">{concern?.playerName ?? 'Nessuno critico'}</p><p className="text-xs text-slate-300">{concern ? `${concern.score}/100 · ${concern.matchInfo}` : 'La rosa è in equilibrio'}</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Rosa analizzata</p><p className="mt-2 text-lg font-black text-white">{players.length} giocatori</p><p className="text-xs text-violet-200">Dati aggiornati per la giornata</p></div></div></div></div>{players.length ? <FantaPlayerCompare players={players} /> : <div className="rounded-2xl border border-dashed border-slate-600 p-5 text-center text-sm text-slate-400">Aggiungi la tua rosa per attivare confronti e consigli Pro.</div>}<FantaFixturePlanner /></section>;
}
