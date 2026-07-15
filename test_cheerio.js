const cheerio = require('cheerio');

async function scrapeTeam(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const players = [];
    
    // Iterate over all vcard rows
    $('tr.vcard').each((j, row) => {
      let no = $(row).find('td').eq(0).text().trim();
      let posAbbr = $(row).find('td').eq(1).find('abbr').text().trim() || $(row).find('td').eq(1).text().trim();
      
      let name = $(row).find('.fn').text().trim();
      if (!name) name = $(row).find('td').eq(3).text().trim();
      name = name.replace(/\([^)]+\)/g, '').trim();
      
      // Basic validation to see if it's a player row (has a valid position like GK, DF, MF, FW)
      if (name && posAbbr && /^(GK|DF|MF|FW|FWD|MID|DEF)$/i.test(posAbbr)) {
        players.push({ no, pos: posAbbr, name });
      }
    });
    
    console.log(`Found ${players.length} players for ${url}`);
    console.log(players.slice(0, 5));
    
  } catch (e) {
    console.error(e);
  }
}

scrapeTeam('https://en.wikipedia.org/wiki/Arsenal_F.C.');
scrapeTeam('https://en.wikipedia.org/wiki/Real_Madrid_CF');
