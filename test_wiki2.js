async function testWikiSearch() {
  const teamName = 'Arsenal';
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=intitle:"squad" intitle:"${teamName}"&srnamespace=10&format=json`;
  try {
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (data.query.search.length > 0) {
      const templateTitle = data.query.search[0].title;
      console.log('Fetching', templateTitle);
      
      const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(templateTitle)}&format=json`;
      const res2 = await fetch(contentUrl);
      const data2 = await res2.json();
      const pages = data2.query.pages;
      const pageId = Object.keys(pages)[0];
      const content = pages[pageId].revisions[0].slots.main['*'];
      
      const lines = content.split('\n');
      const players = [];
      for (const line of lines) {
        if (line.match(/\{\{\s*football squad2? player/i)) {
          const nameMatch = line.match(/name\s*=\s*(?:\[\[([^\]|]+)(?:\|[^\]]+)?\]\]|([^|}]+))/i);
          const noMatch = line.match(/no\s*=\s*(\d+)/i);
          
          if (nameMatch) {
            players.push({
              name: (nameMatch[1] || nameMatch[2]).trim(),
              no: noMatch ? noMatch[1] : null,
            });
          }
        } else if (line.match(/\{\{\s*football squad(?:2)? manager/i)) {
          const nameMatch = line.match(/name\s*=\s*(?:\[\[([^\]|]+)(?:\|[^\]]+)?\]\]|([^|}]+))/i);
          if (nameMatch) {
             console.log('Manager:', (nameMatch[1] || nameMatch[2]).trim());
          }
        }
      }
      console.log(`Found ${players.length} players`);
      console.log(players.slice(0, 5));
    }
  } catch (err) {
    console.error(err);
  }
}
testWikiSearch();
