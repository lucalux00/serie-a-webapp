"use client";

import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

export default function Header() {
  const [stats, setStats] = useState({ online: 0, total: 0 });

  useEffect(() => {
    let visitorId = localStorage.getItem('site_visitor_id');
    let isNewSession = false;
    
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('site_visitor_id', visitorId);
      isNewSession = true;
    }

    const pingStats = async (isNew: boolean) => {
      try {
        const res = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: visitorId, isNewSession: isNew })
        });
        const data = await res.json();
        if (data.online !== undefined) {
          setStats({ online: data.online, total: data.total });
        }
      } catch (e) {
        console.error('Stats ping error', e);
      }
    };

    pingStats(isNewSession);
    
    const interval = setInterval(() => {
      pingStats(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="w-20"></div> {/* Spacer for symmetry */}
        <div className="flex flex-col items-center justify-center mt-1 absolute left-1/2 -translate-x-1/2">
          <div className="font-black text-xl text-[#F8FAFC] tracking-tight leading-none italic">
            SERIE A <span className="text-[#10B981]">PORTAL</span>
          </div>
          <span className="text-[7px] text-[#64748B] uppercase font-black tracking-widest mt-0.5">Created by Luca Pinelli</span>
        </div>
        
        {/* Stats Counter */}
        <div className="flex flex-col items-end justify-center gap-0.5 ml-auto">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-[#10B981]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]"></div>
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
