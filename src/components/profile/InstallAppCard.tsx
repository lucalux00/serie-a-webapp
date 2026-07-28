"use client";

import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export default function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const captureInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
  }, []);
  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };
  if (isInstalled) return null;
  return <section className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-4">
    <div className="mb-2 flex items-center font-bold text-white"><Download className="mr-3 h-5 w-5 text-sky-400" />Installa l&apos;app</div>
    {isIos ? <p className="text-xs leading-relaxed text-slate-300">In Safari tocca <Share className="mx-1 inline h-3.5 w-3.5" />, poi scegli “Aggiungi a Home”.</p> : installPrompt ? <button onClick={install} className="mt-2 w-full rounded-lg bg-sky-500 py-2 text-sm font-black text-white hover:bg-sky-400">SCARICA SUL TELEFONO</button> : <p className="text-xs leading-relaxed text-slate-300">Apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.</p>}
  </section>;
}
