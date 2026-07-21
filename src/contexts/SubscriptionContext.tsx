"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SubscriptionStatus {
  isPremium: boolean;
  plan: 'free' | 'pro' | null;
  expiresAt?: string | null;
}

interface SubscriptionContextType {
  isPremium: boolean;
  plan: 'free' | 'pro' | null;
  expiresAt: string | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({ isPremium: false, plan: 'free' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setStatus({ isPremium: false, plan: null });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data: SubscriptionStatus = await res.json();
        setStatus(data);
      }
    } catch {
      setStatus({ isPremium: false, plan: 'free' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium: status.isPremium,
        plan: status.plan ?? 'free',
        expiresAt: status.expiresAt ?? null,
        isLoading,
        refreshSubscription: fetchSubscription,
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
