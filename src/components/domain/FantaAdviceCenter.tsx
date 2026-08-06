"use client";

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Activity, AlertTriangle, BrainCircuit, ChevronRight, HeartPulse, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';
import FantaAdvisorDashboard from '@/components/domain/FantaAdvisorDashboard';

type AdviceTab = 'giornata' | 'ruoli' | 'disponibilita' | 'indicatori' | 'rosa';
type AdvicePlayer = { id: string | number; playerName: string; teamName?: string; role: string; score: number; successProbability?: number; matchInfo: string };
type AdvisorResponse = { matchday?: number; playerScores?: AdvicePlayer[]; recommendedLineup?: AdvicePlayer[]; suggestedCuts?: AdvicePlayer[]; bestFormation?: string };
type RadarItem = { id: number; title: string; link: string; source: string; snippet: string | null; signal: string };
type RadarResponse = { items: RadarItem[] };

const fetcher = (url: string) => fetch(url).then((response) => response.json());
const roleLabels: Record<string, string> = { POR: 'Portieri', DIF: 'Difensori', CEN: 'Centrocampisti', ATT: 'Attaccanti' };
const roleColors: Record<string, string> = { POR: 'text-amber-300 bg-amber-400/10 border-amber-400/20', DIF: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20', CEN: 'text-sky-300 bg-sky-400/10 border-sky-400/20', ATT: 'text-rose-300 bg-rose-400/10 border-rose-400/20' };

function ScoreBadge({ player }: { player: AdvicePlayer }) {
  return <div className="min-w-14 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-2 py-1.5 text-center"><strong className="block text-base leading-none text-emerald-300">{player.score}</strong><span className="text-[9px] font-bold uppercase text-emerald-200">indice</span></div>;
}

function PlayerRow({ player }: { player: AdvicePlayer }) {
  const role = player.role?.slice(0, 3).toUpperCase();
  return <article className="flex items-center justify-between gap-3 rounded-xl border border-[#334155] bg-[#0F172A] p-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`rounded px-1.5 py-0.5 text-[9px] font-black ${roleColors[role] ?? 'bg-slate-700 text-slate-300'}`}>{role}</span><h3 className="truncate text-sm font-black text-white">{player.playerName}</h3></div><p className="mt-1 truncate text-xs text-[#94A3B8]">{player.matchInfo}</p></div><ScoreBadge player={player} /></article>;
}

export default function FantaAdviceCenter({ onNavigate }: { onNavigate: (tab: 'lineup' | 'rosa' | 'mercato') => void }) {
  const [tab, setTab] = useState<AdviceTab>('giornata');
  const [role, setRole] = useState('ATT');
  const { data, isLoading, error } = useSWR<AdvisorResponse>('/api/fantacalcio/advisor', fetcher);
  const { data: radar } = useSWR<RadarResponse>(tab === 'disponibilita' ? '/api/fantacalcio/radar?mode=league' : null, fetcher, { refreshInterval: 300000 });
  const players = data?.playerScores ?? [];
  const selectedRole = useMemo(() => players.filter((player) => player.role?.slice(0, 3).toUpperCase() === role).slice(0, 5), [players, role]);
  const topPlayers = players.slice(0, 5);
  const risks = data?.suggestedCuts ?? [];

  const tabs: Array<{ id: AdviceTab; label: string }> = [
    { id: 'giornata', label: 'Giornata' }, { id: 'ruoli', label: 'Per ruolo' }, { id: 'disponibilita', label: 'Disponibilità' }, { id: 'indicatori', label: 'Indicatori' }, { id: 'rosa', label: 'La mia rosa' },
  ];

  return <section className="space-y-5"><header className="relative overflow-hidden rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-950 via-[#1E293B] to-[#0F172A] p-6"><Sparkles className="absolute -right-5 -top-5 h-28 w-28 text-indigo-300/10" /><div className="relative"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Consigli Fanta</p><h2 className="mt-1 text-2xl font-black text-white">Decidi meglio, prima del gong</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Consigli basati su ruolo, prossima partita e segnali dalle fonti. Apri la tua rosa per rendere ogni decisione personale.</p></div></header>

    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#334155] bg-[#1E293B] p-1.5">{tabs.map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-black transition ${tab === item.id ? 'bg-indigo-500 text-white shadow-md' : 'text-[#94A3B8] hover:text-white'}`}>{item.label}</button>)}</div>

    {isLoading && tab !== 'disponibilita' ? <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-8 text-center text-sm text-[#94A3B8]">Calcolo i consigli per la prossima giornata…</div> : null}
    {error ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">Non riesco a calcolare i consigli in questo momento. Riprova tra poco.</div> : null}

    {tab === 'giornata' && !isLoading ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Modulo suggerito</p><p className="mt-1 text-3xl font-black text-white">{data?.bestFormation ?? '—'}</p><p className="mt-1 text-xs text-slate-300">Giornata {data?.matchday ?? '—'} · calcolato sulla tua rosa.</p></div><button type="button" onClick={() => onNavigate('lineup')} className="group rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-4 text-left transition hover:bg-indigo-500/15"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Azione immediata</p><p className="mt-1 font-black text-white">Apri la formazione</p><p className="mt-1 text-xs text-slate-300">Applica o modifica l’undici consigliato.</p><ChevronRight className="mt-2 h-4 w-4 text-indigo-300 transition group-hover:translate-x-1" /></button></div><div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" /><div><h3 className="font-black text-white">Da schierare</h3><p className="text-xs text-[#94A3B8]">I migliori indici della tua rosa per la prossima partita.</p></div></div><div className="space-y-2">{topPlayers.map((player) => <PlayerRow key={player.id} player={player} />)}{!topPlayers.length ? <button onClick={() => onNavigate('rosa')} className="w-full rounded-xl border border-dashed border-[#475569] p-4 text-sm font-bold text-indigo-300">Aggiungi la tua rosa per ricevere consigli personalizzati.</button> : null}</div></div>{risks.length ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-5"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-rose-300" /><h3 className="font-black text-white">Da monitorare</h3></div><div className="space-y-2">{risks.map((player) => <PlayerRow key={player.id} player={player} />)}</div></div> : null}</div> : null}

    {tab === 'ruoli' ? <div className="space-y-4"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.keys(roleLabels).map((item) => <button type="button" key={item} onClick={() => setRole(item)} className={`rounded-xl border px-3 py-3 text-xs font-black ${role === item ? roleColors[item] : 'border-[#334155] bg-[#1E293B] text-[#94A3B8]'}`}>{roleLabels[item]}</button>)}</div><div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-300" /><div><h3 className="font-black text-white">{roleLabels[role]} da valutare</h3><p className="text-xs text-[#94A3B8]">Ordinati per indice della prossima partita, non per notorietà.</p></div></div><div className="space-y-2">{selectedRole.map((player) => <PlayerRow key={player.id} player={player} />)}{!selectedRole.length ? <p className="rounded-xl border border-dashed border-[#475569] p-4 text-center text-sm text-[#94A3B8]">Non hai {roleLabels[role].toLowerCase()} nella tua rosa.</p> : null}</div></div></div> : null}

    {tab === 'disponibilita' ? <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><HeartPulse className="h-5 w-5 text-rose-300" /><div><h3 className="font-black text-white">Ultimi segnali Serie A</h3><p className="text-xs text-[#94A3B8]">Infortuni, squalifiche, titolari da verificare e rientri, con fonte originale.</p></div></div><div className="space-y-2">{radar?.items.map((item) => <Link key={item.id} href={`/notizie/leggi?url=${encodeURIComponent(item.link)}&source=${encodeURIComponent(item.source)}&title=${encodeURIComponent(item.title)}&snippet=${encodeURIComponent(item.snippet ?? '')}`} className="block rounded-xl border border-[#334155] bg-[#0F172A] p-3 transition hover:border-rose-400/50"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-rose-400/10 px-2 py-1 text-[10px] font-black uppercase text-rose-200">{item.signal}</span><span className="text-[10px] text-[#94A3B8]">{item.source}</span></div><h3 className="mt-2 text-sm font-bold text-white">{item.title}</h3>{item.snippet ? <p className="mt-1 line-clamp-2 text-xs text-[#94A3B8]">{item.snippet}</p> : null}</Link>)}{!radar?.items.length ? <p className="py-8 text-center text-sm text-[#94A3B8]">Nessun segnale rilevante al momento.</p> : null}</div></div> : null}

    {tab === 'indicatori' ? <div className="space-y-4"><div className="rounded-2xl border border-sky-400/25 bg-sky-400/10 p-4 text-xs leading-relaxed text-sky-100"><Activity className="mb-2 h-5 w-5 text-sky-300" />L’indice combina ruolo, forza della squadra, fattore campo e difficoltà dell’avversario. Non viene presentato come voto reale o previsione certa.</div><div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-sky-300" /><div><h3 className="font-black text-white">Indicatori migliori</h3><p className="text-xs text-[#94A3B8]">Usali per sciogliere un ballottaggio, poi verifica disponibilità e formazione.</p></div></div><div className="space-y-2">{topPlayers.map((player) => <PlayerRow key={player.id} player={player} />)}</div></div></div> : null}

    {tab === 'rosa' ? <FantaAdvisorDashboard /> : null}
  </section>;
}
