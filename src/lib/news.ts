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

const parser = new Parser();

export async function fetchNewsForTeam(teamName: string): Promise<NewsItem[]> {
  // Aggiungiamo fonti affidabili e senza paywall stringenti
  const query = encodeURIComponent(`${teamName} calcio (site:tuttomercatoweb.com OR site:gianlucadimarzio.com OR site:corrieredellosport.it)`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=it&gl=IT&ceid=IT:it&_t=${Date.now()}`;
  
  try {
    const feed = await parser.parseURL(url);
    const articles = feed.items.slice(0, 15).map(item => {
      // Estrai orario e usa isoDate per un parsing più sicuro
      const dateStr = item.isoDate || item.pubDate || new Date().toISOString();
      const date = new Date(dateStr);
      const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      
      return {
        title: item.title || '',
        link: item.link || '',
        pubDate: dateStr,
        source: item.source || 'News',
        cleanTitle: item.title?.split(' - ')[0] || item.title || '',
        time,
        snippet: item.contentSnippet || item.content || 'Nessuna anteprima disponibile.'
      };
    });
    
    // Sort server-side as well just to be sure
    return articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  } catch (error) {
    console.error(`Errore fetch per ${teamName}:`, error);
    return [];
  }
}

export async function fetchGlobalNewsTicker(): Promise<NewsItem[]> {
  // Prendiamo notizie generali sul calcio italiano per il ticker
  const url = `https://news.google.com/rss/search?q=serie+a+calciomercato+(site:tuttomercatoweb.com OR site:gianlucadimarzio.com OR site:corrieredellosport.it)&hl=it&gl=IT&ceid=IT:it`;
  try {
    const feed = await parser.parseURL(url);
    const articles = feed.items.slice(0, 15).map(item => {
      const dateStr = item.isoDate || item.pubDate || new Date().toISOString();
      return {
        title: item.title || '',
        link: item.link || '',
        pubDate: dateStr,
        source: item.source || 'News',
        cleanTitle: item.title?.split(' - ')[0] || item.title || '',
        time: new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        snippet: item.contentSnippet || item.content || ''
      };
    });
    return articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  } catch (error) {
    return [];
  }
}
