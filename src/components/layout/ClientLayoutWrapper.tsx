"use client";

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import BannerStrip from '@/components/layout/BannerStrip';
import CookieConsent from '@/components/layout/CookieConsent';
import NewsTicker from '@/components/layout/NewsTicker';
import { getTeamColors } from '@/utils/teamColors';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth();

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.log('SW registration failed: ', err);
        });
      });
    }
  }, []);

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Rimossa la forzatura di LoginPage all'avvio. L'app è visibile anche senza login.
  // LoginPage verrà utilizzato solo nella rotta /profilo o per onboarding specifico.

  const { primary, secondary } = getTeamColors(user?.favoriteTeamId);

  return (
    <div style={{ '--color-sport-primary': primary, '--color-sport-secondary': secondary } as React.CSSProperties}>
      <Header />
      <BottomNav />
      <main className="min-h-screen pt-[120px] pb-8">
        {children}
      </main>
      {/* Banner non-invasivo: appare sopra la BottomNav dopo 3s, max 1 per sessione */}
      <BannerStrip />
      <NewsTicker />
      <CookieConsent />
    </div>
  );
}

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppContent>{children}</AppContent>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
