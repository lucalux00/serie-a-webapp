"use client";

import { useMemo, useState } from 'react';
import { ArrowRightLeft, ShieldCheck, TrendingUp } from 'lucide-react';

export type FantaScoredPlayer = { id: string | number; playerName: string; role: string; score: number; successProbability?: number; matchInfo: string };

export default function FantaPlayerCompare({ players }: { players: FantaScoredPlayer[] }) {
  const options = players.slice(0, 14);
  const [leftId, setLeftId] = useState(String(options[0]?.id ?? ''));
  const [rightId, setRightId] = useState(String(options[1]?.id ?? options[0]?.id ?? ''));
  const [left, right] = useMemo(() => [options.find((item) => String(item.id) === leftId), options.find((item) => String(item.id) === rightId)], [leftId, rightId, options]);
  if (!left || !right) return null;
  const winner = left.score === right.score ? null : left.score > right.score ? left : right;
  return <section className="rounded-2xl border border-violet-400/30 bg-[#17133B] p-5">
    <div className="mb-4 flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-violet-300" /><div><h3 className="font-black text-white">Confronto Pro</h3><p className="text-xs text-slate-400">Decidi il ballottaggio con dati della tua rosa.</p></div></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
      {[{ value: leftId, change: setLeftId, player: left }, { value: rightId, change: setRightId, player: right }].map(({ value, change, player }, index) => <div key={index} className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-center"><select value={value} onChange={(event) => change(event.target.value)} className="w-full bg-transparent text-center text-sm font-black text-white outline-none">{options.map((option) => <option key={option.id} value={option.id} className="bg-slate-900">{option.playerName}</option>)}</select><p className="mt-3 text-3xl font-black text-emerald-400">{player.score}</p><p className="text-[10px] font-bold uppercase text-slate-400">FantaScore · {player.role}</p><p className="mt-2 text-[11px] text-slate-300">{player.matchInfo}</p><p className="mt-2 text-xs font-bold text-violet-300">{player.successProbability ?? '—'}% rendimento positivo</p></div>)}
      <span className="mb-12 text-xs font-black text-amber-300">VS</span>
    </div>
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-100"><TrendingUp className="h-4 w-4" />{winner ? <><strong>{winner.playerName}</strong> ha un vantaggio di {Math.abs(left.score - right.score)} punti.</> : <>I due profili sono equivalenti: scegli in base al rischio.</>}</div>
  </section>;
}
