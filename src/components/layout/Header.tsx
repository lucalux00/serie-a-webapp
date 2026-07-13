import React from 'react';
import { Menu, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="flex items-center justify-between px-4 h-14">
        <button className="p-2 text-[#F8FAFC]">
          <Menu size={24} />
        </button>
        <div className="font-bold text-lg text-[#F8FAFC] tracking-wide">
          <span className="text-[#10B981]">SERIE A</span> PORTAL
        </div>
        <button className="p-2 text-[#F8FAFC]">
          <Search size={24} />
        </button>
      </div>
    </header>
  );
}
