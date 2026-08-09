"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  ExternalLink,
  LoaderCircle,
  Newspaper,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ALL_TEAMS } from '@/data/teams';
import TeamLogo from '@/components/ui/TeamLogo';
import type { MarketNewsCategory } from '@/lib/news';

type CategoryFilter = 'TUTTE' | MarketNewsCategory;

interface MarketArticle {
  id: number;
  title: string;
  summary: string;
  team: string;
  category: MarketNewsCategory;
  source: string;
  link: string;
  pub_date: string;
  created_at: string;
}

const SERIE_A_TEAMS = ALL_TEAMS.filter((team) => team.league === 'A');
const TEAM_BY_NAME = new Map(SERIE_A_TEAMS.map((team) => [team.name.toLocaleLowerCase('it-IT'), team]));

const CATEGORY_CONFIG: Record<MarketNewsCategory, { label: string; dot: string; badge: string }> = {
  UFFICIALE_ACQUISTO: {
    label: 'UFFICIALE ACQUISTO',
    dot: 'bg-emerald-400',
    badge: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300',
  },
  UFFICIALE_CESSIONE: {
    label: 'UFFICIALE CESSIONE',
    dot: 'bg-red-400',
    badge: 'border-red-400/40 bg-red-400/15 text-red-300',
  },
  TRATTATIVA: {
    label: 'TRATTATIVA',
    dot: 'bg-orange-400',
    badge: 'border-orange-400/40 bg-orange-400/15 text-orange-300',
  },
  PRESTITO: {
    label: 'PRESTITO',
    dot: 'bg-yellow-300',
    badge: 'border-yellow-300/40 bg-yellow-300/15 text-yellow-200',
  },
  RUMOR: {
    label: 'RUMOR',
    dot: 'bg-slate-100',
    badge: 'border-slate-200/30 bg-white/10 text-slate-100',
  },
};

const CATEGORY_FILTERS: CategoryFilter[] = [
  'TUTTE',
  'UFFICIALE_ACQUISTO',
  'UFFICIALE_CESSIONE',
  'TRATTATIVA',
  'PRESTITO',
  'RUMOR',
];

function isMarketCategory(value: unknown): value is MarketNewsCategory {
  return typeof value === 'string' && value in CATEGORY_CONFIG;
}

function getSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data non disponibile';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function NewsCard({ article }: { article: MarketArticle }) {
  const category = CATEGORY_CONFIG[article.category];
  const team = TEAM_BY_NAME.get(article.team.toLocaleLowerCase('it-IT'));
  const sourceUrl = getSafeUrl(article.link);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-sport-card)]/75 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20">
      <div className={`absolute inset-y-0 left-0 w-1 ${category.dot}`} aria-hidden="true" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pl-1">
        <div className="flex items-center gap-2.5">
          {team ? (
            <TeamLogo
              src={team.logoUrl}
              alt={team.name}
              fallbackText={team.logo}
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Newspaper className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
            </span>
          )}
          <span className="text-xs font-black uppercase tracking-wide text-[var(--color-sport-text)]">
            {team?.name || 'Generale'}
          </span>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${category.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${category.dot}`} aria-hidden="true" />
          {category.label}
        </span>
      </div>

      <h2 className="pl-1 text-lg font-black leading-snug text-[var(--color-sport-text)] sm:text-xl">
        {article.title}
      </h2>
      <p className="mt-2 pl-1 text-sm leading-6 text-[var(--color-sport-muted)]">
        {article.summary}
      </p>

      <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 pl-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-[var(--color-sport-muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {formatPublishedAt(article.pub_date)}
          </span>
          <span>Fonte: {article.source}</span>
        </div>

        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-sport-primary)] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Leggi la notizia completa su {article.source}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function MarketFeed() {
  const [articles, setArticles] = useState<MarketArticle[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('TUTTE');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('TUTTE');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/mercato/live?league=A&limit=300', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const nextArticles = Array.isArray(payload.articles)
        ? payload.articles.filter((article: Partial<MarketArticle>) =>
            Boolean(
              article.id &&
              article.title &&
              article.summary &&
              article.team &&
              article.source &&
              article.link &&
              isMarketCategory(article.category),
            ),
          )
        : [];

      setArticles(nextArticles);
      setLastUpdated(payload.lastUpdated || null);
      setError(null);
    } catch (loadError) {
      console.error('[MarketFeed] Impossibile caricare le notizie:', loadError);
      setError('Aggiornamento non disponibile. Riprova tra poco.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadData(), 0);
    const interval = window.setInterval(() => loadData(true), 5 * 60 * 1000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadData]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<MarketNewsCategory, number>();
    for (const article of articles) {
      counts.set(article.category, (counts.get(article.category) || 0) + 1);
    }
    return counts;
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('it-IT');
    return articles.filter((article) => {
      const matchesTeam = selectedTeam === 'TUTTE' || article.team === selectedTeam;
      const matchesCategory = selectedCategory === 'TUTTE' || article.category === selectedCategory;
      const matchesSearch = !normalizedQuery ||
        `${article.title} ${article.summary} ${article.team} ${article.source}`
          .toLocaleLowerCase('it-IT')
          .includes(normalizedQuery);
      return matchesTeam && matchesCategory && matchesSearch;
    });
  }, [articles, searchQuery, selectedCategory, selectedTeam]);

  const updatedLabel = lastUpdated && !Number.isNaN(new Date(lastUpdated).getTime())
    ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastUpdated))
    : null;

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[var(--color-sport-text)]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Rassegna stampa intelligente
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--color-sport-muted)]">
            Titolo e sintesi sono rielaborati dal feed RSS. La fonte originale resta sempre il riferimento completo.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-[var(--color-sport-muted)] sm:justify-end">
          {updatedLabel ? <span>Aggiornato {updatedLabel}</span> : null}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-white transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Aggiorna
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-sport-muted)]" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cerca squadra, titolo o fonte..."
          aria-label="Cerca nelle notizie di calciomercato"
          className="w-full rounded-full border border-white/10 bg-[var(--color-sport-card)]/70 py-3 pl-11 pr-4 text-sm text-[var(--color-sport-text)] outline-none transition placeholder:text-[var(--color-sport-muted)] focus:border-[var(--color-sport-primary)]/70"
        />
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" aria-label="Filtra per squadra di Serie A">
        <button
          type="button"
          onClick={() => setSelectedTeam('TUTTE')}
          aria-pressed={selectedTeam === 'TUTTE'}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${
            selectedTeam === 'TUTTE'
              ? 'border-[var(--color-sport-primary)] bg-[var(--color-sport-primary)] text-white'
              : 'border-white/10 bg-[var(--color-sport-card)] text-[var(--color-sport-muted)] hover:text-white'
          }`}
        >
          Tutte
        </button>
        {SERIE_A_TEAMS.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => setSelectedTeam(team.name)}
            aria-pressed={selectedTeam === team.name}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
              selectedTeam === team.name
                ? 'border-[var(--color-sport-primary)] bg-[var(--color-sport-primary)]/15 text-white'
                : 'border-white/10 bg-[var(--color-sport-card)] text-[var(--color-sport-muted)] hover:border-white/20 hover:text-white'
            }`}
          >
            <TeamLogo src={team.logoUrl} alt={team.name} fallbackText={team.logo} className="h-5 w-5 rounded-full" />
            {team.name}
          </button>
        ))}
      </nav>

      <nav className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Filtra per categoria di mercato">
        {CATEGORY_FILTERS.map((category) => {
          const config = category === 'TUTTE' ? null : CATEGORY_CONFIG[category];
          const label = config?.label || 'TUTTE';
          const count = category === 'TUTTE' ? articles.length : categoryCounts.get(category) || 0;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black tracking-wide transition ${
                selectedCategory === category
                  ? config?.badge || 'border-white/30 bg-white/10 text-white'
                  : 'border-white/10 bg-white/[0.03] text-[var(--color-sport-muted)] hover:text-white'
              }`}
            >
              {config ? <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" /> : null}
              {label}
              <span className="rounded-full bg-black/20 px-1.5 py-0.5">{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-sport-muted)]">
        <span>{filteredArticles.length} notizie nella rassegna</span>
        {selectedTeam !== 'TUTTE' ? <span className="font-bold text-white">{selectedTeam}</span> : null}
      </div>

      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02]">
          <LoaderCircle className="h-8 w-8 animate-spin text-[var(--color-sport-primary)]" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-sport-muted)]">Caricamento rassegna</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-center text-sm text-red-200">{error}</div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid gap-4">
          {filteredArticles.map((article) => <NewsCard key={article.id} article={article} />)}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <Newspaper className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="font-bold text-[var(--color-sport-text)]">Nessuna notizia per questi filtri</p>
          <p className="max-w-md text-xs leading-5 text-[var(--color-sport-muted)]">
            La rassegna si popola automaticamente dai feed RSS verificati. Prova a selezionare tutte le squadre o tutte le categorie.
          </p>
        </div>
      )}
    </div>
  );
}
