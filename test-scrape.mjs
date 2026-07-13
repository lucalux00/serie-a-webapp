import * as cheerio from 'cheerio';
async function test() {
  const res = await fetch('https://it.wikipedia.org/wiki/Societ%C3%A0_Sportiva_Calcio_Napoli');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  let found = false;
  $('table.wikitable').each((i, table) => {
    const text = $(table).text().toLowerCase();
    if (text.includes('ruolo') && (text.includes('giocatore') || text.includes('calciatore'))) {
      console.log(`Tabella ${i} trovata!`);
      const rows = $(table).find('tr');
      console.log(`Numero di righe: ${rows.length}`);
      
      const firstRowCols = $(rows[1]).find('td, th');
      console.log("Prima riga data: " + $(firstRowCols).text().replace(/\n/g, ' '));
      found = true;
      return false;
    }
  });
  if (!found) console.log("Nessuna tabella trovata.");
}
test();
