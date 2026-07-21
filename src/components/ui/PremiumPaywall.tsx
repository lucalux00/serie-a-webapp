"use client";

import React from 'react';
import { Lock, Zap, TrendingUp, BrainCircuit, BarChart3, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PremiumPaywallProps {
  planName?: string;
  price?: string;
  priceLabel?: string;
  ctaLabel?: string;
  features?: PremiumFeature[];
  onCta?: () => void;
}

const DEFAULT_FEATURES: PremiumFeature[] = [
  {
    icon: <BrainCircuit size={16} />,
    title: 'Predizioni AI Avanzate',
    description: 'Previsioni di rendimento giocatore basate su ML',
  },
  {
    icon: <TrendingUp size={16} />,
    title: 'Heat Map della Forma',
    description: 'Analisi trend ultime 10 giornate per ogni giocatore',
  },
  {
    icon: <BarChart3 size={16} />,
    title: 'Statistiche Avanzate',
    description: 'Expected Goals, xA, pressioni, duelli e molto altro',
  },
  {
    icon: <Star size={16} />,
    title: 'Consiglio Capitano AI',
    description: 'Il miglior capitano per la tua rosa ogni giornata',
  },
];

export default function PremiumPaywall({
  planName = 'AI Pro',
  price = '€0,99',
  priceLabel = '/ mese',
  ctaLabel = 'Sblocca AI Pro',
  features = DEFAULT_FEATURES,
  onCta,
}: PremiumPaywallProps) {

  const handleCta = () => {
    if (onCta) {
      onCta();
    } else {
      // Placeholder finché Stripe non è integrato
      alert('🚀 Disponibile a breve! Il pagamento con Stripe sarà integrato presto.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden border border-white/10"
      id="premium-paywall"
    >
      {/* Sfondo gradiente premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e1040] via-[#0f172a] to-[#0c1a2e] z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15)_0%,_transparent_60%)] z-0" />

      {/* Glow top-right */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-[var(--color-sport-warning)]/10 blur-2xl z-0" />

      <div className="relative z-10 p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-sport-warning)]/20 flex items-center justify-center text-[var(--color-sport-warning)]">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-sport-muted)] uppercase tracking-widest font-bold">
                Piano
              </p>
              <h3 className="text-base font-black text-white leading-none">{planName}</h3>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-[var(--color-sport-warning)] leading-none">
              {price}
            </div>
            <div className="text-[10px] text-[var(--color-sport-muted)] font-bold">
              {priceLabel}
            </div>
          </div>
        </div>

        {/* Divisore */}
        <div className="h-px bg-white/5" />

        {/* Features list */}
        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                {feature.icon}
              </div>
              <div>
                <p className="text-xs font-black text-white">{feature.title}</p>
                <p className="text-[11px] text-[var(--color-sport-muted)]">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lock icon + CTA */}
        <div className="pt-1 space-y-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleCta}
            id="premium-cta-btn"
            className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wide
                       bg-gradient-to-r from-[var(--color-sport-warning)] to-amber-500
                       text-[#0f172a]
                       shadow-[0_4px_20px_rgba(245,158,11,0.35)]
                       hover:shadow-[0_4px_28px_rgba(245,158,11,0.5)]
                       transition-shadow
                       flex items-center justify-center gap-2"
          >
            <Lock size={14} />
            {ctaLabel}
          </motion.button>

          <p className="text-center text-[10px] text-[var(--color-sport-muted)]">
            Annulla quando vuoi • Nessun impegno
          </p>
        </div>
      </div>
    </motion.div>
  );
}
