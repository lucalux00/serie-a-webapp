"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

type TickerNews = {
  id: number;
  title: string;
  link: string;
  source: string;
  pub_date: string;
  time: string;
  created_at: string;
};

function parsePublicationDate(value: string, fallback: string) {
  const directDate = new Date(value);
  if (!Number.isNaN(directDate.getTime())) return directDate;

  const match = value.match(/\w+,\s*(\d{1,2})\s+(\w{3})\s+(\d{4})\s+(\d{2}:\d{2}:\d{2})\s+GMT/i);
  const months: Record<string, string> = { gen: '01', feb: '02', mar: '03', apr: '04', mag: '05', giu: '06', lug: '07', ago: '08', set: '09', ott: '10', nov: '11', dic: '12' };
  if (match && months[match[2].toLowerCase()]) {
    return new Date(`${match[3]}-${months[match[2].toLowerCase()]}-${match[1].padStart(2, '0')}T${match[4]}Z`);
  }
  return new Date(fallback);
}

function formatTimestamp(pubDate: string, time: string, createdAt: string) {
  const date = parsePublicationDate(pubDate, createdAt);
  if (Number.isNaN(date.getTime())) return time || 'Data non disponibile';
  const day = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Rome' }).format(date);
  const hour = time || new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }).format(date);
  return `${day} · ${hour}`;
}

export default function NewsTicker() {
  const { user } = useAuth();
  const [news, setNews] = useState<TickerNews[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isActive = true;
    const loadNews = async () => {
      const teamParam = user?.favoriteTeamName ? `&team=${encodeURIComponent(user.favoriteTeamName)}` : '';
      try {
        const response = await fetch(`/api/news?limit=15${teamParam}`);
        if (!response.ok) return;
        const data = await response.json();
        if (isActive && Array.isArray(data)) setNews(data);
      } catch {
        // Il ticker resta nascosto finché il feed non è disponibile.
      }
    };
    loadNews();
    const refresh = window.setInterval(loadNews, 60000);
    return () => {
      isActive = false;
      window.clearInterval(refresh);
    };
  }, [user?.favoriteTeamName]);

  // Logica per cambiare notizia ogni 4 secondi
  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 4000); // 4 secondi per leggere la notizia
    
    return () => clearInterval(interval);
  }, [news]);

  if (news.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#1E293B] border-y border-[#334155] flex items-center overflow-hidden z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
      {/* Badge Fisso "ULTIM'ORA" */}
      <div className="bg-[#EF4444] h-full flex items-center px-3 z-10 font-black text-[10px] text-white tracking-widest uppercase shrink-0 shadow-lg relative">
        ULTIM&apos;ORA
        {/* Effetto pulsante per dare senso di live */}
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
      </div>

      {/* Contenitore Animato della Notizia */}
      <div className="flex-1 overflow-hidden relative h-full bg-[#0F172A]">
          <Link
            href={`/notizie/leggi?id=${news[currentIndex].id}`}
            key={currentIndex}
            className="absolute inset-0 flex items-center px-3 hover:bg-white/5"
          >
            <span className="text-[var(--color-sport-secondary)] font-black text-xs mr-2 shrink-0">
              {formatTimestamp(news[currentIndex].pub_date, news[currentIndex].time, news[currentIndex].created_at)}
            </span>
            <span className="text-[#F8FAFC] font-semibold text-xs truncate">
              {news[currentIndex].title}
            </span>
          </Link>
      </div>
    </div>
  );
}
