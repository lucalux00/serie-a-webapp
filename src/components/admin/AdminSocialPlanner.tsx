"use client";

import { useState } from "react";
import useSWR from "swr";
import { CalendarClock, Check, Copy, FileText, Layers3, Smartphone, Target } from "lucide-react";

type DraftFormat = "post" | "story";

type SocialSingle = {
  id: string;
  match: string;
  date: string;
  pick: string;
  confidence: number;
  odds: number | null;
  postText: string;
  storyText: string;
  storyVisualUrl: string;
};

type SocialMultiple = {
  id: string;
  type: string;
  matches: Array<{ match: string; pick: string }>;
  postText: string;
  storyText: string;
  storyVisualUrl: string;
};

type SocialLeague = {
  leagueId: string;
  leagueName: string;
  roundLabel: string;
  singles: SocialSingle[];
  multiples: SocialMultiple[];
};

type SocialDraftResponse = {
  hasDraft: boolean;
  generatedAt: string;
  leagues: SocialLeague[];
  totals: { singles: number; multiples: number };
  bulk: Record<DraftFormat, { singles: string; multiples: string; all: string }>;
};

type AdminSocialPlannerProps = {
  onCopy: (text: string, label: string) => Promise<void>;
};

const fetcher = async (url: string): Promise<SocialDraftResponse> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Impossibile caricare il piano social");
  return response.json();
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

function CopyButton({ label, onClick, compact = false }: { label: string; onClick: () => Promise<void>; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await onClick();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 font-black text-slate-950 transition hover:bg-emerald-400 ${compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"}`}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copiato" : label}
    </button>
  );
}

function DraftPreview({ text }: { text: string }) {
  return (
    <textarea
      readOnly
      value={text}
      aria-label="Testo pronto da copiare"
      onFocus={(event) => event.currentTarget.select()}
      className="mt-4 min-h-64 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/80 p-4 font-sans text-sm leading-6 text-slate-300 outline-none focus:border-emerald-400"
    />
  );
}

function StoryVisual({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-slate-950/70 p-3">
      <div className="mx-auto max-w-[270px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl">
        {/* The image is an authenticated dynamic route, so next/image optimization cannot forward the admin cookie. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} loading="lazy" className="aspect-[9/16] w-full object-cover" />
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-xs font-black text-slate-950 transition hover:bg-emerald-400">
        Apri / scarica visual Story 9:16
      </a>
    </div>
  );
}

export default function AdminSocialPlanner({ onCopy }: AdminSocialPlannerProps) {
  const [format, setFormat] = useState<DraftFormat>("post");
  const { data, error, isLoading } = useSWR<SocialDraftResponse>("/api/admin/social-draft", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const visibleLeagues = data?.leagues ?? [];
  const formatLabel = format === "post" ? "Post" : "Storia";

  if (isLoading && !data) {
    return <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">Preparazione del piano social giornaliero…</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">Impossibile caricare il piano social. Riprova tra poco.</div>;
  }

  if (!data?.hasDraft) {
    return <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">Non ci sono pronostici pubblicati da trasformare in contenuti social.</div>;
  }

  return (
    <div className="space-y-7">
      <header className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-5">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 shrink-0 text-fuchsia-300" size={21} />
          <div>
            <h2 className="font-black uppercase tracking-wider text-fuchsia-200">Planner Facebook giornaliero</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Testi pronti per Meta Business Suite: pronostici singoli e multiple sono separati e disponibili sia come Post sia come Storia. Sono inclusi soltanto i pronostici già pubblicati.</p>
            <p className="mt-2 text-xs font-bold text-slate-500">Dati aggiornati: {formatUpdatedAt(data.generatedAt)}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 p-2" role="tablist" aria-label="Formato Facebook">
        <button type="button" role="tab" aria-selected={format === "post"} onClick={() => setFormat("post")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${format === "post" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:bg-slate-800"}`}>
          <FileText size={17} /> Post Facebook
        </button>
        <button type="button" role="tab" aria-selected={format === "story"} onClick={() => setFormat("story")} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${format === "story" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:bg-slate-800"}`}>
          <Smartphone size={17} /> Storia Facebook
        </button>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Copia rapida · formato {formatLabel}</p>
            <p className="mt-1 text-sm text-slate-300">{data.totals.singles} singoli e {data.totals.multiples} multiple pronti.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <CopyButton compact label="Tutti i singoli" onClick={() => onCopy(data.bulk[format].singles, `tutti i singoli · ${formatLabel}`)} />
            <CopyButton compact label="Tutte le multiple" onClick={() => onCopy(data.bulk[format].multiples, `tutte le multiple · ${formatLabel}`)} />
            <CopyButton compact label="Copia tutto" onClick={() => onCopy(data.bulk[format].all, `piano completo · ${formatLabel}`)} />
          </div>
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="social-singles-title">
        <div className="flex items-center gap-3">
          <Target className="text-sky-300" size={20} />
          <div>
            <h3 id="social-singles-title" className="font-black uppercase tracking-wider text-white">Pronostici singoli</h3>
            <p className="text-xs text-slate-500">Un contenuto distinto per ogni partita.</p>
          </div>
        </div>
        {visibleLeagues.map((league) => league.singles.length > 0 && (
          <div key={`single-${league.leagueId}`} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h4 className="text-sm font-black text-sky-300">{league.leagueName}</h4>
              <span className="text-xs font-bold text-slate-500">{league.roundLabel}</span>
            </div>
            {league.singles.map((single) => {
              const text = format === "post" ? single.postText : single.storyText;
              return (
                <article key={`${league.leagueId}-${single.id}`} className="[content-visibility:auto] rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-black text-white">{single.match}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-300">{single.pick}</p>
                    </div>
                    <CopyButton compact label={`Copia ${formatLabel}`} onClick={() => onCopy(text, `${single.match} · ${formatLabel}`)} />
                  </div>
                  {format === "story" ? <StoryVisual url={single.storyVisualUrl} alt={`Story ${single.match}`} /> : null}
                  <DraftPreview text={text} />
                </article>
              );
            })}
          </div>
        ))}
      </section>

      <section className="space-y-5 border-t border-slate-700 pt-7" aria-labelledby="social-multiples-title">
        <div className="flex items-center gap-3">
          <Layers3 className="text-amber-300" size={20} />
          <div>
            <h3 id="social-multiples-title" className="font-black uppercase tracking-wider text-white">Multiple consigliate</h3>
            <p className="text-xs text-slate-500">Raddoppio, Bilanciata e Alta Quota, sempre senza quote numeriche.</p>
          </div>
        </div>
        {visibleLeagues.map((league) => league.multiples.length > 0 && (
          <div key={`multiple-${league.leagueId}`} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h4 className="text-sm font-black text-amber-300">{league.leagueName}</h4>
              <span className="text-xs font-bold text-slate-500">{league.roundLabel}</span>
            </div>
            {league.multiples.map((multiple) => {
              const text = format === "post" ? multiple.postText : multiple.storyText;
              return (
                <article key={multiple.id} className="[content-visibility:auto] rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-black text-white">Multipla {multiple.type}</p>
                      <p className="mt-1 text-xs text-slate-500">{multiple.matches.length} selezioni</p>
                    </div>
                    <CopyButton compact label={`Copia ${formatLabel}`} onClick={() => onCopy(text, `Multipla ${multiple.type} · ${formatLabel}`)} />
                  </div>
                  {format === "story" ? <StoryVisual url={multiple.storyVisualUrl} alt={`Story multipla ${multiple.type}`} /> : null}
                  <DraftPreview text={text} />
                </article>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
