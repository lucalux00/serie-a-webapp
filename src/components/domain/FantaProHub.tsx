"use client";

import useSWR from 'swr';
import { ArrowRight, BrainCircuit, CalendarDays, Crown, ShieldAlert, Target, Users } from 'lucide-react';
import PremiumPaywall from '@/components/ui/PremiumPaywall';
import { useSubscription } from '@/contexts/SubscriptionContext';
import FantaFixturePlanner from '@/components/domain/FantaFixturePlanner';
import FantaPlayerCompare, { FantaScoredPlayer } from '@/components/domain/FantaPlayerCompare';

type FantaTab = 'lineup' | 'rosa' | 'advisor' | 'mercato' | 'news';
type AdvisorData = { matchday?: number; playerScores?: FantaScoredPlayer[]; suggestedCuts?: FantaScoredPlayer[]; recommendedLineup?: FantaScoredPlayer[] };
type RosterData = { roster?: unknown[] };
const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function FantaProHub({ onNavigate }: { onNavigate: (tab: FantaTab) => void }) {
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const { data, isLoading } = useSWR<AdvisorData>(isPremium ? '/api/fantacalcio/advisor?scope=pro' : null, fetcher);
  const { data: rosterData } = useSWR<RosterData>(isPremium ? '/api/fanta-roster' : null, fetcher);

  if (subscriptionLoading || (isPremium && isLoading)) return <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-950 to-slate-900 p-8 text-center text-sm text-slate-300">Preparo le azioni prioritarie della tua rosa…</div>;

  if (!isPremium) return <section className="space-y-4"><div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#2A1A06] via-[#17133B] to-slate-900 p-6"><div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-400/15 p-3 text-amber-300"><Crown /></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Fanta Pro</p><h2 className="text-2xl font-black text-white">Decisioni concrete, non una vetrina</h2></div></div><p className="mt-4 text-sm leading-relaxed text-slate-300">Pro collega la formazione, i ballottaggi, il mercato e il calendario della tua rosa in un solo flusso operativo.</p></div><PremiumPaywall planName="Fanta Pro" price="€0,99" priceLabel="/ mese" ctaLabel="Scopri l’accesso Pro" /></section>;

  const players = data?.playerScores ?? [];
  const rosterCount = rosterData?.roster?.length ?? players.length;
  const captain = players[0];
  const concern = data?.suggestedCuts?.[0];
  const formationReady = (data?.recommendedLineup?.length ?? 0) === 11;

  const actionClass = 'group flex w-full items-center justify-between rounded-2xl border border-[#334155] bg-[#1E293B] p-4 text-left transition hover:border-violet-400/60 hover:bg-[#24324A]';
  const arrow = <ArrowRight className="h-5 w-5 shrink-0 text-violet-300 transition group-hover:translate-x-1" />;

  return <section className="space-y-5">
    <header className="rounded-3xl border border-violet-400/35 bg-gradient-to-br from-[#2A1A5B] via-[#17133B] to-[#0F172A] p-6"><div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-400/15 p-3 text-violet-200"><Crown /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">Fanta Pro · Giornata {data?.matchday ?? '—'}</p><h2 className="text-2xl font-black text-white">Cosa fare adesso</h2></div></div><p className="mt-3 text-sm text-slate-300">Tre azioni collegate alle altre tab, ordinate per impatto sulla tua giornata.</p></header>

    <div className="space-y-3">
      <button type="button" onClick={() => onNavigate(rosterCount ? 'lineup' : 'rosa')} className={actionClass}><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300">{rosterCount ? <BrainCircuit size={19} /> : <Users size={19} />}</div><div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">{rosterCount ? 'Priorità 1 · Formazione' : 'Priorità 1 · Rosa'}</p><h3 className="font-black text-white">{rosterCount ? (formationReady ? 'Rivedi la formazione suggerita' : 'Completa la tua formazione') : 'Aggiungi i giocatori della tua rosa'}</h3><p className="mt-1 text-xs text-slate-400">{rosterCount ? `Hai ${rosterCount} giocatori disponibili: passa alla tab Formazione per schierarli.` : 'Senza rosa non possiamo calcolare consigli, mercato o calendario.'}</p></div></div>{arrow}</button>
      <button type="button" onClick={() => onNavigate('advisor')} className={actionClass}><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-400/10 p-2 text-amber-300"><ShieldAlert size={19} /></div><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Priorità 2 · Ballottaggi</p><h3 className="font-black text-white">{captain ? `Valida ${captain.playerName} e i tuoi titolari` : 'Apri i consigli per la giornata'}</h3><p className="mt-1 text-xs text-slate-400">{concern ? `${concern.playerName} è il profilo da monitorare: l’Advisor spiega la scelta.` : 'Controlla titolari, panchina e rischio partita nell’Advisor.'}</p></div></div>{arrow}</button>
      <button type="button" onClick={() => onNavigate('mercato')} className={actionClass}><div className="flex items-center gap-3"><div className="rounded-xl bg-sky-400/10 p-2 text-sky-300"><Target size={19} /></div><div><p className="text-[10px] font-black uppercase tracking-wider text-sky-300">Priorità 3 · Mercato</p><h3 className="font-black text-white">Cerca il prossimo rinforzo</h3><p className="mt-1 text-xs text-slate-400">Apri Mercato AI per individuare i reparti scoperti e confrontare i sostituti verificati.</p></div></div>{arrow}</button>
    </div>

    {players.length ? <FantaPlayerCompare players={players} /> : null}
    <section className="rounded-2xl border border-sky-400/25 bg-[#102039] p-4"><div className="mb-3 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-sky-300" /><div><h3 className="font-black text-white">Pianifica prima della prossima giornata</h3><p className="text-xs text-slate-400">Il calendario serve alle decisioni di formazione e mercato.</p></div></div><FantaFixturePlanner /></section>
  </section>;
}
