"use client";

import { useState, useEffect } from 'react';

export interface Banner {
  id: string;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  type: 'info' | 'promo' | 'warning';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

const DISMISS_PREFIX = 'banner_dismissed_';
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 ore

function isDismissed(bannerId: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = `${DISMISS_PREFIX}${bannerId}`;
  const storedTime = localStorage.getItem(key);
  if (!storedTime) return false;
  const elapsed = Date.now() - parseInt(storedTime, 10);
  return elapsed < DISMISS_TTL_MS;
}

function dismissBanner(bannerId: string): void {
  if (typeof window === 'undefined') return;
  const key = `${DISMISS_PREFIX}${bannerId}`;
  localStorage.setItem(key, Date.now().toString());
}

export function useBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const fetchBanner = async () => {
      try {
        const res = await fetch('/api/banners');
        if (!res.ok) throw new Error('Failed to fetch banners');
        const data: Banner[] = await res.json();

        const now = new Date();
        // Filtra banner attivi nel periodo valido e non ancora dismissed
        const activeBanner = data.find(b => {
          if (!b.isActive) return false;
          if (isDismissed(b.id)) return false;
          if (b.startDate && new Date(b.startDate) > now) return false;
          if (b.endDate && new Date(b.endDate) < now) return false;
          return true;
        });

        if (activeBanner) {
          setBanner(activeBanner);
          // Appare dopo 3 secondi per non disturbare il caricamento pagina
          timer = setTimeout(() => setIsVisible(true), 3000);
        }
      } catch {
        // Silenzioso in caso di errore
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanner();
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    if (banner) {
      dismissBanner(banner.id);
      setIsVisible(false);
    }
  };

  return { banner, isVisible, isLoading, dismiss };
}
