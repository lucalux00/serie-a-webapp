"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function SerieALiveScores() {
  const { data, error, isLoading } = useSWR('/api/serie-a-live', fetcher, { refreshInterval: 180000, revalidateOnFocus: false });
  if (isLoading) return <p className="py-12 text-center text-sm text-slate-400">Caricamento dati live verificati...</p>;
  if (error || data?.error) return <p className="py-12 text-center text-sm text-slate-400">{data?.error || 'Dati live temporaneamente non disponibili.'}</p>;
  if (!data?.fixtures?.length) return <p className="py-12 text-center text-sm text-slate-400">Nessuna partita di Serie A in corso.</p>;
  return <div className="space-y-4">{data.fixtures.map((match: any) => <article key={match.id} className="rounded-2xl border border-red-500/30 bg-slate-800 p-4"><div className="mb-3 flex items-center justify-between text-xs font-black text-red-400"><span>LIVE</span><span>{match.minute ? `${match.minute}'` : match.status}</span></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"><div><img src={match.home.logo} alt="" className="mx-auto h-9 w-9 object-contain" /><p className="mt-1 text-sm font-bold text-white">{match.home.name}</p></div><p className="text-2xl font-black text-white">{match.goals.home ?? 0} - {match.goals.away ?? 0}</p><div><img src={match.away.logo} alt="" className="mx-auto h-9 w-9 object-contain" /><p className="mt-1 text-sm font-bold text-white">{match.away.name}</p></div></div>{match.events.length > 0 && <div className="mt-4 border-t border-slate-700 pt-3 text-xs text-slate-300">{match.events.map((event: any, index: number) => <p key={index}>{event.minute}' {event.team}: {event.detail}</p>)}</div>}</article>)}</div>;
}
