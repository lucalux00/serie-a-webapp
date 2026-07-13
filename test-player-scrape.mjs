import * as cheerio from 'cheerio';

async function testPlayer() {
  const name = "Amir Rrahmani";
  const searchUrl = `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`;
  console.log("Cercando:", searchUrl);
  
  const res = await fetch(searchUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // Trova il box informazioni
  const infobox = $('.sinottico');
  let presenze = "N/A";
  let reti = "N/A";
  let biografia = "";
  let caratteristiche = "";

  let clubStats = "";
  if (infobox.length > 0) {
    console.log("Infobox trovato!");
    // Wikipedia ITA di solito ha una riga th con "Presenze e reti nei club" e poi righe td
    infobox.find('tr').each((i, tr) => {
      if ($(tr).text().includes('Presenze e reti nei club')) {
        clubStats = "Trovato header presenze";
      }
    });
  }

  // Prendi il primo paragrafo testuale dopo il sinottico
  const firstP = $('#mw-content-text .mw-parser-output > p').not('.mw-empty-elt').first().text().trim();
  
  // Cerca le sezioni Biografia e Caratteristiche
  $('h2').each((i, el) => {
    const heading = $(el).text().toLowerCase();
    if (heading.includes('biografia')) {
      biografia = $(el).nextUntil('h2').text().trim().substring(0, 500) + '...';
    }
    if (heading.includes('caratteristiche')) {
      caratteristiche = $(el).nextUntil('h2').text().trim().substring(0, 500) + '...';
    }
  });

  console.log("Biografia:", biografia ? "Trovata" : "Non trovata");
  console.log("Caratteristiche:", caratteristiche ? "Trovate" : "Non trovate");
  console.log(biografia);
  console.log(caratteristiche);
}

testPlayer();
