"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { Clock, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface News {
  id: number;
  title: string;
  link: string;
  pub_date: string;
  source: string;
  time: string;
  snippet: string | null;
  type: string;
  status: string;
}

export default function NotiziePage() {
  const [filter, setFilter] = useState<'all' | 'live' | 'mercato'>('all');

  // Aggiornamento ogni 5 minuti (300.000 ms)
  const { data: news, error, isValidating, mutate } = useSWR<News[]>(
    `/api/news?limit=50${filter !== 'all' ? `&type=${filter}` : ''}`, 
    fetcher, 
    { refreshInterval: 300000 }
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Notizie <span className="text-blue-500">Live</span></h1>
          <p className="text-slate-400">Aggiornamenti in tempo reale sul calcio italiano e mercato.</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1 rounded-xl">
          {(['all', 'live', 'mercato'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              {f === 'all' ? 'Tutte' : f === 'live' ? 'Live' : 'Mercato'}
            </button>
          ))}
          <button 
            onClick={() => mutate()} 
            disabled={isValidating}
            className={`ml-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${isValidating ? 'animate-spin text-blue-500' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center mb-8">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>Impossibile caricare le notizie in questo momento. Riprova più tardi.</p>
        </div>
      )}

      {!news && !error && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex space-x-4 bg-slate-800/50 p-6 rounded-3xl">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700 rounded"></div>
                  <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 relative">
        <AnimatePresence mode="popLayout">
          {news?.map((item) => {
            const isManual = item.source === 'Redazione';
            const statusColor = item.status === 'ufficiale' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 
                               item.status === 'trattativa' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' : 
                               'text-slate-300 border-slate-600 bg-slate-800';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`group bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700 hover:border-blue-500/50 transition-all ${isManual ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-slate-300">
                      {item.source}
                    </span>
                    {item.type === 'mercato' && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${statusColor}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-slate-400 text-xs font-semibold">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.time}
                  </div>
                </div>

                <a href={item.link} target={isManual ? "_self" : "_blank"} rel="noreferrer" className="block outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2 leading-tight">
                    {item.title}
                  </h2>
                </a>

                {item.snippet && (
                  <p className="text-slate-400 text-sm line-clamp-2 mt-2">
                    {item.snippet}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                  <a href={item.link} target={isManual ? "_self" : "_blank"} rel="noreferrer" className="text-xs font-bold uppercase tracking-widest flex items-center text-blue-500 hover:text-blue-400 transition-colors">
                    Leggi tutto <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {news?.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Nessuna notizia trovata per i criteri selezionati.
          </div>
        )}
      </div>
    </div>
  );
}
