import Link from 'next/link';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

type SearchParams = { url?: string; source?: string; title?: string; snippet?: string };

export default async function ReadNewsPage(props: { searchParams: Promise<SearchParams> }) {
  const { url, source = 'Fonte sconosciuta', title = 'Notizia', snippet = '' } = await props.searchParams;
  let originalUrl: URL | null = null;

  try {
    originalUrl = url ? new URL(url) : null;
    if (!originalUrl || !['http:', 'https:'].includes(originalUrl.protocol)) originalUrl = null;
  } catch {
    originalUrl = null;
  }

  if (!originalUrl) {
    return <div className="container mx-auto max-w-3xl px-4 py-8 text-center text-white"><h1 className="mb-4 text-2xl font-bold text-red-500">URL non valido</h1><Link href="/notizie" className="font-bold text-sky-400">Torna alle notizie</Link></div>;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6"><BackButton /></div>
      <article className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <div className="mb-4 inline-block rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">{source}</div>
        <h1 className="mb-5 text-2xl font-black leading-tight text-white md:text-4xl">{title}</h1>
        {snippet ? <p className="whitespace-pre-line text-lg leading-relaxed text-slate-200">{snippet}</p> : <p className="text-slate-300">La fonte non ha fornito un estratto nel feed RSS.</p>}
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">Mostriamo esclusivamente il titolo e l’eventuale estratto distribuito dal feed RSS. Il testo completo resta sul sito dell’editore.</div>
        <a href={originalUrl.toString()} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-sky-400">Leggi l’articolo originale <ArrowUpRight className="ml-2 h-4 w-4" /></a>
      </article>
      <a href={originalUrl.toString()} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center text-sm font-bold text-sky-400 hover:underline"><ExternalLink className="mr-2 h-4 w-4" /> Apri sulla fonte originale</a>
    </div>
  );
}
