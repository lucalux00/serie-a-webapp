"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Delay l'apparizione per UX
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          className="fixed bottom-[80px] left-4 right-4 bg-[#1E293B] border border-[#334155] rounded-xl p-4 shadow-2xl z-[100]"
        >
          <div className="flex flex-col space-y-3">
            <h3 className="font-bold text-sm">🍪 Utilizzo dei Cookie e Privacy</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Questo portale utilizza cookie tecnici essenziali. Trattiamo le notizie come Aggregatore RSS in ottemperanza alla Direttiva EU sul Copyright. Non tracciamo i tuoi dati personali per fini pubblicitari.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <a href="/privacy" className="px-4 py-2 text-xs font-bold text-[#94A3B8]">Policy</a>
              <button onClick={accept} className="px-6 py-2 bg-[#10B981] text-[#0F172A] text-xs font-bold rounded-full shadow-lg active:scale-95 transition-transform">
                Accetta
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
