"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getConsentSnapshot, OPEN_CONSENT_EVENT, readConsent, saveConsent, subscribeToConsent } from "@/lib/consent";

export default function CookieConsent() {
  const rawConsent = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, () => null);
  const [forceOpen, setForceOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const isVisible = forceOpen || rawConsent === null;

  useEffect(() => {
    const openPreferences = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setAdvertising(current?.advertising ?? false);
      setShowSettings(true);
      setForceOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, openPreferences);
  }, []);

  const storePreferences = (nextAnalytics: boolean, nextAdvertising: boolean) => {
    saveConsent({ analytics: nextAnalytics, advertising: nextAdvertising });
    setAnalytics(nextAnalytics);
    setAdvertising(nextAdvertising);
    setForceOpen(false);
    setShowSettings(false);
  };

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
          className="fixed bottom-[80px] left-4 right-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-[#334155] bg-[#1E293B] p-5 shadow-2xl"
        >
          <div className="space-y-4">
            <div>
              <h2 id="cookie-consent-title" className="text-base font-black text-[#F8FAFC]">Preferenze cookie</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
                Usiamo strumenti tecnici necessari. Analytics e pubblicità restano disattivati finché non presti il consenso. Puoi cambiare scelta in qualsiasi momento dal footer.
              </p>
            </div>
            {showSettings ? (
              <div className="space-y-2" aria-label="Categorie cookie">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-sm">
                  <span><strong className="block text-white">Tecnici</strong><span className="text-xs text-[#94A3B8]">Necessari per sicurezza e funzioni richieste.</span></span>
                  <input type="checkbox" checked disabled aria-label="Cookie tecnici sempre attivi" />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-sm">
                  <span><strong className="block text-white">Analytics</strong><span className="text-xs text-[#94A3B8]">Misurazione dell’uso del sito.</span></span>
                  <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-sm">
                  <span><strong className="block text-white">Pubblicità</strong><span className="text-xs text-[#94A3B8]">Annunci e relativi strumenti di misurazione.</span></span>
                  <input type="checkbox" checked={advertising} onChange={(event) => setAdvertising(event.target.checked)} />
                </label>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/privacy-policy" className="mr-auto px-2 py-2 text-xs font-bold text-[#94A3B8] underline">Privacy Policy</Link>
              {!showSettings ? <button type="button" onClick={() => setShowSettings(true)} className="rounded-full border border-[#475569] px-4 py-2 text-xs font-bold text-white">Personalizza</button> : null}
              <button type="button" onClick={() => storePreferences(false, false)} className="rounded-full border border-[#475569] px-4 py-2 text-xs font-bold text-white">Rifiuta non necessari</button>
              <button type="button" onClick={() => storePreferences(showSettings ? analytics : true, showSettings ? advertising : true)} className="rounded-full bg-[#10B981] px-5 py-2 text-xs font-black text-[#0F172A] shadow-lg">
                {showSettings ? "Salva preferenze" : "Accetta tutti"}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
