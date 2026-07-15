const fs = require('fs');

async function testWikiScraper(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(title)}&format=json`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === "-1") {
      console.log(`Page not found: ${title}`);
      return;
    }
    
    const content = pages[pageId].revisions[0].slots.main['*'];
    
    // Extract squad players
    // Template usually looks like: {{football squad player |no=1 |nat=ESP |name=[[Thibaut Courtois]]}}
    // Or sometimes just: {{Football squad player|no=1|nat=BEL|name=[[Thibaut Courtois]]|pos=GK}}
    
    const playerRegex = /\{\{[fF]ootball squad player\s*\|.*?(?:name=([^|]+)|pos=([^|]+)|no=([^|]+)).*?\}\}/g;
    let match;
    let players = [];
    
    // A better approach is to split by lines or use a generic regex for the template
    const lines = content.split('\n');
    let inSquad = false;
    
    for (let line of lines) {
      if (line.toLowerCase().includes('{{football squad start')) {
        inSquad = true;
        continue;
      }
      if (line.toLowerCase().includes('{{football squad end')) {
        inSquad = false;
        continue;
      }
      
      if (inSquad && line.toLowerCase().includes('{{football squad player')) {
        // Parse the template properties manually
        const noMatch = line.match(/no\s*=\s*(\d+)/i);
        const nameMatch = line.match(/name\s*=\s*(?:\[\[([^\]|]+)(?:\|[^\]]+)?\]\]|([^|}]+))/i);
        const posMatch = line.match(/pos\s*=\s*([A-Za-z]+)/i);
        
        if (nameMatch) {
          const rawName = nameMatch[1] || nameMatch[2];
          const name = rawName ? rawName.trim() : 'Unknown';
          const no = noMatch ? parseInt(noMatch[1]) : null;
          const pos = posMatch ? posMatch[1].trim() : 'Unk';
          
          players.push({ name, number: no, role: pos });
        }
      }
    }
    
    console.log(`Found ${players.length} players for ${title}`);
    console.log(players.slice(0, 5));
    
  } catch (err) {
    console.error(err);
  }
}

testWikiScraper('Template:Real Madrid CF squad');
testWikiScraper('Template:Manchester City F.C. squad');
testWikiScraper('Template:Paris Saint-Germain F.C. squad');
testWikiScraper('Template:FC Bayern Munich squad');
testWikiScraper('Template:Liverpool F.C. squad');
testWikiScraper('Template:Juventus F.C. squad');
