"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, TrendingUp, Trophy, User, Target } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Squadre', href: '/', icon: Home },
  { label: 'Pronostici', href: '/pronostici', icon: TrendingUp },
  { label: 'Mercato', href: '/mercato', icon: Newspaper },
  { label: 'Classifica', href: '/classifiche', icon: Trophy },
  { label: 'Fanta', href: '/fantacalcio', icon: Target },
  { label: 'Profilo', href: '/profilo', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-14 w-full bg-[#0F172A]/95 backdrop-blur-md border-b border-[#1E293B] z-40">
      <div className="flex justify-around items-center h-[68px]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 text-[11px] ${isActive ? 'text-[#10B981]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
            >
              {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#10B981]" />}
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
