"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  CalendarDays,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";
import type {
  LeaguePredictions,
  MultiplePrediction,
  PredictionsResponse,
  SinglePrediction,
} from "@/data/predictionsData";

type PredictionsSectionProps = {
  initialData?: PredictionsResponse;
};

const fetcher = async (url: string): Promise<PredictionsResponse> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Pronostici non disponibili");
  return response.json();
};

const EMPTY_LEAGUES: readonly LeaguePredictions[] = [];

const multipleStyles: Record<MultiplePrediction["type"], string> = {
  Raddoppio: "border-emerald-400/30 from-emerald-400/10",
  Bilanciata: "border-sky-400/30 from-sky-400/10",
  "Alta Quota": "border-amber-400/30 from-amber-400/10",
};

const formatOdds = (odds: number | null) => odds === null ? "n.d." : odds.toFixed(2).replace(".", ",");

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(date));

const formatOddsUpdate = (date?: string) => date ? new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
}).format(new Date(date)) : null;

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
              Media quota reale
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
          {prediction.oddsSource === "market" ? (
            <p className="text-xs leading-5 text-slate-400">
              Fonte {prediction.oddsProvider} · media aritmetica delle migliori {prediction.bookmakerCount} quote
              {formatOddsUpdate(prediction.oddsUpdatedAt) ? ` · agg. ${formatOddsUpdate(prediction.oddsUpdatedAt)}` : ""}
              {prediction.oddsMin && prediction.oddsMax ? ` · intervallo ${formatOdds(prediction.oddsMin)}–${formatOdds(prediction.oddsMax)}` : ""}
            </p>
          ) : (
            <p className="text-xs leading-5 text-slate-500">Quota pre-match reale non ancora disponibile dal provider.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function MultipleCard({ multiple }: { multiple: MultiplePrediction }) {
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
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Quadro combinato</span>
          <span className="text-xs font-black uppercase tracking-wide text-emerald-300">Selezioni analizzate</span>
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
                <p className="mt-1 text-sm font-black text-white">{match.pick}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="border-t border-slate-700/70 pt-4">
        <p className="text-[11px] leading-5 text-slate-500">
          Combinazione statistica a scopo puramente informativo: non mostra quote numeriche e non contiene collegamenti a operatori.
        </p>
      </div>
    </article>
  );
}

export default function PredictionsSection({ initialData }: PredictionsSectionProps) {
  const { data: response, error, isLoading } = useSWR<PredictionsResponse>(
    "/api/pronostici/campionati",
    fetcher,
    { fallbackData: initialData, refreshInterval: 5 * 60 * 1000, revalidateOnFocus: true },
  );
  const data: readonly LeaguePredictions[] = response?.leagues ?? EMPTY_LEAGUES;
  const [activeLeagueId, setActiveLeagueId] = useState("oggi-domani");
  const activeLeague = data.find((league) => league.leagueId === activeLeagueId) ?? data[0];

  if (!activeLeague) {
    return (
      <section className="w-full px-4 pb-24 pt-5 sm:px-6" aria-label="Pronostici">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-700 bg-slate-900/80 p-8 text-center">
          <p className="font-black text-white">{error ? "Pronostici temporaneamente non disponibili" : "Aggiornamento del calendario in corso"}</p>
          <p className="mt-2 text-sm text-slate-400">{isLoading ? "Stiamo caricando le prossime giornate." : "Il sistema riproverà automaticamente."}</p>
        </div>
      </section>
    );
  }

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
                La prossima giornata di ogni campionato, aggiornata automaticamente ogni mattina. Per i singoli mostriamo la media aritmetica delle migliori 3-4 quote pre-match reali; se non ci sono almeno tre rilevazioni il valore resta n.d.
              </p>
              {response?.generatedAt ? (
                <p className="mt-3 text-xs font-bold text-slate-500">
                  Ultimo aggiornamento: {formatDate(response.generatedAt)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <Target className="size-8 text-sky-300" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Campionato attivo</p>
                <p className="font-black text-white">{activeLeague.leagueName}</p>
                <p className="text-xs font-bold text-emerald-300">{activeLeague.roundLabel}</p>
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
              eyebrow={`${activeLeague.roundLabel} · ${activeLeague.singles.length} selezioni`}
              title="Pronostici Singoli"
              description="Le quattro selezioni seguono il primo turno schedulato della competizione scelta; le stime vengono rigenerate quando cambia la giornata."
            />
            {activeLeague.singles.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {activeLeague.singles.map((prediction) => (
                  <SingleCard key={prediction.id} prediction={prediction} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
                <CalendarDays className="mx-auto size-8 text-slate-600" aria-hidden="true" />
                <p className="mt-3 font-black text-white">
                  {activeLeague.isImmediate ? "Nessuna gara disponibile tra oggi e domani" : "Calendario della prossima giornata non ancora disponibile"}
                </p>
                <p className="mt-2 text-sm text-slate-400">Il controllo automatico viene eseguito ogni mattina.</p>
              </div>
            )}
          </section>

          {activeLeague.multiples.length > 0 ? (
            <section className="mt-14" aria-labelledby="multiples-title">
              <SectionHeading
                id="multiples-title"
                icon={<Layers3 className="size-5" aria-hidden="true" />}
                eyebrow="3 combinazioni della stessa giornata"
                title="Combinazioni statistiche"
                description="Raddoppio, Bilanciata e Alta Quota aggregano esclusivamente le gare mostrate nella tab attiva, senza indicazioni di puntata."
              />
              <div className="grid gap-5 lg:grid-cols-3">
                {activeLeague.multiples.map((multiple) => (
                  <MultipleCard key={multiple.type} multiple={multiple} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="mt-10 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-5" aria-label="Informazioni legali">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <p className="font-black text-amber-200">Contenuto informativo e puramente pronostico; nessun collegamento affiliato è presente.</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Le quote dei singoli sono la media aritmetica delle migliori 3-4 rilevazioni pre-match restituite da API-Football e possono cambiare fino all&#39;evento. “n.d.” significa che il provider non ha ancora restituito almeno tre valori verificabili; non viene sostituito con un numero simulato. Le combinazioni multiple restano analisi statistiche senza quote numeriche.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
