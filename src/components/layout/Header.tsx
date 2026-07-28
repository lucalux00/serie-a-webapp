"use client";

import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: ['900'] });

export default function Header() {
  const [stats, setStats] = useState({ online: 0, total: 0 });

  useEffect(() => {
    let visitorId = localStorage.getItem('site_visitor_id');
    
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('site_visitor_id', visitorId);
    }

    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const isInstalledApp = window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
    if (isInstalledApp) {
      fetch('/api/stats/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      }).catch(() => undefined);
    }

    const pingStats = async () => {
      try {
        const res = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId })
        });
        const data = await res.json();

        if (data.online !== undefined) {
          setStats({ online: data.online, total: data.total });
        }
      } catch (e) {
        console.error('Stats ping error', e);
      }
    };

    pingStats();
    
    const interval = setInterval(() => {
      pingStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="w-20"></div> {/* Spacer for symmetry */}
        <div className="flex flex-col items-center justify-center mt-1 absolute left-1/2 -translate-x-1/2 w-[250px] text-center">
          <div className={`text-xl sm:text-2xl text-[#F8FAFC] tracking-widest leading-none uppercase italic ${outfit.className}`}>
            TATTICA <span className="text-[var(--color-sport-primary)]">&</span> PRONOSTICI
          </div>

        </div>
        
        {/* Stats Counter */}
        <div className="flex flex-col items-end justify-center gap-0.5 ml-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--color-sport-primary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-sport-primary)] animate-pulse shadow-[0_0_8px_var(--color-sport-primary)]"></div>
            {stats.online} ONLINE
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold text-[#64748B] uppercase tracking-wider">
            <Eye size={10} />
            {stats.total} VISITE
          </div>
        </div>
      </div>
    </header>
  );
}
