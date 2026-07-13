"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, TrendingUp, Trophy, User } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Squadre', href: '/', icon: Home },
  { label: 'Mercato', href: '/mercato', icon: Newspaper },
  { label: 'Classifica', href: '/classifiche', icon: Trophy },
  { label: 'Pronostici', href: '/pronostici', icon: TrendingUp },
  { label: 'Profilo', href: '/profilo', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full bg-[#0F172A]/95 backdrop-blur-md border-t border-[#1E293B] pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#10B981]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
