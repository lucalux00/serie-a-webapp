"use client";

import React from 'react';
import { Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="w-10"></div> {/* Spacer for symmetry */}
        <div className="flex flex-col items-center justify-center mt-1">
          <div className="font-black text-xl text-[#F8FAFC] tracking-tight leading-none italic">
            SERIE A <span className="text-[#10B981]">PORTAL</span>
          </div>
          <span className="text-[7px] text-[#64748B] uppercase font-black tracking-widest mt-0.5">Created by Luca Pinelli</span>
        </div>
        <div className="w-10"></div>
      </div>
    </header>
  );
}
