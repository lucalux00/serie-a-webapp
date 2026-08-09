import Parser from 'rss-parser';
import { ALL_TEAMS } from '@/data/teams';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  cleanTitle: string;
  time: string;
  snippet?: string;
  relatedSources?: string[]; // Per il sistema anti-duplicati
}

export const MARKET_NEWS_CATEGORIES = [
  'UFFICIALE_ACQUISTO',
  'UFFICIALE_CESSIONE',
  'TRATTATIVA',
  'RUMOR',
  'PRESTITO',
] as const;

export type MarketNewsCategory = (typeof MARKET_NEWS_CATEGORIES)[number];

export interface MarketNewsMetadata {
  title: string;
  summary: string;
  team: string;
  category: MarketNewsCategory;
}

const parser = new Parser({
  timeout: 8000,
  customFields: {
    item: [
      ['source', 'rssSource'],
      ['description', 'rssDescription'],
    ],
  },
});

const DIRECT_RSS_SOURCES: Record<string, string[]> = {
  // Feed RSS aperti sui principali portali di calcio italiano
  base: [
    'https://www.gianlucadimarzio.com/rss/?section=2',
    'https://www.tuttomercatoweb.com/rss/',
    'https://www.gazzetta.it/dynamic-feed/rss/section/Calciomercato.xml',
    'https://www.corrieredellosport.it/rss/calcio',
    'https://sport.sky.it/rss/sport_calcio.xml',
    'https://www.tuttosport.com/rss/calcio',
    'https://www.alfredopedulla.com/feed/',
  ]
};

// Multiple topic feeds improve coverage without sending any content to Gemini.
const GOOGLE_NEWS_QUERIES = [
  'serie a calcio',
  'calciomercato',
  'champions league calcio italiano',
  'nazionale italiana calcio',
];

// Derivata dalle squadre mostrate dal sito, così non serve aggiornare una
// seconda lista. Le query RSS non inviano contenuti a Gemini.
const SERIE_A_TEAM_QUERIES = ALL_TEAMS
  .filter((team) => team.league === 'A')
  .map((team) => `"${team.name}" calcio`);

const SERIE_A_MARKET_QUERIES = ALL_TEAMS
  .filter((team) => team.league === 'A')
  .map((team) => `"${team.name}" calciomercato`);

const MARKET_SIGNAL_PATTERN = /\b(calciomercato|mercato|acquist[oi]|cession[ei]|cedut[oa]|prestito|trattativ[ae]|rumor|indiscrezion[ei]|offerta|firma|accordo|interess[ea]|obiettivo|vicin[oa]|scambio)\b/i;

function getGoogleNewsUrl(query: string, limit = 30) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it&num=${limit}`;
}

// Sfruttiamo la Vercel Data Cache (sostituto di Redis) tramite il parametro next: { revalidate }
async function fetchFeed(url: string): Promise<Parser.Item[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const feed = await parser.parseString(xml);
    return feed.items || [];
  } catch {
    return [];
  }
}

// Filtra per nome squadra negli articoli
function filterByTeam(items: Parser.Item[], teamName: string): Parser.Item[] {
  const lowerTeam = teamName.toLowerCase();
  const words = lowerTeam.split(' ').filter(w => w.length > 2);
  return items.filter(item => {
    const rssDescription = (item as Parser.Item & { rssDescription?: string }).rssDescription || '';
    const text = ((item.title || '') + ' ' + (item.contentSnippet || '') + ' ' + rssDescription).toLowerCase();
    return words.some(w => text.includes(w));
  });
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&agrave;': 'à',
    '&egrave;': 'è',
    '&eacute;': 'é',
    '&igrave;': 'ì',
    '&ograve;': 'ò',
    '&ugrave;': 'ù',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&laquo;': '«',
    '&raquo;': '»',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&euro;': '€',
  };
  return text.replace(/&[a-z0-9#]+;/gi, match => entities[match.toLowerCase()] || match);
}

function itemToNewsItem(item: Parser.Item): NewsItem {
  const dateStr = item.isoDate || item.pubDate || new Date().toISOString();
  const date = new Date(dateStr);
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  
  // Estrai uno snippet pulito e decodifica entità
  const rssDescription = (item as Parser.Item & { rssDescription?: string }).rssDescription || '';
  const rawSnippet = item.contentSnippet || rssDescription;
  const snippet = decodeHTMLEntities(rawSnippet.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 400));

  // Pulisci titolo e decodifica entità
  const rawTitle = decodeHTMLEntities(item.title || '');
  const cleanTitle = rawTitle.split(' - ')[0].split(' | ')[0].trim();

  // Google News include il nome dell'editore nel tag <source>: usiamolo per
  // attribuire correttamente l'articolo, anziché mostrare soltanto "news".
  const rssSource = (item as Parser.Item & { rssSource?: unknown }).rssSource;
  const sourceFromFeed = typeof rssSource === 'string'
    ? decodeHTMLEntities(rssSource.replace(/<[^>]*>/g, '').trim())
    : rssSource && typeof rssSource === 'object' && '#' in rssSource
      ? decodeHTMLEntities(String((rssSource as { '#': unknown })['#']).trim())
      : '';

  // Ricava la fonte dal link quando il feed non fornisce l'editore
  let source = 'News';
  try {
    source = new URL(item.link || '').hostname.replace('www.', '').split('.')[0];
    // Normalizza i nomi noti
    const sourceMap: Record<string, string> = {
      'gianlucadimarzio': 'Di Marzio',
      'tuttomercatoweb': 'TMW',
      'calciomercato': 'CM.com',
      'corrieredellosport': 'CdS',
      'gazzetta': 'Gazzetta',
      'skysport': 'Sky Sport',
      'sport': 'Sky Sport',
    };
    for (const [k, v] of Object.entries(sourceMap)) {
      if (source.toLowerCase().includes(k)) { source = v; break; }
    }
  } catch { /* usa 'News' */ }
  if (sourceFromFeed) source = sourceFromFeed;

  return {
    title: rawTitle,
    link: item.link || '',
    pubDate: dateStr,
    source,
    cleanTitle,
    time,
    snippet,
    relatedSources: [],
  };
}

export function isMarketNewsCandidate(item: Pick<NewsItem, 'title' | 'snippet'>): boolean {
  return MARKET_SIGNAL_PATTERN.test(`${item.title} ${item.snippet || ''}`);
}

export function normalizeMarketNewsMetadata(
  value: unknown,
  fallbackSummary = '',
): MarketNewsMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.title !== 'string' ||
    typeof candidate.summary !== 'string' ||
    typeof candidate.team !== 'string' ||
    typeof candidate.category !== 'string' ||
    !MARKET_NEWS_CATEGORIES.includes(candidate.category as MarketNewsCategory)
  ) {
    return null;
  }

  const title = candidate.title.replace(/\s+/g, ' ').trim().slice(0, 180);
  const summarySentences = candidate.summary
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .slice(0, 2)
    .join(' ');
  const summaryWords = summarySentences.split(/\s+/).filter(Boolean);
  if (!title || summaryWords.length < 5) return null;

  let summary: string;
  if (summaryWords.length >= 30) {
    summary = summaryWords.slice(0, 40).join(' ').trim();
  } else {
    // Con il limite hard di 100 token Gemini può chiudere correttamente il
    // JSON accorciando la sintesi. La completiamo senza una seconda chiamata
    // IA, usando soltanto lo snippet RSS già autorizzato come input.
    const fallbackWords = fallbackSummary
      .replace(/<[^>]*>/g, ' ')
      .replace(/[.!?]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const neutralWords = 'La fonte originale resta disponibile per verificare tutti i dettagli il contesto le dichiarazioni e gli eventuali aggiornamenti successivi relativi alla vicenda di mercato descritta'.split(' ');
    const completedWords = [
      ...summaryWords.map((word) => word.replace(/[.!?]+$/g, '')),
      ...fallbackWords,
      ...neutralWords,
    ].slice(0, 30);
    summary = `${completedWords.join(' ').replace(/[.!?]+/g, ',')}.`;
  }

  const requestedTeam = candidate.team.trim();
  const knownTeam = ALL_TEAMS.find((team) =>
    team.league === 'A' && (
      team.name.toLocaleLowerCase('it-IT') === requestedTeam.toLocaleLowerCase('it-IT') ||
      team.id.toLocaleLowerCase('it-IT') === requestedTeam.toLocaleLowerCase('it-IT')
    )
  );

  return {
    title,
    summary,
    team: knownTeam?.name || 'Generale',
    category: candidate.category as MarketNewsCategory,
  };
}

// Algoritmo Anti-Duplicati (Jaccard Similarity)
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().match(/\w+/g) || []);
  const set2 = new Set(str2.toLowerCase().match(/\w+/g) || []);
  if (set1.size === 0 || set2.size === 0) return 0;
  let intersectionSize = 0;
  for (const word of set1) {
    if (set2.has(word)) intersectionSize++;
  }
  const unionSize = set1.size + set2.size - intersectionSize;
  return intersectionSize / unionSize;
}

function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const deduped: NewsItem[] = [];
  
  for (const item of items) {
    let isDuplicate = false;
    for (const existing of deduped) {
      // Se la similarità tra i titoli è alta (> 0.55), la consideriamo la stessa notizia
      if (calculateSimilarity(item.cleanTitle, existing.cleanTitle) > 0.78) {
        isDuplicate = true;
        // Aggiungiamo la fonte ai correlati se non è già presente
        if (item.source !== existing.source && !existing.relatedSources?.includes(item.source)) {
          existing.relatedSources = existing.relatedSources || [];
          existing.relatedSources.push(item.source);
        }
        break;
      }
    }
    if (!isDuplicate) {
      deduped.push(item);
    }
  }
  return deduped;
}

export async function fetchNewsForTeam(teamName: string, league: string = 'A'): Promise<NewsItem[]> {
  // Strategia 1: Google News RSS (più aggiornato)
  const isItalian = league === 'A' || league === 'B' || league === 'C';
  const searchTerm = isItalian ? `"${teamName}" calcio` : `"${teamName}"`;
  const googleQuery = encodeURIComponent(searchTerm);
  const googleUrl = `https://news.google.com/rss/search?q=${googleQuery}&hl=it&gl=IT&ceid=IT:it&num=20`;
  
  // Strategia 2: Fonti dirette con filtro per squadra
  const directSources = DIRECT_RSS_SOURCES.base;

  const [googleItems, ...directResults] = await Promise.all([
    fetchFeed(googleUrl),
    ...directSources.map(url => fetchFeed(url)),
  ]);

  // Unisci i risultati delle fonti dirette e filtra per squadra
  const directItems = directResults.flat();
  const filteredDirect = filterByTeam(directItems, teamName);

  // Unisci Google News + fonti dirette
  const allItems = [
    ...googleItems.map(itemToNewsItem),
    ...filteredDirect.map(itemToNewsItem),
  ];

  // Ordina per data decrescente PRIMA della deduplicazione (per mantenere la più recente come principale)
  const sorted = allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Deduplica usando l'algoritmo avanzato
  const deduped = deduplicateNews(sorted);

  return deduped.filter(item => item.title && item.link).slice(0, 20);
}

export async function fetchGlobalNewsTicker(): Promise<NewsItem[]> {
  try {
    const results = await Promise.all(GOOGLE_NEWS_QUERIES.map((query) => fetchFeed(getGoogleNewsUrl(query, 20))));
    const parsedItems = results.flat().map(itemToNewsItem);
    const sorted = parsedItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const deduped = deduplicateNews(sorted);
    
    return deduped.filter(item => item.title && item.link).slice(0, 20);
  } catch {
    return [];
  }
}

export async function fetchAllNewsForCron(): Promise<NewsItem[]> {
  try {
    const feeds = [
      ...GOOGLE_NEWS_QUERIES.map((query) => ({ label: `Google News: ${query}`, url: getGoogleNewsUrl(query) })),
      ...SERIE_A_TEAM_QUERIES.map((query) => ({ label: `Google News squadra: ${query}`, url: getGoogleNewsUrl(query, 20) })),
      ...SERIE_A_MARKET_QUERIES.map((query) => ({ label: `Google News mercato: ${query}`, url: getGoogleNewsUrl(query, 20) })),
      ...DIRECT_RSS_SOURCES.base.map((url) => ({ label: new URL(url).hostname, url })),
    ];
    const results = await Promise.all(feeds.map(async (feed) => ({ ...feed, items: await fetchFeed(feed.url) })));
    console.log('[news] RSS items by source:', results.map(({ label, items }) => `${label}=${items.length}`).join(' | '));

    const allItems = results.flatMap(({ items }) => items.map(itemToNewsItem));

    const sorted = allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const deduped = deduplicateNews(sorted);
    
    return deduped.filter(item => item.title && item.link).slice(0, 200);
  } catch (error) {
    console.error('Error fetching cron news:', error);
    return [];
  }
}
