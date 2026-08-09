"use client";

import React from 'react';
import TeamSelector from '@/components/domain/TeamSelector';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Newspaper, Star, Target, UserRound } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  // Mappa colori per squadra (semplificata per le big, fallback per le altre)
  const getTeamColor = (id: string | null) => {
    switch (id) {
      case 'napoli': return 'from-[#0EA5E9] to-[#0284C7] shadow-[0_0_40px_rgba(14,165,233,0.3)] border-[#0EA5E9]/50';
      case 'inter': return 'from-[#1E3A8A] to-[#000000] shadow-[0_0_40px_rgba(30,58,138,0.3)] border-[#1E3A8A]/50';
      case 'milan': return 'from-[#DC2626] to-[#000000] shadow-[0_0_40px_rgba(220,38,38,0.3)] border-[#DC2626]/50';
      case 'juventus': return 'from-[#475569] to-[#000000] shadow-[0_0_40px_rgba(255,255,255,0.2)] border-[#94A3B8]/50';
      case 'roma': return 'from-[#B91C1C] to-[#D97706] shadow-[0_0_40px_rgba(185,28,28,0.3)] border-[#D97706]/50';
      case 'lazio': return 'from-[#38BDF8] to-[#0F172A] shadow-[0_0_40px_rgba(56,189,248,0.3)] border-[#38BDF8]/50';
      case 'atalanta': return 'from-[#1E3A8A] to-[#0F172A] shadow-[0_0_40px_rgba(30,58,138,0.3)] border-[#38BDF8]/50';
      case 'fiorentina': return 'from-[#7C3AED] to-[#4C1D95] shadow-[0_0_40px_rgba(124,58,237,0.3)] border-[#7C3AED]/50';
      default: return 'from-[#10B981] to-[#059669] shadow-[0_0_40px_rgba(16,185,129,0.3)] border-[#10B981]/50';
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-4 space-y-6 pb-28 bg-[#0B1120] text-white">
      
      {/* Saluto / onboarding */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h2 className="text-[#94A3B8] text-sm font-bold uppercase tracking-wider">
            {user ? 'Bentornato,' : 'Tattica & Pronostici'}
          </h2>
          <h1 className="text-3xl font-black text-white">
            {user ? user.name : 'Il calcio, con più contesto.'}
          </h1>
        </div>
        <div className="w-12 h-12 bg-[#1E293B] rounded-full border-2 border-[#334155] flex items-center justify-center text-[#10B981] font-black text-xl shadow-lg" aria-hidden="true">
          {user ? user.name.charAt(0).toUpperCase() : <UserRound size={22} />}
        </div>
      </div>

      {!user && (
        <section className="rounded-3xl border border-[#10B981]/30 bg-gradient-to-br from-[#10B981]/20 via-[#1E293B] to-[#0F172A] p-5 shadow-[0_0_36px_rgba(16,185,129,0.12)]">
          <p className="max-w-sm text-sm leading-relaxed text-[#CBD5E1]">
            Scegli la tua squadra, segui il mercato e ricevi un&apos;esperienza costruita sui tuoi interessi.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/profilo" className="inline-flex items-center rounded-xl bg-[#10B981] px-4 py-3 text-sm font-black text-[#0B1120] transition-transform active:scale-95">
              Accedi o registrati <ArrowRight size={16} className="ml-2" />
            </Link>
            <a href="#esplora-squadre" className="inline-flex items-center rounded-xl border border-[#475569] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#334155]">
              Esplora le squadre
            </a>
          </div>
        </section>
      )}

      {/* Banner Squadra Preferita */}
      {user?.favoriteTeamId && (
        <Link
          href={`/squadra/${user.favoriteTeamId}`}
          className={`relative block overflow-hidden p-6 rounded-3xl bg-gradient-to-br border active:scale-95 transition-transform ${getTeamColor(user.favoriteTeamId)}`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star size={100} />
          </div>
          <div className="flex items-center text-white/80 font-bold text-xs uppercase tracking-widest mb-1">
            <Star size={12} className="mr-1" /> La Tua Squadra
          </div>
          <h2 className="text-4xl font-black text-white mb-4 drop-shadow-md capitalize">{user.favoriteTeamName}</h2>
          
          <span className="inline-flex bg-white/20 text-white font-black py-2 px-4 rounded-xl items-center backdrop-blur-sm text-sm">
            Entra nel Club Hub <ArrowRight size={16} className="ml-2" />
          </span>
        </Link>
      )}

      <section className="mx-auto w-full max-w-5xl py-3 sm:py-7" aria-labelledby="centro-del-sito">
        <header className="mx-auto mb-6 max-w-2xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#10B981]">Il cuore del sito</p>
          <h2 id="centro-del-sito" className="mt-2 font-serif text-3xl font-black tracking-tight text-white sm:text-5xl">
            Pronostici <span className="text-[#64748B]">&amp;</span> Fanta
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
            Le analisi della prossima giornata e gli strumenti per decidere la tua formazione.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Link
            href="/pronostici"
            className="group relative min-h-64 overflow-hidden rounded-[2rem] border border-[#10B981]/40 bg-gradient-to-br from-[#123C35] via-[#172A32] to-[#111827] p-7 shadow-[0_24px_70px_rgba(16,185,129,0.14)] transition duration-300 hover:-translate-y-1 hover:border-[#34D399] sm:p-9"
          >
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#10B981]/15 blur-2xl" />
            <div className="relative flex h-full flex-col">
              <div className="mb-8 flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#34D399]/30 bg-[#10B981]/15 text-[#6EE7B7]">
                  <CalendarDays size={28} />
                </span>
                <span className="rounded-full border border-[#34D399]/25 bg-[#10B981]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#6EE7B7]">
                  Prossima giornata
                </span>
              </div>
              <h3 className="font-serif text-3xl font-black text-white sm:text-4xl">Pronostici</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#CBD5E1]">
                Quattro singole e tre multiple per campionato, aggiornate seguendo il calendario reale.
              </p>
              <span className="mt-auto inline-flex items-center pt-7 text-sm font-black text-[#6EE7B7]">
                Vai ai pronostici <ArrowRight size={17} className="ml-2 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <Link
            href="/fantacalcio"
            className="group relative min-h-64 overflow-hidden rounded-[2rem] border border-violet-400/40 bg-gradient-to-br from-[#31205F] via-[#20213F] to-[#111827] p-7 shadow-[0_24px_70px_rgba(139,92,246,0.16)] transition duration-300 hover:-translate-y-1 hover:border-violet-300 sm:p-9"
          >
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-violet-500/20 blur-2xl" />
            <div className="relative flex h-full flex-col">
              <div className="mb-8 flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/15 text-violet-200">
                  <Target size={28} />
                </span>
                <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-200">
                  Formazione e rosa
                </span>
              </div>
              <h3 className="font-serif text-3xl font-black text-white sm:text-4xl">Fanta Hub</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#CBD5E1]">
                Consigli di formazione, gestione della rosa e segnali di mercato raccolti in un unico spazio.
              </p>
              <span className="mt-auto inline-flex items-center pt-7 text-sm font-black text-violet-200">
                Entra nel Fanta Hub <ArrowRight size={17} className="ml-2 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <div id="esplora-squadre" className="mx-auto w-full max-w-5xl">
        <h2 className="text-lg font-black mb-4">Esplora altre squadre</h2>
        <TeamSelector />
      </div>

      <section className="mx-auto w-full max-w-5xl" aria-label="Altri contenuti">
        <Link href="/mercato" className="group flex items-center gap-4 rounded-2xl border border-[#334155] bg-[#1E293B] p-4 transition-colors hover:border-[#0EA5E9] hover:bg-[#243247] sm:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/15 text-[#0EA5E9]"><Newspaper size={21} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-white">Calciomercato</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">Notizie, trattative e aggiornamenti in tempo reale.</p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-[#64748B] transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </div>
  );
}
