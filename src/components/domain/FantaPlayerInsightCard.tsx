"use client";

import type { ReactNode } from 'react';
import { CalendarClock, Database, Home, Plane, ShieldCheck, Target } from 'lucide-react';

export type FantaInsightStats = {
  seasons: number;
  appearances: number;
  starts: number | null;
  minutes: number;
  goals: number;
  assists: number;
  rating: number | null;
  goalActions90: number;
  minutesPerAppearance: number;
  period: string;
};

export type FantaInsightPlayer = {
  id?: string | number;
  playerName?: string;
  name?: string;
  teamName?: string;
  team?: string;
  role: string;
  score: number;
  successProbability?: number;
  estimatedStartProbability?: number;
  bonusProbability?: number;
  matchInfo: string;
  matchDifficulty?: number;
  recommendationLabel?: string;
  confidence?: number;
  confidenceLabel?: string;
  fixture?: {
    matchday: number | null;
    opponent: string;
    isHome: boolean;
    kickoff: string;
    difficulty: number;
    difficultyPercent: number;
  } | null;
  stats?: FantaInsightStats | null;
  sources?: string[];
  updatedAt?: string;
};

const roleStyle: Record<string, string> = {
  POR: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  DIF: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  CEN: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  ATT: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
};

function Metric({ label, value, accent = false }: { label: string; value: ReactNode; accent?: boolean }) {
  return <div className="rounded-lg bg-slate-800/90 px-2 py-2 text-center"><b className={`block text-sm ${accent ? 'text-emerald-300' : 'text-white'}`}>{value}</b><span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</span></div>;
}

export default function FantaPlayerInsightCard({ player, action, reason, marketValue }: { player: FantaInsightPlayer; action?: ReactNode; reason?: string; marketValue?: string }) {
  const name = player.playerName || player.name || 'Giocatore';
  const team = player.teamName || player.team || 'Squadra N/D';
  const role = player.role?.slice(0, 3).toUpperCase() || 'N/D';
  const fixtureDate = player.fixture?.kickoff ? new Date(player.fixture.kickoff) : null;
  const updated = player.updatedAt ? new Date(player.updatedAt) : null;
  const confidenceColor = player.confidenceLabel === 'Alta' ? 'text-emerald-300' : player.confidenceLabel === 'Media' ? 'text-amber-300' : 'text-rose-300';

  return <article className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 shadow-lg">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black ${roleStyle[role] || 'border-slate-600 bg-slate-700 text-slate-200'}`}>{role}</span>
          <h3 className="truncate text-base font-black text-white">{name}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">{team}{marketValue ? ` · valore ${marketValue}` : ''}</p>
      </div>
      <div className="flex shrink-0 items-start gap-2">
        {action}
        <div className="min-w-14 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-2 py-1.5 text-center">
          <strong className="block text-lg leading-none text-emerald-300">{player.score}</strong>
          <span className="text-[9px] font-bold uppercase text-emerald-100">indice</span>
        </div>
      </div>
    </div>

    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          {player.fixture?.isHome ? <Home className="h-4 w-4 text-emerald-300" /> : player.fixture ? <Plane className="h-4 w-4 text-amber-300" /> : <CalendarClock className="h-4 w-4 text-slate-500" />}
          <span>{player.matchInfo}</span>
        </div>
        {fixtureDate && Number.isFinite(fixtureDate.getTime()) ? <time dateTime={player.fixture?.kickoff} className="text-[10px] font-bold text-slate-400">{fixtureDate.toLocaleString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time> : null}
      </div>
      {player.fixture ? <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400"><span>Giornata {player.fixture.matchday ?? '—'} · difficoltà avversario {player.fixture.difficultyPercent}/100</span><span className="flex gap-0.5" aria-label={`Difficoltà ${player.fixture.difficulty} su 5`}>{[1, 2, 3, 4, 5].map((level) => <i key={level} className={`h-4 w-1.5 rounded-full ${level <= player.fixture!.difficulty ? 'bg-rose-400' : 'bg-slate-700'}`} />)}</span></div> : null}
    </div>

    <div className="mt-3 grid grid-cols-3 gap-2">
      <Metric label="Rendimento +" value={`${player.successProbability ?? '—'}%`} accent />
      <Metric label="Titolarità stim." value={`${player.estimatedStartProbability ?? '—'}%`} />
      <Metric label="Bonus stim." value={`${player.bonusProbability ?? '—'}%`} />
    </div>

    {player.stats ? <div className="mt-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Metric label="Presenze" value={player.stats.appearances} />
        <Metric label="Minuti" value={player.stats.minutes} />
        <Metric label="Gol" value={player.stats.goals} />
        <Metric label="Assist" value={player.stats.assists} />
        <Metric label="Rating" value={player.stats.rating ?? '—'} />
        <Metric label="G+A / 90" value={player.stats.goalActions90} />
      </div>
      <p className="mt-2 text-[10px] text-slate-500">{player.stats.period} · {player.stats.minutesPerAppearance} minuti medi per presenza.</p>
    </div> : <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-[11px] text-amber-100"><Database className="h-4 w-4 shrink-0" />Statistiche individuali non restituite dalla fonte: la scheda usa solo dati squadra e calendario, con affidabilità ridotta.</div>}

    {reason ? <p className="mt-3 text-xs leading-relaxed text-slate-300">{reason}</p> : null}
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-[10px]">
      <span className="flex items-center gap-1 text-slate-400"><Target className="h-3.5 w-3.5" />{player.recommendationLabel || 'Valutazione'} · affidabilità <b className={confidenceColor}>{player.confidenceLabel || 'Bassa'} {player.confidence != null ? `${player.confidence}%` : ''}</b></span>
      <span className="flex items-center gap-1 text-slate-500"><ShieldCheck className="h-3.5 w-3.5" />{player.sources?.length ? player.sources.join(' + ') : 'Copertura parziale'}{updated && Number.isFinite(updated.getTime()) ? ` · ${updated.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
    </div>
  </article>;
}
