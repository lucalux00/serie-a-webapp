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

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

declare global {
  interface Window {
    deferredInstallPrompt?: InstallPromptEvent;
  }
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth();

  React.useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.deferredInstallPrompt = event as InstallPromptEvent;
      window.dispatchEvent(new Event('serie-a-install-prompt-ready'));
    };

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.log('SW registration failed: ', err);
        });
      });
    }
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
  }, []);

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0F172A] px-4 pt-6" aria-label="Caricamento dell'app">
      <div className="mx-auto h-7 w-48 animate-pulse rounded bg-[#1E293B]" />
      <div className="mt-6 h-16 animate-pulse rounded-xl border border-[#1E293B] bg-[#111C30]" />
      <div className="mt-10 space-y-4">
        <div className="h-5 w-28 animate-pulse rounded bg-[#1E293B]" />
        <div className="h-36 animate-pulse rounded-3xl border border-[#1E293B] bg-[#111C30]" />
      </div>
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
