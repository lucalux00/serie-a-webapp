"use client";

import { useMemo, useState } from 'react';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';
import FantaPlayerInsightCard, { FantaInsightPlayer } from '@/components/domain/FantaPlayerInsightCard';

export type FantaScoredPlayer = FantaInsightPlayer & { id: string | number; playerName: string };

export default function FantaPlayerCompare({ players }: { players: FantaScoredPlayer[] }) {
  const options = players.slice(0, 14);
  const [leftId, setLeftId] = useState(String(options[0]?.id ?? ''));
  const [rightId, setRightId] = useState(String(options[1]?.id ?? options[0]?.id ?? ''));
  const [left, right] = useMemo(() => [options.find((item) => String(item.id) === leftId), options.find((item) => String(item.id) === rightId)], [leftId, rightId, options]);
  if (!left || !right) return null;
  const winner = left.score === right.score ? null : left.score > right.score ? left : right;

  return <section className="rounded-2xl border border-violet-400/30 bg-[#17133B] p-5">
    <div className="mb-4 flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-violet-300" /><div><h3 className="font-black text-white">Confronto Pro completo</h3><p className="text-xs text-slate-400">Indice, avversario, percentuali, statistiche, fonti e affidabilità fianco a fianco.</p></div></div>
    <div className="mb-4 grid gap-2 sm:grid-cols-2">
      <label className="text-[10px] font-black uppercase tracking-wide text-violet-200">Primo giocatore<select value={leftId} onChange={(event) => setLeftId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm font-black normal-case text-white outline-none">{options.map((option) => <option key={option.id} value={option.id}>{option.playerName}</option>)}</select></label>
      <label className="text-[10px] font-black uppercase tracking-wide text-violet-200">Secondo giocatore<select value={rightId} onChange={(event) => setRightId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm font-black normal-case text-white outline-none">{options.map((option) => <option key={option.id} value={option.id}>{option.playerName}</option>)}</select></label>
    </div>
    <div className="grid gap-3 xl:grid-cols-2"><FantaPlayerInsightCard player={left} /><FantaPlayerInsightCard player={right} /></div>
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-100"><TrendingUp className="h-4 w-4 shrink-0" />{winner ? <><strong>{winner.playerName}</strong> ha un vantaggio di {Math.abs(left.score - right.score)} punti; verifica comunque affidabilità e disponibilità.</> : <>I due profili sono equivalenti: usa titolarità stimata, bonus e difficoltà avversario per decidere.</>}</div>
  </section>;
}
