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
          <div className="font-bold text-lg text-[#F8FAFC] tracking-wide">
            <span className="text-[#10B981]">SERIE A</span> PORTAL
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
