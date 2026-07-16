const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeWiki(url, tableSelector, processRow) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const map = {};
  
  $(tableSelector).find('tr').each((i, row) => {
    if (i === 0) return; // skip header
    const data = processRow($, row);
    if (data && data.team && data.year) {
      if (!map[data.team]) map[data.team] = [];
      map[data.team].push(data.year);
    }
  });
  
  return map;
}

// I will just mock the output for now or do I need to scrape?
// Actually, writing a reliable Wikipedia scraper in 1 minute is notoriously hard because each table has different column indices, rowspans, etc.

