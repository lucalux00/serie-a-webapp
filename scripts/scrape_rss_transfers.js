const { sql } = require('@vercel/postgres');
const Parser = require('rss-parser');

const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TatticaPronosticiRSS/1.0)' } });
const FEEDS = [
  'https://news.google.com/rss/search?q=calciomercato+serie+a+ufficiale&hl=it&gl=IT&ceid=IT:it',
  'https://news.google.com/rss/search?q=calciomercato+serie+a+trattativa&hl=it&gl=IT&ceid=IT:it',
  'https://news.google.com/rss/search?q=calciomercato+serie+a+rumor&hl=it&gl=IT&ceid=IT:it',
  'https://news.google.com/rss/search?q=serie+a+mercato+interesse+vicino+accordo&hl=it&gl=IT&ceid=IT:it',
  'https://news.google.com/rss/search?q=serie+a+calciomercato+esclusiva+indiscrezione&hl=it&gl=IT&ceid=IT:it',
];
const TEAMS = {
  atalanta: ['atalanta'], bologna: ['bologna'], cagliari: ['cagliari'], como: ['como'], fiorentina: ['fiorentina'], genoa: ['genoa'],
  inter: ['inter'], juventus: ['juventus', 'juve'], lazio: ['lazio'], lecce: ['lecce'], milan: ['milan'], napoli: ['napoli'],
  parma: ['parma'], pisa: ['pisa'], roma: ['roma'], sassuolo: ['sassuolo'], torino: ['torino'], udinese: ['udinese'], verona: ['verona', 'hellas'],
};

function inferTransfer(title) {
  const text = title.toLowerCase();
  const team = Object.entries(TEAMS).find(([, aliases]) => aliases.some((name) => text.includes(name)))?.[0];
  if (!team) return null;
  const isLoan = /prestito/.test(text);
  const isOfficial = /ufficiale|firma|annuncia|acquistato|ceduto/.test(text);
  const isOutgoing = /cessione|ceduto|addio|saluta/.test(text);
  return {
    team,
    type: isLoan ? 'Prestito' : isOutgoing ? 'Cessione' : 'Acquisto',
    status: isOfficial ? 'Ufficiale' : 'Rumor',
  };
}

async function syncTransfers() {
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL non impostato');
  await sql`ALTER TABLE transfers ADD COLUMN IF NOT EXISTS source_url TEXT`;
  await sql`ALTER TABLE transfers ADD COLUMN IF NOT EXISTS source_name VARCHAR(120)`;
  let inserted = 0;
  for (const feedUrl of FEEDS) {
    let feed;
    try {
      feed = await parser.parseURL(feedUrl);
    } catch (error) {
      console.warn(`Feed RSS non disponibile, continuo con gli altri: ${feedUrl}`, error.message);
      continue;
    }
    for (const item of feed.items.slice(0, 35)) {
      const title = String(item.title || '').trim().slice(0, 100);
      const transfer = inferTransfer(title);
      if (!transfer) continue;
      const existing = await sql`SELECT id FROM transfers WHERE player = ${title} AND team_id = ${transfer.team} LIMIT 1`;
      const date = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' });
      const sourceName = String(item.creator || item['dc:creator'] || 'Google News').slice(0, 100);
      if (existing.rows.length) {
        await sql`UPDATE transfers SET date = ${date}, source_url = ${item.link || null}, source_name = ${sourceName} WHERE id = ${existing.rows[0].id}`;
        continue;
      }
      await sql`
        INSERT INTO transfers (team_id, league, type, player, other_team, fee, date, status, source_url, source_name)
        VALUES (${transfer.team}, 'A', ${transfer.type}, ${title}, 'Da verificare', 'N/D', ${date}, ${transfer.status}, ${item.link || null}, ${sourceName})
      `;
      inserted++;
    }
  }
  console.log(`RSS mercato completato: ${inserted} nuove voci.`);
}

syncTransfers().catch((error) => { console.error(error); process.exit(1); });
