"use client";

import React, { useState } from 'react';
import { Menu, Search } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Header() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B]">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-[#F8FAFC]">
            <Menu size={24} />
          </button>
          <div className="flex flex-col items-center justify-center mt-1">
            <div className="font-black text-xl text-[#F8FAFC] tracking-tight leading-none italic">
              SERIE A <span className="text-[#10B981]">PORTAL</span>
            </div>
            <span className="text-[7px] text-[#64748B] uppercase font-black tracking-widest mt-0.5">Created by Luca Pinelli</span>
          </div>
          <button className="p-2 -mr-2 text-[#F8FAFC]">
            <Search size={24} />
          </button>
        </div>
      </header>
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
