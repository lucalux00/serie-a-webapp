import React from 'react';
import { RefreshCw } from 'lucide-react';
import MarketFeed from '@/components/domain/MarketFeed';

export default function MercatoPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row items-center md:justify-start justify-center gap-6 mb-8 bg-[var(--color-sport-card)]/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-full border border-white/10 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <RefreshCw size={48} className="text-[var(--color-sport-primary)]" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-[var(--color-sport-text)] uppercase tracking-tighter mb-2">
            Live <span className="text-[var(--color-sport-primary)]">Calciomercato</span>
          </h1>
          <p className="text-[var(--color-sport-muted)] font-medium">
            Tutte le ultime trattative, ufficialità e indiscrezioni in tempo reale.
          </p>
        </div>
      </div>
      <MarketFeed />
    </div>
  );
}
