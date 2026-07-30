"use client";

import React from 'react';

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="flex items-center justify-center px-4 h-14">
        <div className="flex flex-col items-center justify-center mt-1 w-[250px] text-center">
          <div className="text-xl sm:text-2xl text-[#F8FAFC] tracking-widest leading-none uppercase italic font-black">
            TATTICA <span className="text-[var(--color-sport-primary)]">&</span> PRONOSTICI
          </div>

        </div>
      </div>
    </header>
  );
}
