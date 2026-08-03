"use client";

import useSWR from 'swr';
import { CalendarDays, Home, Plane, ShieldAlert } from 'lucide-react';

type Fixture = { team: string; opponent: string; isHome: boolean; date: string; difficulty: number };
const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function FantaFixturePlanner() {
  const { data, isLoading } = useSWR<{ fixtures: Fixture[]; unavailable?: boolean }>('/api/fantacalcio/planner', fetcher);
  if (isLoading) return <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 text-sm text-slate-400">Calcolo il calendario della tua rosa…</div>;
  if (data?.unavailable) return <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">Calendario momentaneamente non disponibile: riprova più tardi.</div>;
  const fixtures = data?.fixtures ?? [];
  return <section className="rounded-2xl border border-sky-400/25 bg-[#102039] p-5"><div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-sky-300" /><div><h3 className="font-black text-white">Planner 5 giornate</h3><p className="text-xs text-slate-400">Difficoltà delle prossime partite dei club nella tua rosa.</p></div></div>{fixtures.length ? <div className="space-y-2">{fixtures.map((fixture, index) => <div key={`${fixture.team}-${fixture.date}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3"><div><p className="text-sm font-black text-white">{fixture.team} <span className="text-slate-500">vs</span> {fixture.opponent}</p><p className="text-[11px] text-slate-400">{new Date(fixture.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</p></div>{fixture.isHome ? <Home className="h-4 w-4 text-emerald-300" /> : <Plane className="h-4 w-4 text-amber-300" />}<div className="flex gap-0.5" aria-label={`Difficoltà ${fixture.difficulty} su 5`}>{[1, 2, 3, 4, 5].map((level) => <span key={level} className={`h-5 w-1.5 rounded-full ${level <= fixture.difficulty ? 'bg-rose-400' : 'bg-slate-700'}`} />)}</div></div>)}</div> : <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-600 p-4 text-sm text-slate-400"><ShieldAlert className="h-4 w-4" />Aggiungi giocatori alla rosa per pianificare le prossime giornate.</div>}</section>;
}
