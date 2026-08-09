"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Share2, Smartphone, Trophy } from "lucide-react";

type WonPrediction = {
  id: number;
  match: string;
  competition: string;
  date: string;
  pick: string;
  confidence: number;
  result: string;
  analysis: string;
  modelVersion: string;
};

const fetcher = async (url: string): Promise<{ predictions: WonPrediction[] }> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Storico non disponibile");
  return response.json();
};

export default function WonPredictionsPage() {
  const { data, error, isLoading } = useSWR("/api/profile/predictions/won", fetcher);
  const [sharing, setSharing] = useState<string | null>(null);

  const share = async (prediction: WonPrediction, format: "post" | "story") => {
    const key = `${prediction.id}-${format}`;
    setSharing(key);
    const imageUrl = `/api/social/prediction-card?id=${prediction.id}&format=${format}`;
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Visual non disponibile");
      const blob = await response.blob();
      const file = new File([blob], `pronostico-${prediction.id}-${format}.png`, { type: "image/png" });
      const shareData = { title: "Tattica & Pronostici", text: `${prediction.match}: ${prediction.pick} (${prediction.result})`, files: [file] };
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
      } else {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = file.name;
        link.click();
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== "AbortError") window.open(imageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setSharing(null);
    }
  };

  const predictions = data?.predictions || [];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
      <Link href="/profilo" className="mb-6 flex items-center text-[#94A3B8] transition-colors hover:text-white">
        <ArrowLeft className="mr-2 h-5 w-5" /> Torna al Profilo
      </Link>

      <header className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-[#F59E0B]/20 p-3"><Trophy className="h-8 w-8 text-[#F59E0B]" /></div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight text-white">I Miei <span className="text-[#F59E0B]">Pronostici</span></h1>
          <p className="text-sm text-[#94A3B8]">Storico reale dei pronostici pubblicati e verificati dalla pipeline risultati.</p>
        </div>
      </header>

      {isLoading ? <div className="py-12 text-center text-[#94A3B8]">Caricamento storico…</div> : null}
      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">Impossibile caricare lo storico.</div> : null}

      <div className="space-y-5">
        {predictions.map((prediction) => (
          <article key={prediction.id} className="relative overflow-hidden rounded-2xl border border-[#F59E0B]/30 bg-[#1E293B] p-5 shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#F59E0B]/5 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-[#334155] pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B]">{prediction.competition} · {prediction.modelVersion}</p>
                <h2 className="mt-1 text-lg font-black text-white">{prediction.match}</h2>
                <p className="mt-1 text-xs text-[#94A3B8]">{new Date(prediction.date).toLocaleDateString("it-IT")}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-2">
                <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                <div><p className="text-[10px] font-black uppercase text-[#10B981]">Risultato</p><p className="font-black text-white">{prediction.result}</p></div>
              </div>
            </div>

            <div className="relative mt-4 rounded-xl border border-[#334155] bg-[#0F172A] p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">Pronostico centrato</p>
              <p className="mt-1 text-lg font-black text-[#10B981]">{prediction.pick}</p>
              {prediction.confidence ? <p className="mt-1 text-xs text-[#94A3B8]">Confidenza iniziale {prediction.confidence}%</p> : null}
              <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">{prediction.analysis}</p>
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => share(prediction, "post")} disabled={sharing !== null} className="flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-3 py-3 text-xs font-black text-[#0F172A] disabled:opacity-50">
                {sharing === `${prediction.id}-post` ? <ImageIcon size={16} /> : <Share2 size={16} />} POST 4:5
              </button>
              <button type="button" onClick={() => share(prediction, "story")} disabled={sharing !== null} className="flex items-center justify-center gap-2 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 px-3 py-3 text-xs font-black text-[#A7F3D0] disabled:opacity-50">
                <Smartphone size={16} /> STORIA 9:16
              </button>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && !error && predictions.length === 0 ? (
        <div className="rounded-2xl border border-[#334155] bg-[#1E293B] py-12 text-center">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-[#334155]" />
          <p className="text-[#94A3B8]">Nessun pronostico vinto e verificato al momento.</p>
        </div>
      ) : null}
    </div>
  );
}
