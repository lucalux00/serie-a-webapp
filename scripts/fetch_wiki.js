const fs = require('fs');

async function fetchWikiWinners(url, tableKeyword) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    const tablePattern = /<table class="wikitable[^>]*>([\s\S]*?)<\/table>/g;
    let match;
    const tables = [];
    while ((match = tablePattern.exec(html)) !== null) {
      tables.push(match[1]);
    }

    for (const table of tables) {
      if (table.includes(tableKeyword) || table.includes('Winning years')) {
        const rowPattern = /<tr.*?>([\s\S]*?)<\/tr>/g;
        let rowMatch;
        const results = [];
        while ((rowMatch = rowPattern.exec(table)) !== null) {
          const row = rowMatch[1];
          const colPattern = /<t[dh].*?>([\s\S]*?)<\/t[dh]>/g;
          let colMatch;
          const cols = [];
          while ((colMatch = colPattern.exec(row)) !== null) {
            cols.push(colMatch[1]);
          }

          if (cols.length >= 3) {
            const cleanCols = cols.map(c => c.replace(/<[^>]+>/g, '').replace(/&#160;/g, '').replace(/&amp;/g, '&').trim());
            let club = cleanCols[0].replace(/\[.*?\]/g, '').trim();
            if (club === '' || club === 'Club' || club === 'Team') continue;

            const yearsCol = cleanCols[2].length > 5 ? cleanCols[2] : cleanCols[cleanCols.length - 1];
            
            const yearPattern = /\b(18\d{2}(?:[/-]\d{2,4})?|19\d{2}(?:[/-]\d{2,4})?|20\d{2}(?:[/-]\d{2,4})?)\b/g;
            let yMatch;
            const years = [];
            while ((yMatch = yearPattern.exec(yearsCol)) !== null) {
              years.push(yMatch[1]);
            }

            if (years.length > 0) {
              results.push({ team: club, wins: years });
            }
          }
        }
        if (results.length > 0) return results;
      }
    }
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function run() {
  const data = {
    LL: await fetchWikiWinners("https://en.wikipedia.org/wiki/List_of_Spanish_football_champions", "Winning years"),
    BL: await fetchWikiWinners("https://en.wikipedia.org/wiki/List_of_German_football_champions", "Winning years"),
    L1: await fetchWikiWinners("https://en.wikipedia.org/wiki/List_of_French_football_champions", "Winning years"),
    PL: await fetchWikiWinners("https://en.wikipedia.org/wiki/List_of_English_football_champions", "Winning seasons")
  };
  console.log(JSON.stringify(data, null, 2));
}

run();
