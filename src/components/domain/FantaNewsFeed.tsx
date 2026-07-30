"use client";

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Activity, ExternalLink, Newspaper, Users } from 'lucide-react';

type RadarItem = { id: number; title: string; link: string; source: string; snippet: string | null; pub_date: string; signal: string };
type RadarResponse = { rosterCount: number; items: RadarItem[] };
const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function FantaNewsFeed() {
  const [tab, setTab] = useState<'roster' | 'league'>('roster');
  const { data, isLoading } = useSWR<RadarResponse>(`/api/fantacalcio/radar?mode=${tab}`, fetcher, { refreshInterval: 300000 });
  const isRoster = tab === 'roster';

  return <section className="rounded-3xl border border-[#334155] bg-[#1E293B] p-5 shadow-2xl">
    <div className="mb-5 flex items-start gap-3"><div className="rounded-full bg-[#F59E0B]/20 p-2 text-[#F59E0B]"><Activity size={19} /></div><div><h2 className="text-xl font-black text-white">Radar Rosa</h2><p className="text-xs text-[#94A3B8]">Segnali utili per le tue scelte, con fonte originale.</p></div></div>
    <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[#0F172A] p-1"><button type="button" onClick={() => setTab('roster')} className={`rounded-lg px-3 py-2 text-xs font-black ${isRoster ? 'bg-[#F59E0B] text-[#0F172A]' : 'text-[#94A3B8]'}`}><Users className="mr-1 inline h-4 w-4" />LA MIA ROSA</button><button type="button" onClick={() => setTab('league')} className={`rounded-lg px-3 py-2 text-xs font-black ${!isRoster ? 'bg-[#F59E0B] text-[#0F172A]' : 'text-[#94A3B8]'}`}><Newspaper className="mr-1 inline h-4 w-4" />RADAR SERIE A</button></div>
    <p className="mb-4 text-xs text-[#94A3B8]">{isRoster ? `Notizie che citano i ${data?.rosterCount ?? 0} giocatori della tua rosa.` : 'Infortuni, squalifiche, rientri, turnover e formazioni da monitorare in Serie A.'}</p>
    {isLoading ? <p className="py-8 text-center text-sm text-[#94A3B8]">Aggiornamento radar…</p> : <div className="space-y-2">{data?.items.map((item) => <Link key={item.id} href={`/notizie/leggi?url=${encodeURIComponent(item.link)}&source=${encodeURIComponent(item.source)}&title=${encodeURIComponent(item.title)}&snippet=${encodeURIComponent(item.snippet ?? '')}`} className="block rounded-xl border border-[#334155] bg-[#0F172A] p-3 transition hover:border-[#F59E0B]/60"><div className="mb-1 flex items-center justify-between gap-2"><span className="rounded-full bg-[#F59E0B]/10 px-2 py-1 text-[10px] font-black uppercase text-[#FCD34D]">{item.signal}</span><span className="text-[10px] text-[#94A3B8]">{item.source}</span></div><h3 className="text-sm font-bold leading-tight text-white">{item.title}</h3>{item.snippet && <p className="mt-1 line-clamp-2 text-xs text-[#94A3B8]">{item.snippet}</p>}<span className="mt-2 flex items-center text-[10px] font-black uppercase text-[#F59E0B]">Apri fonte <ExternalLink className="ml-1 h-3 w-3" /></span></Link>)}{!data?.items.length && <p className="py-8 text-center text-sm text-[#94A3B8]">{isRoster ? 'Nessun segnale per i giocatori della tua rosa al momento.' : 'Nessun aggiornamento rilevante di Serie A al momento.'}</p>}</div>}
  </section>;
}
