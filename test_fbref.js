const https = require('https');
const cheerio = require('cheerio'); // Might not be installed, we will use regex or install it

async function scrapeFBRef(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    
    // In FBRef, the roster table is usually under id="roster"
    const rosterRegex = /<table[^>]*id="roster"[^>]*>([\s\S]*?)<\/table>/i;
    const match = html.match(rosterRegex);
    
    if (!match) {
      console.log('Roster table not found');
      return;
    }
    
    const tableHtml = match[1];
    
    // Extract rows
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    const players = [];
    
    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
      const rowHtml = trMatch[1];
      
      // Extract Player Name from <th data-stat="player"...><a ...>Name</a></th>
      const nameMatch = rowHtml.match(/data-stat="player"[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i);
      // Extract position
      const posMatch = rowHtml.match(/data-stat="position"[^>]*>([^<]+)<\/td>/i);
      // Extract number
      const numMatch = rowHtml.match(/data-stat="shirtnumber"[^>]*>([^<]*)<\/th>/i) || rowHtml.match(/data-stat="shirtnumber"[^>]*>([^<]*)<\/td>/i);
      
      if (nameMatch) {
        players.push({
          name: nameMatch[1].trim(),
          pos: posMatch ? posMatch[1].trim() : '',
          num: numMatch ? numMatch[1].trim() : ''
        });
      }
    }
    
    console.log(`Found ${players.length} players`);
    console.log(players.slice(0, 5));
    
  } catch (err) {
    console.error(err);
  }
}

scrapeFBRef('https://fbref.com/en/squads/b8fd03ef/Manchester-City-Stats');
