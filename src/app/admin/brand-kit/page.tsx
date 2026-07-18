"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, Info, Paintbrush, Type, Layout, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BrandKitPage() {
  const { user } = useAuth();

  if (!user || (!user.isAdmin && user.email !== 'lucapinelli0000@gmail.com' && user.email !== 'luca.pinelli0000@gmail.com')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-[var(--color-sport-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-black uppercase text-white">Accesso Negato</h1>
        <p className="text-[var(--color-sport-muted)] mt-2">Devi essere amministratore per vedere questa pagina.</p>
        <Link href="/" className="text-[var(--color-sport-primary)] mt-4 inline-block font-bold">Torna alla Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4 md:p-8 max-w-5xl mx-auto space-y-12">
      <header className="mb-8">
        <Link href="/" className="inline-flex items-center text-[var(--color-sport-muted)] hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Link>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)]">
          Brand Kit & Design System
        </h1>
        <p className="text-[var(--color-sport-muted)] mt-2">
          Questa pagina è dedicata agli amministratori e sviluppatori. Definisce le regole di stile, i componenti e la filosofia da utilizzare in tutto il sito.
        </p>
      </header>

      {/* 1. Filosofia e Regole Generali */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
          <ShieldAlert className="w-6 h-6 text-[var(--color-sport-primary)]" />
          <h2 className="text-2xl font-semibold">1. Regole Generali</h2>
        </div>
        <div className="bg-[var(--color-sport-card)]/50 backdrop-blur-md rounded-xl p-6 border border-white/5 space-y-4">
          <ul className="space-y-3 text-sm md:text-base text-[var(--color-sport-text)]">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-sport-primary)] shrink-0 mt-0.5" />
              <span><strong>Mobile-First:</strong> Progetta sempre prima per dispositivi mobili. Usa padding adeguati (es. `p-4`) e assicurati che gli elementi touch siano facilmente cliccabili (minimo 44x44px).</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-sport-primary)] shrink-0 mt-0.5" />
              <span><strong>Estetica Premium (Glassmorphism):</strong> Usa sfondi semi-trasparenti (`bg-[var(--color-sport-card)]/50`), blur (`backdrop-blur-md`), e bordi sottili (`border border-white/5` o `border-white/10`). Evita colori solidi piatti per i contenitori.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-sport-primary)] shrink-0 mt-0.5" />
              <span><strong>Dinamismo:</strong> Usa transizioni fluide (`transition-all duration-300`), effetti hover (es. `hover:bg-white/5`, `hover:border-white/20`, `hover:scale-[1.02]`) per rendere l'interfaccia viva.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--color-sport-warning)] shrink-0 mt-0.5" />
              <span><strong>Nessun Tailwind Standard Colors per il tema base:</strong> Usa sempre le variabili CSS definite (`var(--color-sport-...)`) o classi arbitrarie basate su queste, per garantire coerenza cromatica.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 2. Colori */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
          <Paintbrush className="w-6 h-6 text-[var(--color-sport-primary)]" />
          <h2 className="text-2xl font-semibold">2. Palette Colori</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Background */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#0F172A]" />
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Background</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-bg</div>
              <div className="text-[var(--color-sport-muted)]">#0F172A</div>
            </div>
          </div>
          {/* Card */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#1E293B]" />
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Card</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-card</div>
              <div className="text-[var(--color-sport-muted)]">#1E293B</div>
            </div>
          </div>
          {/* Primary */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#10B981]" />
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Primary</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-primary</div>
              <div className="text-[var(--color-sport-muted)]">#10B981</div>
            </div>
          </div>
          {/* Secondary */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#0EA5E9]" />
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Secondary</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-secondary</div>
              <div className="text-[var(--color-sport-muted)]">#0EA5E9</div>
            </div>
          </div>
          {/* Danger */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#EF4444]" />
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Danger</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-danger</div>
              <div className="text-[var(--color-sport-muted)]">#EF4444</div>
            </div>
          </div>
          {/* Warning */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#F59E0B]" />
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Warning</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-warning</div>
              <div className="text-[var(--color-sport-muted)]">#F59E0B</div>
            </div>
          </div>
          {/* Text */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#F8FAFC] flex items-center justify-center">
              <span className="text-[#0F172A] font-bold">Aa</span>
            </div>
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Text Base</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-text</div>
              <div className="text-[var(--color-sport-muted)]">#F8FAFC</div>
            </div>
          </div>
          {/* Muted */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-24 bg-[#94A3B8] flex items-center justify-center">
              <span className="text-[#0F172A] font-bold">Aa</span>
            </div>
            <div className="p-3 bg-[var(--color-sport-card)]/80 text-xs">
              <div className="font-bold text-white">Text Muted</div>
              <div className="text-[var(--color-sport-muted)]">--color-sport-muted</div>
              <div className="text-[var(--color-sport-muted)]">#94A3B8</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tipografia */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
          <Type className="w-6 h-6 text-[var(--color-sport-primary)]" />
          <h2 className="text-2xl font-semibold">3. Tipografia</h2>
        </div>
        <div className="bg-[var(--color-sport-card)]/30 border border-white/5 rounded-xl p-6 space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">Titolo H1 (4xl/5xl)</h1>
            <p className="text-xs text-[var(--color-sport-muted)] mt-1">Uso: Titolo principale della pagina.</p>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">Titolo H2 (2xl/3xl)</h2>
            <p className="text-xs text-[var(--color-sport-muted)] mt-1">Uso: Sezioni principali.</p>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-medium">Titolo H3 (lg/xl)</h3>
            <p className="text-xs text-[var(--color-sport-muted)] mt-1">Uso: Sottosezioni o titoli di card.</p>
          </div>
          <div>
            <p className="text-base text-[var(--color-sport-text)]">
              Testo paragrafo standard (base). Utilizzato per i contenuti normali, descrizioni lunghe. Il testo deve essere altamente leggibile, sfruttando il contrasto con lo sfondo scuro.
            </p>
            <p className="text-xs text-[var(--color-sport-muted)] mt-1">Uso: Corpo del testo.</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-sport-muted)]">
              Testo piccolo o secondario (sm / muted). Utilizzato per metadati, date, note a piè di pagina o elementi non primari.
            </p>
            <p className="text-xs text-[var(--color-sport-muted)] mt-1">Uso: Metadati, note, helper text.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)]">
              Testo Gradiente (H2/H1)
            </h2>
            <p className="text-xs text-[var(--color-sport-muted)] mt-1">
              Uso: Per dare enfasi estrema o per l'hero section. Classi: `bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)]`
            </p>
          </div>
        </div>
      </section>

      {/* 4. Componenti UI Base */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
          <Layout className="w-6 h-6 text-[var(--color-sport-primary)]" />
          <h2 className="text-2xl font-semibold">4. Componenti Base</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pulsanti */}
          <div className="bg-[var(--color-sport-card)]/50 backdrop-blur-md rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-medium border-b border-white/10 pb-2">Pulsanti</h3>
            <div className="flex flex-col gap-4">
              <div>
                <button className="px-6 py-2 rounded-full bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)] text-white font-semibold hover:opacity-90 transition-opacity w-full md:w-auto">
                  Pulsante Primario
                </button>
                <p className="text-xs text-[var(--color-sport-muted)] mt-2">Classi: `bg-gradient-to-r from-[var(--color-sport-primary)] to-[var(--color-sport-secondary)] rounded-full px-6 py-2 font-semibold hover:opacity-90 transition-opacity`</p>
              </div>
              
              <div>
                <button className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors w-full md:w-auto">
                  Pulsante Secondario (Glass)
                </button>
                <p className="text-xs text-[var(--color-sport-muted)] mt-2">Classi: `border border-white/10 bg-white/5 hover:bg-white/10 rounded-full px-6 py-2 font-medium transition-colors`</p>
              </div>

              <div>
                <button className="px-6 py-2 rounded-full bg-[var(--color-sport-danger)]/10 text-[var(--color-sport-danger)] hover:bg-[var(--color-sport-danger)]/20 font-medium transition-colors w-full md:w-auto border border-[var(--color-sport-danger)]/20">
                  Pulsante Destruttivo
                </button>
                <p className="text-xs text-[var(--color-sport-muted)] mt-2">Classi: `bg-[var(--color-sport-danger)]/10 text-[var(--color-sport-danger)] border border-[var(--color-sport-danger)]/20 hover:bg-[var(--color-sport-danger)]/20 ...`</p>
              </div>
            </div>
          </div>

          {/* Cards & Contenitori */}
          <div className="bg-[var(--color-sport-card)]/50 backdrop-blur-md rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-medium border-b border-white/10 pb-2">Cards & Container</h3>
            
            <div className="bg-[var(--color-sport-card)] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer group">
              <h4 className="font-semibold text-white group-hover:text-[var(--color-sport-primary)] transition-colors">Card Cliccabile Standard</h4>
              <p className="text-sm text-[var(--color-sport-muted)] mt-1">Usa border, hover states e transizioni per renderla interattiva.</p>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-sport-muted)]">Footer info</span>
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-sport-primary)]/20 transition-colors">
                   <ArrowLeft className="w-3 h-3 rotate-180 text-white" />
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--color-sport-muted)] mt-2">Classi: `bg-[var(--color-sport-card)] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer group`</p>
          </div>

          {/* Badges / Etichette */}
          <div className="bg-[var(--color-sport-card)]/50 backdrop-blur-md rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-medium border-b border-white/10 pb-2">Badges & Tags</h3>
            
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-[var(--color-sport-primary)]/20 text-[var(--color-sport-primary)] border border-[var(--color-sport-primary)]/20">
                Success
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-[var(--color-sport-secondary)]/20 text-[var(--color-sport-secondary)] border border-[var(--color-sport-secondary)]/20">
                Info
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-[var(--color-sport-warning)]/20 text-[var(--color-sport-warning)] border border-[var(--color-sport-warning)]/20">
                Warning
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-[var(--color-sport-danger)]/20 text-[var(--color-sport-danger)] border border-[var(--color-sport-danger)]/20">
                Danger
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-white/10 text-white border border-white/10">
                Neutral
              </span>
            </div>
            <p className="text-xs text-[var(--color-sport-muted)] mt-2">Classi tipiche: `px-2 py-1 text-xs font-medium rounded-md bg-[COLOR]/20 text-[COLOR] border border-[COLOR]/20`</p>
          </div>

          {/* Alert / Info Box */}
          <div className="bg-[var(--color-sport-card)]/50 backdrop-blur-md rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-medium border-b border-white/10 pb-2">Info Box</h3>
            
            <div className="bg-[var(--color-sport-secondary)]/10 border-l-4 border-[var(--color-sport-secondary)] p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[var(--color-sport-secondary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[var(--color-sport-secondary)] text-sm">Nota Importante</h4>
                  <p className="text-sm text-[var(--color-sport-text)] mt-1">Usa questo componente per dare indicazioni, avvisi o informazioni contestuali all'utente.</p>
                </div>
              </div>
            </div>
             <p className="text-xs text-[var(--color-sport-muted)] mt-2">Classi: `bg-[var(--color-sport-secondary)]/10 border-l-4 border-[var(--color-sport-secondary)] p-4 rounded-r-xl`</p>
          </div>
        </div>
      </section>
    </div>
  );
}
