const { sql } = require('@vercel/postgres');
const Parser = require('rss-parser');

const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TatticaPronosticiRSS/1.0)' } });
const FEEDS = [
  'https://news.google.com/rss/search?q=calciomercato+serie+a+ufficiale&hl=it&gl=IT&ceid=IT:it',
  'https://news.google.com/rss/search?q=calciomercato+serie+a+trattativa&hl=it&gl=IT&ceid=IT:it',
];
const TEAMS = ['atalanta', 'bologna', 'cagliari', 'como', 'fiorentina', 'genoa', 'inter', 'juventus', 'lazio', 'lecce', 'milan', 'napoli', 'parma', 'pisa', 'roma', 'sassuolo', 'torino', 'udinese', 'verona'];

function inferTransfer(title) {
  const text = title.toLowerCase();
  const team = TEAMS.find((name) => text.includes(name));
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
  let inserted = 0;
  for (const feedUrl of FEEDS) {
    const feed = await parser.parseURL(feedUrl);
    for (const item of feed.items.slice(0, 25)) {
      const title = String(item.title || '').trim();
      const transfer = inferTransfer(title);
      if (!transfer) continue;
      const exists = await sql`SELECT id FROM transfers WHERE player = ${title} AND team_id = ${transfer.team} LIMIT 1`;
      if (exists.rows.length) continue;
      const date = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' });
      await sql`
        INSERT INTO transfers (team_id, type, player, other_team, fee, date, status)
        VALUES (${transfer.team}, ${transfer.type}, ${title}, ${item.link || 'Fonte RSS'}, 'N/D', ${date}, ${transfer.status})
      `;
      inserted++;
    }
  }
  console.log(`RSS mercato completato: ${inserted} nuove voci.`);
}

syncTransfers().catch((error) => { console.error(error); process.exit(1); });
