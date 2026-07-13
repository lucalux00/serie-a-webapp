import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

// Importiamo l'array delle squadre. Essendo in ES module, facciamo un workaround per leggere il file JS, 
// o meglio ricostruiamo l'array base qui per praticità nello script node.
const TEAMS = [
  'Atalanta', 'Bologna', 'Cagliari', 'Como', 'Fiorentina', 'Frosinone', 'Genoa', 'Inter', 'Juventus', 'Lazio',
  'Lecce', 'Milan', 'Monza', 'Napoli', 'Parma', 'Roma', 'Sassuolo', 'Torino', 'Udinese', 'Venezia',
  'Bari', 'Brescia', 'Catanzaro', 'Cesena', 'Cittadella', 'Cosenza', 'Cremonese', 'Empoli', 'Juve Stabia', 'Mantova',
  'Modena', 'Palermo', 'Pisa', 'Reggiana', 'Salernitana', 'Sampdoria', 'Spezia', 'Sudtirol', 'Verona', 'Carrarese'
];

const parser = new Parser();
const outputFilePath = path.join(process.cwd(), 'src', 'data', 'realNews.json');

async function fetchNewsForTeam(teamName) {
  // RSS Feed pubblico di Google News (Aggregatore)
  // Questo rispetta il copyright in quanto restituisce solo Titolo, Link e frammento.
  const query = encodeURIComponent(`${teamName} calcio`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=it&gl=IT&ceid=IT:it`;
  
  try {
    const feed = await parser.parseURL(url);
    // Prendiamo solo gli ultimi 10 articoli
    const articles = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source || 'Google News',
      // Estraiamo la testata dal titolo se presente " - Nome Testata"
      cleanTitle: item.title?.split(' - ')[0] || item.title
    }));
    return articles;
  } catch (error) {
    console.error(`Errore fetch per ${teamName}:`, error.message);
    return [];
  }
}

async function run() {
  console.log('Inizio estrazione News RSS per 40 squadre...');
  const allNews = {};
  
  for (const team of TEAMS) {
    console.log(`- Fetching ${team}...`);
    const articles = await fetchNewsForTeam(team);
    // Salviamo usando l'ID normalizzato (lowercase, no spazi)
    const id = team.toLowerCase().replace(/\s+/g, '');
    allNews[id] = articles;
    // Pausa di 500ms per non sovraccaricare Google
    await new Promise(res => setTimeout(res, 500));
  }
  
  fs.writeFileSync(outputFilePath, JSON.stringify(allNews, null, 2), 'utf-8');
  console.log('Script completato. Dati salvati in src/data/realNews.json');
}

run();
