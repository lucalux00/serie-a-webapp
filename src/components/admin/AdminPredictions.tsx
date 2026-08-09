"use client";

import { useState } from "react";
import useSWR from "swr";
import { BrainCircuit, CheckCircle2, Clock3 } from "lucide-react";

type Quote = { tier?: string; type?: string; pick?: string; confidence?: number };
type Draft = {
  id: number;
  home_team: string;
  away_team: string;
  competition?: string;
  match_date: string;
  quotes: Quote[] | string;
  analysis: string;
  model_version: string;
};
type AdminPredictionData = {
  drafts: Draft[];
  latestLearningRun: {
    status: string;
    processed_matches: number;
    evaluated_picks: number;
    weights_version?: string;
    completed_at?: string;
  } | null;
  activeModel: { version: string; sample_size: number };
};

const fetcher = async (url: string): Promise<AdminPredictionData> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Impossibile caricare i draft");
  return response.json();
};

function parseQuotes(value: Draft["quotes"]): Quote[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminPredictions() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/predictions", fetcher, { refreshInterval: 60_000 });
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const publish = async (id: number) => {
    setPublishingId(id);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "publish" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Pubblicazione non riuscita");
      setMessage("Pronostico pubblicato. Il contenuto resta immutabile.");
      await mutate();
    } catch (publishError) {
      setMessage(publishError instanceof Error ? publishError.message : "Pubblicazione non riuscita");
    } finally {
      setPublishingId(null);
    }
  };

  if (isLoading) return <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-sm text-slate-400">Caricamento draft…</div>;
  if (error || !data) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">Impossibile caricare i pronostici.</div>;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4">
          <div className="flex items-center gap-2 text-fuchsia-200"><BrainCircuit size={18} /><span className="font-black">Modello {data.activeModel.version}</span></div>
          <p className="mt-2 text-xs text-slate-300">Campione di ricalibrazione: {data.activeModel.sample_size || 0} valutazioni.</p>
        </div>
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
          <div className="flex items-center gap-2 text-sky-200"><Clock3 size={18} /><span className="font-black">Ultima pipeline</span></div>
          <p className="mt-2 text-xs text-slate-300">
            {data.latestLearningRun
              ? `${data.latestLearningRun.status} · ${data.latestLearningRun.processed_matches} risultati · ${data.latestLearningRun.evaluated_picks} verifiche`
              : "Nessuna esecuzione registrata."}
          </p>
        </div>
      </div>

      {message ? <p className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm font-bold text-slate-200">{message}</p> : null}

      {data.drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">Nessun draft da revisionare.</div>
      ) : (
        <div className="space-y-4">
          {data.drafts.map((draft) => (
            <article key={draft.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-fuchsia-300">Draft immutabile · {draft.model_version}</p>
                  <h3 className="mt-1 font-black text-white">{draft.home_team} - {draft.away_team}</h3>
                  <p className="mt-1 text-xs text-slate-400">{draft.competition || "Calcio"} · {new Date(draft.match_date).toLocaleString("it-IT")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => publish(draft.id)}
                  disabled={publishingId === draft.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> {publishingId === draft.id ? "PUBBLICAZIONE…" : "PUBBLICA"}
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {parseQuotes(draft.quotes).map((quote, index) => (
                  <div key={`${quote.tier || index}-${quote.pick}`} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                    <p className="text-[10px] font-black uppercase text-slate-500">{quote.tier || quote.type || `Opzione ${index + 1}`}</p>
                    <p className="mt-1 text-sm font-black text-emerald-300">{quote.pick}</p>
                    <p className="mt-1 text-xs text-slate-400">Confidenza {quote.confidence ?? "n.d."}%</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{draft.analysis}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
