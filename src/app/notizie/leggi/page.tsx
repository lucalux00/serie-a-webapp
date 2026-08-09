import type { Metadata } from "next";
import { ExternalLink, ShieldCheck } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { getStoredNews, parseNewsId, safeExternalNewsUrl } from "@/lib/newsReader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Anteprima notizia",
  robots: { index: false, follow: true },
};

export default async function ReadNewsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const id = parseNewsId((await searchParams).id);
  let article = null;

  if (id) {
    try {
      article = await getStoredNews(id);
    } catch {
      article = null;
    }
  }

  const externalUrl = article ? safeExternalNewsUrl(article.link) : null;
  if (!article || !externalUrl) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 text-center text-white">
        <h1 className="mb-3 text-2xl font-bold text-[#F87171]">Notizia non disponibile</h1>
        <p className="mb-6 text-sm text-[#94A3B8]">Il riferimento è assente, non valido oppure non è più presente nel feed.</p>
        <BackButton showIcon={false} className="font-bold text-[#10B981] hover:underline" />
      </div>
    );
  }

  const publicationDate = new Date(article.pub_date);
  const publicationLabel = Number.isNaN(publicationDate.getTime())
    ? null
    : new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Rome" }).format(publicationDate);

  return (
    <article className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6"><BackButton /></div>
      <div className="rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-xl sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-[#0EA5E9]/10 px-3 py-1 uppercase tracking-widest text-[#7DD3FC]">{article.source}</span>
          {publicationLabel ? <time className="text-[#94A3B8]" dateTime={publicationDate.toISOString()}>{publicationLabel}</time> : null}
        </div>
        <h1 className="text-2xl font-black leading-tight text-white md:text-4xl">{article.title}</h1>
        {article.snippet ? <p className="mt-6 text-lg leading-relaxed text-[#CBD5E1]">{article.snippet}</p> : null}
        <div className="mt-8 rounded-xl border border-[#334155] bg-[#0F172A] p-4 text-sm text-[#94A3B8]">
          <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" aria-hidden="true" />Questa pagina mostra solo titolo e breve estratto memorizzati nel feed. Il contenuto completo resta sul sito dell’editore.</p>
          <a href={externalUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-4 inline-flex items-center gap-2 font-bold text-[#10B981] hover:underline">
            Leggi l’articolo originale <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
