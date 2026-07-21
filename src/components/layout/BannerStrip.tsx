"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Megaphone, Zap, AlertTriangle } from 'lucide-react';
import { useBanner, Banner } from '@/hooks/useBanner';

const bannerConfig: Record<Banner['type'], {
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  textClass: string;
  ctaClass: string;
}> = {
  info: {
    icon: <Megaphone size={14} />,
    bgClass: 'bg-[var(--color-sport-card)]/90',
    borderClass: 'border-[var(--color-sport-secondary)]/30',
    iconBgClass: 'bg-[var(--color-sport-secondary)]/20 text-[var(--color-sport-secondary)]',
    textClass: 'text-[var(--color-sport-text)]',
    ctaClass: 'bg-[var(--color-sport-secondary)]/20 text-[var(--color-sport-secondary)] hover:bg-[var(--color-sport-secondary)]/30',
  },
  promo: {
    icon: <Zap size={14} />,
    bgClass: 'bg-gradient-to-r from-[var(--color-sport-card)]/95 to-[#1a1040]/95',
    borderClass: 'border-[var(--color-sport-warning)]/30',
    iconBgClass: 'bg-[var(--color-sport-warning)]/20 text-[var(--color-sport-warning)]',
    textClass: 'text-[var(--color-sport-text)]',
    ctaClass: 'bg-[var(--color-sport-warning)]/20 text-[var(--color-sport-warning)] hover:bg-[var(--color-sport-warning)]/30',
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    bgClass: 'bg-[var(--color-sport-card)]/90',
    borderClass: 'border-[var(--color-sport-danger)]/30',
    iconBgClass: 'bg-[var(--color-sport-danger)]/20 text-[var(--color-sport-danger)]',
    textClass: 'text-[var(--color-sport-text)]',
    ctaClass: 'bg-[var(--color-sport-danger)]/20 text-[var(--color-sport-danger)] hover:bg-[var(--color-sport-danger)]/30',
  },
};

export default function BannerStrip() {
  const { banner, isVisible, dismiss } = useBanner();

  if (!banner) return null;

  const config = bannerConfig[banner.type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={banner.id}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`
            fixed bottom-[64px] left-0 right-0 z-40
            ${config.bgClass}
            border-t ${config.borderClass}
            backdrop-blur-md
            px-3 py-2
            flex items-center gap-2
            shadow-[0_-4px_20px_rgba(0,0,0,0.3)]
          `}
          id="banner-strip"
          role="banner"
          aria-label={`Banner: ${banner.title}`}
        >
          {/* Icona tipo */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.iconBgClass}`}>
            {config.icon}
          </div>

          {/* Testo */}
          <div className="flex-1 min-w-0">
            {banner.title && (
              <span className={`font-black text-xs uppercase tracking-wide mr-1.5 ${config.textClass}`}>
                {banner.title}
              </span>
            )}
            <span className="text-xs text-[var(--color-sport-muted)] truncate">
              {banner.message}
            </span>
          </div>

          {/* CTA link opzionale */}
          {banner.link && banner.linkLabel && (
            <a
              href={banner.link}
              target={banner.link.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${config.ctaClass}`}
            >
              {banner.linkLabel}
              {banner.link.startsWith('http') && <ExternalLink size={10} />}
            </a>
          )}

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-sport-muted)] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Chiudi banner"
            id="banner-dismiss-btn"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
