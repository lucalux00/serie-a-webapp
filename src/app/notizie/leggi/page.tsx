import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { sql } from '@vercel/postgres';
import BackButton from '@/components/ui/BackButton';

type NewsArticle = { title: string; source: string | null; snippet: string | null; pub_date: string | Date | null; link: string };
const MAX_SNIPPET_LENGTH = 500;

function shortPreview(value: string | null) {
  if (!value) return null;
  const plainText = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText.length > MAX_SNIPPET_LENGTH ? `${plainText.slice(0, MAX_SNIPPET_LENGTH).trimEnd()}…` : plainText;
}

export default async function ReadNewsPage(props: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await props.searchParams;
  if (!url) return <div className="container mx-auto max-w-3xl px-4 py-8 text-center text-white"><h1 className="mb-4 text-2xl font-bold text-red-500">Articolo non valido</h1><Link href="/notizie" className="font-bold text-emerald-400">Torna alle notizie</Link></div>;

  let article: NewsArticle | undefined;
  try {
    const { rows } = await sql<NewsArticle>`SELECT title, source, snippet, pub_date, link FROM news WHERE link = ${url} LIMIT 1`;
    article = rows[0];
  } catch (error) {
    console.error('News reader lookup failed:', error);
  }

  const title = article?.title ?? 'Articolo dalla fonte originale';
  const source = article?.source ?? 'Fonte originale';
  const preview = shortPreview(article?.snippet ?? null);
  const publishedAt = article?.pub_date ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(article.pub_date)) : null;

  return <div className="container mx-auto max-w-3xl px-4 py-8">
    <div className="mb-6"><BackButton /></div>
    <article className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-xl md:p-8">
      <p className="mb-4 inline-block rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">Fonte: {source}</p>
      <h1 className="mb-4 text-2xl font-black leading-tight text-white md:text-4xl">{title}</h1>
      {publishedAt && <p className="mb-6 text-sm text-slate-400">Pubblicato: {publishedAt}</p>}
      {preview ? <p className="text-lg leading-relaxed text-slate-200">{preview}</p> : <p className="text-lg leading-relaxed text-slate-300">Apri l&apos;articolo originale per leggerlo integralmente dalla fonte che lo ha pubblicato.</p>}
      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-300">
        <p>Anteprima e titolo sono attribuiti a <strong className="text-white">{source}</strong>. Il testo completo e tutti i diritti restano alla fonte originale.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-bold text-emerald-400 hover:text-emerald-300">Leggi l&apos;articolo completo sulla fonte <ExternalLink className="h-4 w-4" /></a>
      </div>
    </article>
  </div>;
}
