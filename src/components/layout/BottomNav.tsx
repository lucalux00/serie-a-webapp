"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, TrendingUp, Users, User } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Squadre', href: '/', icon: Home },
  { label: 'Mercato', href: '/mercato', icon: Newspaper },
  { label: 'Pronostici', href: '/pronostici', icon: TrendingUp },
  { label: 'Fanta', href: '/fantacalcio', icon: Users },
  { label: 'Profilo', href: '/profilo', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
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
