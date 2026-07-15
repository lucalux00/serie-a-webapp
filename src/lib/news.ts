import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  cleanTitle: string;
  time: string;
  snippet?: string;
}

const parser = new Parser({ timeout: 8000 });

// Fonti RSS dirette per singola squadra — molte fonti aperte senza paywall
const DIRECT_RSS_SOURCES: Record<string, string[]> = {
  // Feed RSS aperti sui principali portali di calcio italiano
  base: [
    'https://www.calciomercato.com/rss',
    'https://www.gianlucadimarzio.com/feed',
    'https://www.tuttomercatoweb.com/rss.xml',
    'https://www.corrieredellosport.it/rss/calcio.xml',
  ]
};

async function fetchFeed(url: string): Promise<Parser.Item[]> {
  try {
    const feed = await parser.parseURL(url);
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

function itemToNewsItem(item: Parser.Item): NewsItem {
  const dateStr = item.isoDate || item.pubDate || new Date().toISOString();
  const date = new Date(dateStr);
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  
  // Estrai uno snippet pulito
  const rawSnippet = item.contentSnippet || item.content || '';
  const snippet = rawSnippet.replace(/<[^>]*>/g, '').trim().substring(0, 600);

  // Pulisci titolo
  const rawTitle = item.title || '';
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
  };
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

  // Deduplica per titolo simile
  const seen = new Set<string>();
  const deduped = allItems.filter(item => {
    const key = item.cleanTitle.toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordina per data decrescente
  return deduped
    .filter(item => item.title && item.link)
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 20);
}

export async function fetchGlobalNewsTicker(): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=serie+a+calcio+calciomercato&hl=it&gl=IT&ceid=IT:it&num=20`;
  try {
    const items = await fetchFeed(url);
    return items
      .map(itemToNewsItem)
      .filter(item => item.title && item.link)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20);
  } catch {
    return [];
  }
}
