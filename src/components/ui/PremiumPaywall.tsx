"use client";

import React, { useState } from 'react';
import { Lock, Zap, TrendingUp, BrainCircuit, BarChart3, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProSignupPromoState } from '@/lib/proSignupPromo';

interface PremiumFeature { icon: React.ReactNode; title: string; description: string; }
interface PremiumPaywallProps { planName?: string; price?: string; priceLabel?: string; ctaLabel?: string; features?: PremiumFeature[]; onCta?: () => void; }

const DEFAULT_FEATURES: PremiumFeature[] = [
  { icon: <BrainCircuit size={16} />, title: 'Predizioni AI avanzate', description: 'Scelte di rendimento basate sulla tua rosa.' },
  { icon: <TrendingUp size={16} />, title: 'Trend della forma', description: 'Indicatori utili per i ballottaggi.' },
  { icon: <BarChart3 size={16} />, title: 'Confronto e planner', description: 'Confronta profili e pianifica 5 giornate.' },
  { icon: <Star size={16} />, title: 'Mercato AI', description: 'Priorità e rinforzi per i reparti scoperti.' },
];

export default function PremiumPaywall({ planName = 'AI Pro', price = '€0,99', priceLabel = '/ mese', ctaLabel = 'Scopri l’accesso Pro', features = DEFAULT_FEATURES, onCta }: PremiumPaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signupPromo = getProSignupPromoState();

  const handleCta = async () => {
    if (onCta) return onCta();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) return window.location.assign('/profilo?subscribe=1');
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout non disponibile.');
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout non disponibile.');
      setIsLoading(false);
    }
  };

  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative overflow-hidden rounded-2xl border border-white/10" id="premium-paywall">
    <div className="absolute inset-0 bg-gradient-to-br from-[#1e1040] via-[#0f172a] to-[#0c1a2e]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15)_0%,_transparent_60%)]" />
    <div className="relative space-y-5 p-5">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-sport-warning)]/20 text-[var(--color-sport-warning)]"><Zap size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-sport-muted)]">Piano</p><h3 className="text-base font-black leading-none text-white">{planName}</h3></div></div><div className="text-right"><div className="text-2xl font-black leading-none text-[var(--color-sport-warning)]">{signupPromo.active ? 'IN PAUSA' : price}</div><div className="text-[10px] font-bold text-[var(--color-sport-muted)]">{signupPromo.active ? 'fino al 16 agosto' : priceLabel}</div></div></div>
      {signupPromo.active ? <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100"><strong>Promozione nuovi account:</strong> chi si registra entro il 16 agosto riceve due mesi Pro gratuiti, senza carta e senza rinnovo automatico. I nuovi acquisti a pagamento riprenderanno dopo la campagna.</div> : null}
      <div className="h-px bg-white/5" />
      <div className="space-y-3">{features.map((feature, index) => <div key={index} className="flex items-start gap-3"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">{feature.icon}</div><div><p className="text-xs font-black text-white">{feature.title}</p><p className="text-[11px] text-[var(--color-sport-muted)]">{feature.description}</p></div></div>)}</div>
      <div className="space-y-2 pt-1"><motion.button whileTap={signupPromo.active ? undefined : { scale: 0.97 }} whileHover={signupPromo.active ? undefined : { scale: 1.02 }} onClick={handleCta} disabled={isLoading || signupPromo.active} id="premium-cta-btn" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-sport-warning)] to-amber-500 py-3.5 text-sm font-black uppercase tracking-wide text-[#0f172a] shadow-[0_4px_20px_rgba(245,158,11,0.35)] disabled:cursor-not-allowed disabled:opacity-60"><Lock size={14} />{signupPromo.active ? 'Abbonamenti in pausa' : isLoading ? 'Apertura checkout…' : ctaLabel}</motion.button>{error && <p role="alert" className="text-center text-[10px] font-bold text-rose-300">{error}</p>}<p className="text-center text-[10px] text-[var(--color-sport-muted)]">{signupPromo.active ? 'La promozione è riservata ai nuovi account creati durante il periodo indicato.' : 'Pagamento sicuro su Stripe. Puoi annullare dal portale di fatturazione.'}</p></div>
    </div>
  </motion.div>;
}
