"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';

interface SubscriptionStatus {
  isPremium: boolean;
  plan: 'free' | 'pro' | null;
  expiresAt?: string | null;
  source?: string | null;
}

interface SubscriptionContextType {
  isPremium: boolean;
  plan: 'free' | 'pro' | null;
  expiresAt: string | null;
  source: string | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const fetcher = async (url: string): Promise<SubscriptionStatus> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Stato abbonamento non disponibile');
  return response.json();
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data, isLoading, mutate } = useSWR<SubscriptionStatus>(
    user?.id ? '/api/subscription/status' : null,
    fetcher,
    { revalidateOnFocus: true },
  );
  const status = user ? data : { isPremium: false, plan: null };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium: status?.isPremium ?? false,
        plan: status?.plan ?? 'free',
        expiresAt: status?.expiresAt ?? null,
        source: status?.source ?? null,
        isLoading: Boolean(user) && isLoading,
        refreshSubscription: async () => { await mutate(); },
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
