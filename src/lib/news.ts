import Parser from 'rss-parser';

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

const parser = new Parser({ timeout: 8000 });

const DIRECT_RSS_SOURCES: Record<string, string[]> = {
  // Feed RSS aperti sui principali portali di calcio italiano
  base: [
    'https://www.calciomercato.com/rss',
    'https://www.gianlucadimarzio.com/feed',
    'https://www.tuttomercatoweb.com/rss.xml',
    'https://www.corrieredellosport.it/rss/calcio',
    'https://sport.sky.it/rss/sport_calcio.xml',
    'https://www.sportmediaset.mediaset.it/rss/calcio.xml',
    'https://www.tuttosport.com/rss/calcio',
    'https://www.alfredopedulla.com/feed/',
  ]
};

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
    const text = ((item.title || '') + ' ' + (item.contentSnippet || '') + ' ' + (item.content || '')).toLowerCase();
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
  const rawSnippet = item.contentSnippet || item.content || '';
  const snippet = decodeHTMLEntities(rawSnippet.replace(/<[^>]*>/g, '').trim().substring(0, 600));

  // Pulisci titolo e decodifica entità
  const rawTitle = decodeHTMLEntities(item.title || '');
  const cleanTitle = rawTitle.split(' - ')[0].split(' | ')[0].trim();

  // Ricava la fonte dal link
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
      if (calculateSimilarity(item.cleanTitle, existing.cleanTitle) > 0.55) {
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
  const url = `https://news.google.com/rss/search?q=serie+a+calcio+calciomercato&hl=it&gl=IT&ceid=IT:it&num=20`;
  try {
    const items = await fetchFeed(url);
    const parsedItems = items.map(itemToNewsItem);
    const sorted = parsedItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const deduped = deduplicateNews(sorted);
    
    return deduped.filter(item => item.title && item.link).slice(0, 20);
  } catch {
    return [];
  }
}

export async function fetchAllNewsForCron(): Promise<NewsItem[]> {
  const googleUrl = `https://news.google.com/rss/search?q=serie+a+calcio+calciomercato&hl=it&gl=IT&ceid=IT:it&num=30`;
  
  try {
    const [googleItems, ...directResults] = await Promise.all([
      fetchFeed(googleUrl),
      ...DIRECT_RSS_SOURCES.base.map(url => fetchFeed(url)),
    ]);

    const allItems = [
      ...googleItems.map(itemToNewsItem),
      ...directResults.flat().map(itemToNewsItem),
    ];

    const sorted = allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const deduped = deduplicateNews(sorted);
    
    return deduped.filter(item => item.title && item.link).slice(0, 50);
  } catch (error) {
    console.error('Error fetching cron news:', error);
    return [];
  }
}
