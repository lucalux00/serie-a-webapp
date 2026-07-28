"use client";

import useSWR from 'swr';
import { CreditCard, Download, RefreshCw, Users, UserRoundPlus } from 'lucide-react';

type AdminStats = {
  uniqueVisitors: number;
  registrations: number;
  appInstalls: number;
  activeSubscriptions: number;
  updatedAt: string;
};

const fetcher = (url: string) => fetch(url).then(async (response) => {
  if (!response.ok) throw new Error('Statistiche non disponibili');
  return response.json();
});

const metrics = [
  { key: 'uniqueVisitors', label: 'Visitatori unici', description: 'Dispositivi che hanno aperto il sito', icon: Users, color: 'text-sky-400' },
  { key: 'registrations', label: 'Registrati', description: 'Account creati', icon: UserRoundPlus, color: 'text-emerald-400' },
  { key: 'appInstalls', label: 'App installata', description: 'Installazioni PWA confermate', icon: Download, color: 'text-violet-400' },
  { key: 'activeSubscriptions', label: 'Abbonamenti', description: 'Piani attivi o in prova', icon: CreditCard, color: 'text-amber-400' },
] as const;

export default function AdminStatsPanel() {
  const { data, error, isValidating, mutate } = useSWR<AdminStats>('/api/admin/stats', fetcher, { refreshInterval: 60000 });

  return (
    <section className="mb-6 rounded-2xl border border-fuchsia-400/20 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Statistiche reali</h2>
          <p className="mt-1 text-xs text-slate-400">Aggiornate ogni minuto. Le visite sono dispositivi unici, non page view.</p>
        </div>
        <button onClick={() => mutate()} disabled={isValidating} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50" title="Aggiorna statistiche">
          <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {error ? <p className="text-sm text-red-400">Le statistiche non sono disponibili in questo momento.</p> : (
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ key, label, description, icon: Icon, color }) => (
            <div key={key} className="rounded-xl border border-slate-700 bg-slate-800 p-3">
              <Icon className={`mb-2 h-5 w-5 ${color}`} />
              <p className="text-2xl font-black text-white">{data ? data[key].toLocaleString('it-IT') : '—'}</p>
              <p className="text-xs font-bold text-slate-200">{label}</p>
              <p className="mt-1 text-[10px] leading-tight text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
