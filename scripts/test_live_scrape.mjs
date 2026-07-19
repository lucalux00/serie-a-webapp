import * as cheerio from 'cheerio';

async function testScrape() {
  // Let's try a google search to find a recent TMW match
  const searchUrl = 'https://www.google.com/search?q=site:tuttomercatoweb.com+%22diretta+scritta%22+inter';
  
  console.log("Fetching search results to find a match url...");
  const searchRes = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  const searchHtml = await searchRes.text();
  const $search = cheerio.load(searchHtml);
  
  let matchUrl = '';
  $search('a').each((i, el) => {
    const href = $search(el).attr('href');
    if (href && href.includes('tuttomercatoweb.com') && href.includes('diretta-scritta')) {
      // clean up google redirect
      const urlMatch = href.match(/q=(https:\/\/www\.tuttomercatoweb\.com[^&]+)/);
      if (urlMatch) {
          matchUrl = urlMatch[1];
          return false; // break loop
      } else if (href.startsWith('https://www.tuttomercatoweb.com')) {
          matchUrl = href;
          return false;
      }
    }
  });

  if (!matchUrl) {
    console.log("Could not find a direct match URL. Let's try a fallback hardcoded URL format.");
    matchUrl = 'https://www.tuttomercatoweb.com/serie-a/diretta-scritta-inter-juventus-1896799'; // Example, might be 404
  }

  console.log(`Trying to scrape: ${matchUrl}`);
  
  try {
    const res = await fetch(matchUrl, {
        headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    
    if (!res.ok) {
        console.error(`Failed to fetch ${matchUrl}: ${res.status}`);
        return;
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const events = [];
    
    $('p, div').each((i, el) => {
        const text = $(el).text().trim();
        if (/^\d{1,3}'\s*(-|:)/.test(text) || text.includes('⚽') || /^\d{1,3}'/.test(text)) {
            events.push(text.substring(0, 100).replace(/\n/g, ' ') + '...');
        }
    });
    
    console.log("Extracted events (sample):");
    console.log(events.slice(0, 10));

    if (events.length === 0) {
        console.log("No events found. Dumping some class names of div/p to guess structure:");
        const classes = new Set();
        $('div').each((i,el) => {
           const c = $(el).attr('class');
           if (c) classes.add(c);
        });
        console.log(Array.from(classes).slice(0, 20));
    }
    
  } catch (err) {
    console.error("Error scraping:", err.message);
  }
}

testScrape();
