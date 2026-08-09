"use client";

import React from 'react';
import TeamSelector from '@/components/domain/TeamSelector';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Newspaper, Star, Target, UserRound } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  const getTeamAccent = (id: string | null) => {
    switch (id) {
      case 'napoli': return 'border-[#0EA5E9]/35 shadow-[inset_3px_0_0_#0EA5E9]';
      case 'inter': return 'border-[#3B82F6]/35 shadow-[inset_3px_0_0_#2563EB]';
      case 'milan': return 'border-[#EF4444]/35 shadow-[inset_3px_0_0_#DC2626]';
      case 'juventus': return 'border-[#CBD5E1]/35 shadow-[inset_3px_0_0_#CBD5E1]';
      case 'roma': return 'border-[#F59E0B]/35 shadow-[inset_3px_0_0_#D97706]';
      case 'lazio': return 'border-[#38BDF8]/35 shadow-[inset_3px_0_0_#38BDF8]';
      case 'atalanta': return 'border-[#38BDF8]/35 shadow-[inset_3px_0_0_#2563EB]';
      case 'fiorentina': return 'border-[#A78BFA]/35 shadow-[inset_3px_0_0_#7C3AED]';
      default: return 'border-[#10B981]/35 shadow-[inset_3px_0_0_#10B981]';
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

      {user?.favoriteTeamId && (
        <Link
          href={`/squadra/${user.favoriteTeamId}`}
          className={`group relative mx-auto flex w-full max-w-5xl items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-r from-[#182337] to-[#111827] px-4 py-3 transition-colors hover:bg-[#1E293B] sm:gap-4 sm:px-5 sm:py-4 ${getTeamAccent(user.favoriteTeamId)}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-white/80">
            <Star size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">La tua squadra</span>
            <span className="mt-0.5 block truncate text-lg font-black capitalize text-white sm:text-xl">{user.favoriteTeamName}</span>
          </span>
          <span className="inline-flex shrink-0 items-center text-xs font-black text-[#CBD5E1]">
            <span className="hidden sm:inline">Club Hub</span>
            <ArrowRight size={17} className="ml-0 transition-transform group-hover:translate-x-1 sm:ml-2" />
          </span>
        </Link>
      )}

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
