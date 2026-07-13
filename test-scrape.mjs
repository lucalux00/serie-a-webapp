import * as cheerio from 'cheerio';
async function test() {
  const res = await fetch('https://it.wikipedia.org/wiki/Atalanta_Bergamasca_Calcio');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  let found = false;
  $('table.wikitable').each((i, table) => {
    const text = $(table).text().toLowerCase();
    if (text.includes('ruolo') && (text.includes('giocatore') || text.includes('calciatore'))) {
      console.log(`Tabella ${i} trovata!`);
      const rows = $(table).find('tr');
      console.log(`Numero di righe: ${rows.length}`);
      
      if (rows.length > 5) {
        $(table).find('tr').each((i, row) => {
          const cols = $(row).find('td, th');
          if (cols.length >= 3 && i === 1) {
            console.log("C0: " + $(cols[0]).text().trim());
            console.log("C1: " + $(cols[1]).text().trim());
            console.log("C2: " + $(cols[2]).text().trim());
            console.log("C3: " + $(cols[3]).text().trim());
          }
        });
      }
    }
  });
}
test();
