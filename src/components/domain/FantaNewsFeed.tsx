"use client";

import React, { useEffect, useState } from 'react';
import { Newspaper, Loader2, ExternalLink } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FantaNewsFeed() {
  const { data: rosterData } = useSWR('/api/fanta-roster', fetcher);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadNews() {
      if (!rosterData?.roster || rosterData.roster.length === 0) {
        setNews([]);
        return;
      }
      setLoading(true);
      try {
        // Prendiamo i primi 3 giocatori per non sovraccaricare la query
        const topPlayers = rosterData.roster.slice(0, 3).map((p: any) => p.playerName);
        const playerQuery = topPlayers.join(' OR ');

        // Cerchiamo le news generali, ma potremmo avere un endpoint dedicato
        // Per ora usiamo l'endpoint generico passando il nome del primo giocatore come team per simulare
        const res = await fetch(`/api/news?team=${encodeURIComponent(topPlayers[0])}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setNews(data.slice(0, 5)); // max 5 news
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, [rosterData]);

  if (!rosterData?.roster || rosterData.roster.length === 0) return null;

  return (
    <div className="bg-[#1E293B] rounded-3xl p-6 shadow-2xl border border-[#334155] mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] mr-3">
          <Newspaper size={18} />
        </div>
        <h2 className="text-lg font-black text-white">Le Mie Fanta-News</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-[#F59E0B]" size={24} />
        </div>
      ) : news.length > 0 ? (
        <div className="space-y-3">
          {news.map((item, i) => (
            <a 
              key={i}
              href={`/news/read?url=${encodeURIComponent(item.link)}&title=${encodeURIComponent(item.title)}&snippet=${encodeURIComponent(item.snippet || '')}`}
              className="block bg-[#0F172A] p-3 rounded-xl border border-[#334155] hover:border-[#F59E0B]/50 transition-colors group"
            >
              <h3 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-[#F59E0B] transition-colors">{item.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{item.source}</span>
                <ExternalLink size={14} className="text-[#64748B] group-hover:text-[#F59E0B]" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#64748B] text-center py-4">Nessuna notizia rilevante per i tuoi giocatori al momento.</p>
      )}
    </div>
  );
}
