"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type {
  LeaguePredictions,
  MultiplePrediction,
  SinglePrediction,
} from "@/data/predictionsData";

type PredictionsSectionProps = {
  data: readonly LeaguePredictions[];
};

const multipleStyles: Record<MultiplePrediction["type"], string> = {
  Raddoppio: "border-emerald-400/30 from-emerald-400/10",
  Bilanciata: "border-sky-400/30 from-sky-400/10",
  "Alta Quota": "border-amber-400/30 from-amber-400/10",
};

const formatOdds = (odds: number) => odds.toFixed(2).replace(".", ",");

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(date));

const calculateTotalOdds = (multiple: MultiplePrediction) =>
  multiple.matches.reduce((total, match) => total * match.odds, 1);

function SectionHeading({
  id,
  icon,
  eyebrow,
  title,
  description,
}: {
  id: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-emerald-300">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-1 text-xl font-black text-white sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function SingleCard({ prediction }: { prediction: SinglePrediction }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="border-b border-slate-800 bg-gradient-to-br from-slate-800/90 to-slate-900 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold capitalize text-slate-400">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              <time dateTime={prediction.date}>{formatDate(prediction.date)}</time>
            </p>
            <h3 className="mt-2 text-lg font-black text-white">{prediction.match}</h3>
          </div>
          <div className="shrink-0 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-right">
            <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-300/70">
              Quota media
            </span>
            <span className="text-xl font-black text-emerald-300">{formatOdds(prediction.odds)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Pronostico</p>
            <p className="mt-1 text-base font-black text-sky-300">{prediction.pick}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Confidenza</p>
            <p className="mt-1 font-black text-white">{prediction.confidence}%</p>
          </div>
        </div>

        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-label={`Confidenza statistica ${prediction.confidence}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={prediction.confidence}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>

        <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{prediction.analysis}</p>

        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            <ChartNoAxesCombined className="size-4 text-emerald-300" aria-hidden="true" />
            Confronta quota
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {prediction.affiliateLinks.map((affiliate) => (
              <a
                key={affiliate.operator}
                href={affiliate.link}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                aria-label={`Vedi quota ${formatOdds(affiliate.oddsValue)} su ${affiliate.operator}`}
                className="group rounded-xl border border-slate-700 bg-slate-950/70 p-3 transition hover:border-sky-400/50 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">{affiliate.operator}</span>
                  <span className="font-black text-emerald-300">{formatOdds(affiliate.oddsValue)}</span>
                </span>
                <span className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold text-sky-300">
                  Vedi su {affiliate.operator}
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">
            {prediction.affiliateLinks[0]?.bonusInfo}
          </p>
        </div>
      </div>
    </article>
  );
}

function MultipleCard({ multiple }: { multiple: MultiplePrediction }) {
  const calculatedOdds = calculateTotalOdds(multiple);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-gradient-to-b ${multipleStyles[multiple.type]} to-slate-900/90 p-5 shadow-xl shadow-black/10`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Multipla</p>
          <h3 className="mt-1 text-xl font-black text-white">{multiple.type}</h3>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right">
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Quota totale</span>
          <span className="text-xl font-black text-emerald-300">{formatOdds(calculatedOdds)}</span>
        </div>
      </div>

      <ol className="my-5 flex-1 space-y-2.5">
        {multiple.matches.map((match, index) => (
          <li key={`${match.match}-${match.pick}`} className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
            <div className="flex items-start gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[10px] font-black text-slate-300">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-400">{match.match}</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="text-sm font-black text-white">{match.pick}</p>
                  <p className="shrink-0 text-sm font-black text-emerald-300">{formatOdds(match.odds)}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="border-t border-slate-700/70 pt-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          <ShieldCheck className="size-4 text-sky-300" aria-hidden="true" />
          Comparazione informativa
        </p>
        <div className="space-y-2">
          {multiple.affiliateLinks.map((affiliate) => (
            <a
              key={affiliate.operator}
              href={affiliate.link}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 transition hover:border-sky-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <span>
                <span className="block text-xs font-black text-white">{affiliate.operator}</span>
                <span className="block text-[10px] text-slate-500">{affiliate.bonusInfo}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-black text-sky-300">
                Info scheda bonus
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function PredictionsSection({ data }: PredictionsSectionProps) {
  const [activeLeagueId, setActiveLeagueId] = useState(data[0]?.leagueId ?? "");
  const activeLeague = data.find((league) => league.leagueId === activeLeagueId) ?? data[0];

  if (!activeLeague) return null;

  return (
    <section className="w-full px-4 pb-24 pt-5 sm:px-6" aria-labelledby="predictions-title">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/80 px-5 py-7 shadow-2xl shadow-black/20 sm:px-8 sm:py-9">
          <div className="absolute -right-16 -top-20 size-56 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                <Sparkles className="size-4" aria-hidden="true" />
                Analisi statistiche
              </p>
              <h1 id="predictions-title" className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Pronostici per campionato
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Singole e multiple organizzate per competizione, con quote e condizioni presentate in forma comparativa.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <Target className="size-8 text-sky-300" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Campionato attivo</p>
                <p className="font-black text-white">{activeLeague.leagueName}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6" role="tablist" aria-label="Seleziona il campionato">
          <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-900/70 p-2">
            {data.map((league) => {
              const isActive = league.leagueId === activeLeague.leagueId;
              return (
                <button
                  key={league.leagueId}
                  id={`tab-${league.leagueId}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${league.leagueId}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveLeagueId(league.leagueId)}
                  className={`shrink-0 rounded-xl px-5 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isActive
                      ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {league.leagueName}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`panel-${activeLeague.leagueId}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeLeague.leagueId}`}
          className="mt-10"
        >
          <section aria-labelledby="singles-title">
            <SectionHeading
              id="singles-title"
              icon={<Target className="size-5" aria-hidden="true" />}
              eyebrow={`${activeLeague.singles.length} selezioni`}
              title="Pronostici Singoli"
              description="Ogni scheda riporta l'esito statistico, la confidenza del modello e un confronto neutrale delle quote disponibili."
            />
            <div className="grid gap-5 lg:grid-cols-2">
              {activeLeague.singles.map((prediction) => (
                <SingleCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          </section>

          <section className="mt-14" aria-labelledby="multiples-title">
            <SectionHeading
              id="multiples-title"
              icon={<Layers3 className="size-5" aria-hidden="true" />}
              eyebrow="3 combinazioni"
              title="Schedine Multiple"
              description="Tre profili distinti. La quota totale visualizzata è calcolata automaticamente dal prodotto delle singole quote."
            />
            <div className="grid gap-5 lg:grid-cols-3">
              {activeLeague.multiples.map((multiple) => (
                <MultipleCard key={multiple.type} multiple={multiple} />
              ))}
            </div>
          </section>
        </div>

        <aside className="mt-10 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-5" aria-label="Informazioni legali">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <p className="font-black text-amber-200">
                18+ | Il gioco può causare dipendenza patologica | Verifica T&amp;C dei bonus sui siti ufficiali
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Contenuto statistico e comparativo. Quote soggette a variazione. I collegamenti agli operatori sono informativi e possono essere affiliati.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
