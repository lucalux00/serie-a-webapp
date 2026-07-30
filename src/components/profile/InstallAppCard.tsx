"use client";

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

declare global { interface Window { deferredInstallPrompt?: InstallPromptEvent; } }

export default function InstallAppCard({ userId }: { userId: number | string }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const showInvite = (event: InstallPromptEvent | undefined) => {
      if (!event || standalone) return;
      setInstallPrompt(event);
      const sessionKey = `pwa-install-invite:${userId}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'shown');
        setShowModal(true);
      }
    };
    const onPromptReady = () => showInvite(window.deferredInstallPrompt);
    showInvite(window.deferredInstallPrompt);
    window.addEventListener('serie-a-install-prompt-ready', onPromptReady);
    return () => window.removeEventListener('serie-a-install-prompt-ready', onPromptReady);
  }, [userId]);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    window.deferredInstallPrompt = undefined;
    setShowModal(false);
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      const visitorId = localStorage.getItem('site_visitor_id');
      if (visitorId) fetch('/api/stats/install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId }) }).catch(() => undefined);
    }
  };

  if (isInstalled) return null;

  return <>
    <section className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-4">
      <div className="mb-2 flex items-center font-bold text-white"><Download className="mr-3 h-5 w-5 text-sky-400" />Installa l&apos;app</div>
      {isIos ? <p className="text-xs leading-relaxed text-slate-300">In Safari tocca <Share className="mx-1 inline h-3.5 w-3.5" />, poi scegli “Aggiungi a Home”.</p> : installPrompt ? <button onClick={() => setShowModal(true)} className="mt-2 w-full rounded-lg bg-sky-500 py-2 text-sm font-black text-white hover:bg-sky-400">INSTALLA L&apos;APP</button> : <p className="text-xs leading-relaxed text-slate-300">Apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.</p>}
    </section>
    {showModal && installPrompt && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="install-app-title">
      <div className="relative w-full max-w-sm rounded-3xl border border-sky-400/30 bg-slate-800 p-6 shadow-2xl">
        <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white" aria-label="Chiudi"><X className="h-5 w-5" /></button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15"><Download className="h-6 w-6 text-sky-400" /></div>
        <h2 id="install-app-title" className="text-2xl font-black text-white">Installa l&apos;app</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">Aggiungi Serie A & Pronostici alla schermata Home per aprirla come un&apos;app e ricevere gli aggiornamenti più velocemente.</p>
        <div className="mt-6 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700">Non ora</button><button onClick={install} className="flex-1 rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white hover:bg-sky-400">Installa ora</button></div>
      </div>
    </div>}
  </>;
}
