"use client";

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Activity, AlertTriangle, ChevronRight, HeartPulse, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';
import FantaPlayerInsightCard, { FantaInsightPlayer } from '@/components/domain/FantaPlayerInsightCard';

type AdviceTab = 'giornata' | 'ruoli' | 'disponibilita' | 'indicatori' | 'rosa';
type AdvisorResponse = {
  matchday?: number;
  playerScores?: FantaInsightPlayer[];
  recommendedLineup?: FantaInsightPlayer[];
  suggestedCuts?: FantaInsightPlayer[];
  bestFormation?: string;
  methodology?: string;
  strengthPeriod?: string;
  updatedAt?: string;
  coverage?: { players: number; fixtures: number; statistics: number; fixturePercent?: number; statisticsPercent?: number; confidence: string; averageConfidence?: number };
};
type RadarItem = { id: number; title: string; link: string; source: string; snippet: string | null; signal: string };
type RadarResponse = { items: RadarItem[] };

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Richiesta non riuscita');
  return body;
};
const roleLabels: Record<string, string> = { POR: 'Portieri', DIF: 'Difensori', CEN: 'Centrocampisti', ATT: 'Attaccanti' };
const roleColors: Record<string, string> = { POR: 'text-amber-300 bg-amber-400/10 border-amber-400/20', DIF: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20', CEN: 'text-sky-300 bg-sky-400/10 border-sky-400/20', ATT: 'text-rose-300 bg-rose-400/10 border-rose-400/20' };
const EMPTY_PLAYERS: FantaInsightPlayer[] = [];

export default function FantaAdviceCenter({ onNavigate }: { onNavigate: (tab: 'lineup' | 'rosa' | 'mercato') => void }) {
  const [tab, setTab] = useState<AdviceTab>('giornata');
  const [role, setRole] = useState('ATT');
  const { data, isLoading, error, mutate } = useSWR<AdvisorResponse>('/api/fantacalcio/advisor', fetcher, { revalidateOnFocus: true, dedupingInterval: 60000 });
  const { data: radar, error: radarError } = useSWR<RadarResponse>(tab === 'disponibilita' ? '/api/fantacalcio/radar?mode=league' : null, fetcher, { refreshInterval: 300000 });
  const players = data?.playerScores ?? EMPTY_PLAYERS;
  const selectedRole = useMemo(() => players.filter((player) => player.role?.slice(0, 3).toUpperCase() === role).slice(0, 8), [players, role]);
  const topPlayers = players.slice(0, 5);
  const risks = data?.suggestedCuts ?? [];
  const updated = data?.updatedAt ? new Date(data.updatedAt) : null;

  const tabs: Array<{ id: AdviceTab; label: string }> = [
    { id: 'giornata', label: 'Giornata' }, { id: 'ruoli', label: 'Per ruolo' }, { id: 'disponibilita', label: 'Disponibilità' }, { id: 'indicatori', label: 'Metodo e fonti' }, { id: 'rosa', label: 'Tutta la rosa' },
  ];

  return <section className="space-y-5">
    <header className="relative overflow-hidden rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-950 via-[#1E293B] to-[#0F172A] p-6">
      <Sparkles className="absolute -right-5 -top-5 h-28 w-28 text-indigo-300/10" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Consigli Fanta · Giornata {data?.matchday ?? '—'}</p><h2 className="mt-1 text-2xl font-black text-white">Ogni scelta, con tutti i dati disponibili</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Avversario, orario, casa/trasferta, indice, percentuali stimate, minutaggio, rating, gol, assist, fonte e affidabilità in ogni scheda.</p></div>
          <button type="button" onClick={() => mutate()} className="rounded-xl border border-indigo-300/30 bg-indigo-400/10 px-3 py-2 text-xs font-black text-indigo-100">AGGIORNA DATI</button>
        </div>
        {data?.coverage ? <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-xl bg-slate-950/50 p-2"><b className="block text-lg text-white">{data.coverage.fixturePercent ?? 0}%</b>calendario coperto</div><div className="rounded-xl bg-slate-950/50 p-2"><b className="block text-lg text-white">{data.coverage.statisticsPercent ?? 0}%</b>statistiche coperte</div><div className="rounded-xl bg-slate-950/50 p-2"><b className="block text-lg text-white">{data.coverage.averageConfidence ?? '—'}%</b>affidabilità media</div></div> : null}
        {updated && Number.isFinite(updated.getTime()) ? <p className="mt-2 text-right text-[10px] text-slate-500">Ultimo calcolo {updated.toLocaleString('it-IT')}</p> : null}
      </div>
    </header>

    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#334155] bg-[#1E293B] p-1.5">{tabs.map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-black transition ${tab === item.id ? 'bg-indigo-500 text-white shadow-md' : 'text-[#94A3B8] hover:text-white'}`}>{item.label}</button>)}</div>

    {isLoading ? <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-8 text-center text-sm text-[#94A3B8]">Incrocio rosa, calendario e statistiche individuali…</div> : null}
    {error ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">Non riesco a calcolare i consigli in questo momento. <button type="button" onClick={() => mutate()} className="ml-1 font-black underline">Riprova</button></div> : null}

    {tab === 'giornata' && !isLoading && !error ? <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Modulo suggerito</p><p className="mt-1 text-3xl font-black text-white">{data?.bestFormation ?? '—'}</p><p className="mt-1 text-xs text-slate-300">Ottimizzato sul totale degli indici della tua rosa.</p></div><button type="button" onClick={() => onNavigate('lineup')} className="group rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-4 text-left transition hover:bg-indigo-500/15"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Azione immediata</p><p className="mt-1 font-black text-white">Apri la formazione</p><p className="mt-1 text-xs text-slate-300">Applica o modifica l’undici consigliato.</p><ChevronRight className="mt-2 h-4 w-4 text-indigo-300 transition group-hover:translate-x-1" /></button></div>
      <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" /><div><h3 className="font-black text-white">Da schierare</h3><p className="text-xs text-[#94A3B8]">Le cinque priorità della prossima giornata, con copertura completa per scheda.</p></div></div><div className="space-y-3">{topPlayers.map((player) => <FantaPlayerInsightCard key={String(player.id || player.playerName)} player={player} />)}{!topPlayers.length ? <button onClick={() => onNavigate('rosa')} className="w-full rounded-xl border border-dashed border-[#475569] p-4 text-sm font-bold text-indigo-300">Aggiungi la tua rosa per ricevere consigli personalizzati.</button> : null}</div></div>
      {risks.length ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-5"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-rose-300" /><h3 className="font-black text-white">Da monitorare</h3></div><div className="space-y-3">{risks.map((player) => <FantaPlayerInsightCard key={String(player.id || player.playerName)} player={player} />)}</div></div> : null}
    </div> : null}

    {tab === 'ruoli' ? <div className="space-y-4"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.keys(roleLabels).map((item) => <button type="button" key={item} onClick={() => setRole(item)} className={`rounded-xl border px-3 py-3 text-xs font-black ${role === item ? roleColors[item] : 'border-[#334155] bg-[#1E293B] text-[#94A3B8]'}`}>{roleLabels[item]}</button>)}</div><div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-300" /><div><h3 className="font-black text-white">{roleLabels[role]} da valutare</h3><p className="text-xs text-[#94A3B8]">Ordinati per indice della prossima partita.</p></div></div><div className="space-y-3">{selectedRole.map((player) => <FantaPlayerInsightCard key={String(player.id || player.playerName)} player={player} />)}{!selectedRole.length ? <p className="rounded-xl border border-dashed border-[#475569] p-4 text-center text-sm text-[#94A3B8]">Non hai {roleLabels[role].toLowerCase()} nella tua rosa.</p> : null}</div></div></div> : null}

    {tab === 'disponibilita' ? <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><HeartPulse className="h-5 w-5 text-rose-300" /><div><h3 className="font-black text-white">Ultimi segnali Serie A</h3><p className="text-xs text-[#94A3B8]">Infortuni, squalifiche, ballottaggi e rientri, sempre con fonte originale.</p></div></div>{radarError ? <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">Radar indisponibile: riprova tra poco.</p> : <div className="space-y-2">{radar?.items.map((item) => <Link key={item.id} href={`/notizie/leggi?id=${item.id}`} className="block rounded-xl border border-[#334155] bg-[#0F172A] p-3 transition hover:border-rose-400/50"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-rose-400/10 px-2 py-1 text-[10px] font-black uppercase text-rose-200">{item.signal}</span><span className="text-[10px] text-[#94A3B8]">{item.source}</span></div><h3 className="mt-2 text-sm font-bold text-white">{item.title}</h3>{item.snippet ? <p className="mt-1 line-clamp-2 text-xs text-[#94A3B8]">{item.snippet}</p> : null}</Link>)}{!radar?.items.length ? <p className="py-8 text-center text-sm text-[#94A3B8]">Nessun segnale rilevante al momento.</p> : null}</div>}</div> : null}

    {tab === 'indicatori' ? <div className="space-y-4"><div className="rounded-2xl border border-sky-400/25 bg-sky-400/10 p-4 text-xs leading-relaxed text-sky-100"><Activity className="mb-2 h-5 w-5 text-sky-300" /><p>{data?.methodology || 'L’indice combina i dati disponibili senza presentarsi come voto reale o previsione certa.'}</p><p className="mt-2 font-bold">Forza squadre: stagione {data?.strengthPeriod || 'in aggiornamento'}. “Titolarità”, “bonus” e “rendimento positivo” sono stime trasparenti, non quote bookmaker.</p></div><div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-sky-300" /><div><h3 className="font-black text-white">Indicatori migliori</h3><p className="text-xs text-[#94A3B8]">Ogni scheda dichiara fonti e affidabilità: i dati mancanti non vengono inventati.</p></div></div><div className="space-y-3">{topPlayers.map((player) => <FantaPlayerInsightCard key={String(player.id || player.playerName)} player={player} />)}</div></div></div> : null}

    {tab === 'rosa' ? <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><h3 className="font-black text-white">Analisi completa della rosa</h3><p className="mb-4 mt-1 text-xs text-[#94A3B8]">Tutti i giocatori, dal più consigliato al profilo più rischioso.</p><div className="space-y-3">{players.map((player) => <FantaPlayerInsightCard key={String(player.id || player.playerName)} player={player} />)}</div></div> : null}
  </section>;
}
