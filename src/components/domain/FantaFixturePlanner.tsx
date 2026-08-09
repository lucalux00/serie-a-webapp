"use client";

import useSWR from 'swr';
import { CalendarDays, Home, Plane, ShieldAlert } from 'lucide-react';

type Fixture = { team: string; opponent: string; isHome: boolean; date: string; matchday?: number | null; difficulty: number; difficultyPercent?: number };
type PlannerResponse = { fixtures: Fixture[]; unavailable?: boolean; source?: string; strengthPeriod?: string; updatedAt?: string };
const fetcher = async (url: string) => { const response = await fetch(url); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Richiesta non riuscita'); return body; };

export default function FantaFixturePlanner() {
  const { data, isLoading, error, mutate } = useSWR<PlannerResponse>('/api/fantacalcio/planner', fetcher, { dedupingInterval: 300000 });
  if (isLoading) return <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 text-sm text-slate-400">Calcolo il calendario della tua rosa…</div>;
  if (error) return <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-100">Planner non disponibile. <button type="button" onClick={() => mutate()} className="font-black underline">Riprova</button></div>;
  if (data?.unavailable) return <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">Calendario momentaneamente non disponibile: nessun dato viene simulato.</div>;
  const fixtures = data?.fixtures ?? [];

  return <section className="rounded-2xl border border-sky-400/25 bg-[#102039] p-5">
    <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-sky-300" /><div><h3 className="font-black text-white">Planner 5 giornate</h3><p className="text-xs text-slate-400">Avversario, sede, data e difficoltà dei club nella tua rosa.</p></div></div>
    {fixtures.length ? <div className="space-y-2">{fixtures.map((fixture, index) => <div key={`${fixture.team}-${fixture.date}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3"><div><p className="text-sm font-black text-white">{fixture.team} <span className="text-slate-500">vs</span> {fixture.opponent}</p><p className="text-[11px] text-slate-400">G{fixture.matchday ?? '—'} · {new Date(fixture.date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · difficoltà {fixture.difficultyPercent ?? '—'}/100</p></div>{fixture.isHome ? <Home className="h-4 w-4 text-emerald-300" /> : <Plane className="h-4 w-4 text-amber-300" />}<div className="flex gap-0.5" aria-label={`Difficoltà ${fixture.difficulty} su 5`}>{[1, 2, 3, 4, 5].map((level) => <span key={level} className={`h-5 w-1.5 rounded-full ${level <= fixture.difficulty ? 'bg-rose-400' : 'bg-slate-700'}`} />)}</div></div>)}</div> : <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-600 p-4 text-sm text-slate-400"><ShieldAlert className="h-4 w-4" />Aggiungi giocatori alla rosa per pianificare le prossime giornate.</div>}
    <p className="mt-3 text-right text-[10px] text-slate-500">Fonte {data?.source || 'in aggiornamento'} · forza squadre {data?.strengthPeriod || '—'}</p>
  </section>;
}
