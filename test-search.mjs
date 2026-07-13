import * as cheerio from 'cheerio';
import fs from 'fs';

async function testStaff() {
  const team = "Napoli";
  const searchUrl = `https://it.wikipedia.org/wiki/Società_Sportiva_Calcio_Napoli`;
  console.log("Cercando:", searchUrl);
  
  const res = await fetch(searchUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // Trova h3 con "Staff tecnico"
  $('h3, h4').each((i, el) => {
    if ($(el).text().toLowerCase().includes('staff tecnico')) {
      console.log($(el).parent().html().substring(0, 500));
    }
  });
}

testStaff();
