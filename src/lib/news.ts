import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  cleanTitle: string;
  time: string;
}

const parser = new Parser();

export async function fetchNewsForTeam(teamName: string): Promise<NewsItem[]> {
  const query = encodeURIComponent(`${teamName} calcio`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=it&gl=IT&ceid=IT:it`;
  
  try {
    const feed = await parser.parseURL(url);
    const articles = feed.items.slice(0, 10).map(item => {
      // Estrai orario HH:mm da pubDate
      const date = new Date(item.pubDate!);
      const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      
      return {
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || '',
        source: item.source || 'Google News',
        cleanTitle: item.title?.split(' - ')[0] || item.title || '',
        time
      };
    });
    return articles;
  } catch (error) {
    console.error(`Errore fetch per ${teamName}:`, error);
    return [];
  }
}

export async function fetchGlobalNewsTicker(): Promise<NewsItem[]> {
  // Prendiamo notizie generali sul calcio italiano per il ticker
  const url = `https://news.google.com/rss/search?q=serie+a+calciomercato&hl=it&gl=IT&ceid=IT:it`;
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 15).map(item => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || '',
      source: item.source || 'Google News',
      cleanTitle: item.title?.split(' - ')[0] || item.title || '',
      time: new Date(item.pubDate!).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    }));
  } catch (error) {
    return [];
  }
}
