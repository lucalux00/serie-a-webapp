import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchGoogleNews(query: string, limit: number = 5) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    
    const xml = await res.text();
    const result = await parseStringPromise(xml);
    
    const items = result?.rss?.channel?.[0]?.item || [];
    return items.slice(0, limit).map((item: any, index: number) => {
      const pubDate = item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date();
      // Format as "Oggi", "Ieri", or "X giorni fa"
      const diffTime = Math.abs(new Date().getTime() - pubDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      let dateLabel = diffDays === 1 ? 'Oggi' : diffDays === 2 ? 'Ieri' : `${diffDays - 1} giorni fa`;

      let title = item.title?.[0] || '';
      // Remove the source from the title (usually after " - ")
      title = title.split(' - ')[0];

      return {
        id: Date.now() + index,
        title: title,
        date: dateLabel,
        link: item.link?.[0] || '#'
      };
    });
  } catch (e) {
    console.error("Error fetching Google News:", e);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  
  if (!team) {
    return NextResponse.json({ error: 'Team query parameter is required' }, { status: 400 });
  }

  // Costruiamo le query per Google News
  // Vogliamo trovare notizie ufficiali per Acquisti e Cessioni, e rumors per le Trattative
  const acquistiQuery = `"ufficiale" (acquisto OR arriva OR firma) ${team} calciomercato`;
  const cessioniQuery = `"ufficiale" (cessione OR addio OR venduto) ${team} calciomercato`;
  const trattativeQuery = `(trattativa OR interesse OR vicino) ${team} calciomercato`;

  const [acquistiNews, cessioniNews, trattativeNews] = await Promise.all([
    fetchGoogleNews(acquistiQuery, 10),
    fetchGoogleNews(cessioniQuery, 10),
    fetchGoogleNews(trattativeQuery, 10)
  ]);

  // Formattiamo i dati nel formato atteso dalla UI (TransferCard)
  // Per non dover cambiare troppo la UI, passiamo il "title" dentro "player" o usiamo un formato semplificato.
  
  const mapToTransfer = (newsList: any[], type: string, status: string) => {
    return newsList.map(news => ({
      id: news.id,
      type: type,
      status: status,
      player: news.title, // Mettiamo il titolo intero qui, la UI mostrerà il titolo!
      otherTeam: 'Vedi fonte',
      fee: 'Dettagli',
      date: news.date,
      link: news.link
    }));
  };

  const acquisti = mapToTransfer(acquistiNews, 'acquisto', 'Ufficiale');
  const cessioni = mapToTransfer(cessioniNews, 'cessione', 'Ufficiale');
  const trattative = mapToTransfer(trattativeNews, 'trattativa', 'Rumor');

  return NextResponse.json({
    transfers: [...acquisti, ...cessioni, ...trattative]
  });
}
