"use client";

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/domain/LoginPage';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import CookieConsent from '@/components/layout/CookieConsent';
import NewsTicker from '@/components/layout/NewsTicker';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <Header />
      <BottomNav />
      <main className="min-h-screen pt-[120px] pb-8">
        {children}
      </main>
      <NewsTicker />
      <CookieConsent />
    </>
  );
}

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
