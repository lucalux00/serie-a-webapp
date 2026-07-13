const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

async function scrape() {
  try {
    const res = await fetch('https://www.legaseriea.it/serie-a/calendario-risultati');
    const html = await res.text();
    fs.writeFileSync('lega_html.html', html);
    
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Look for Next.js data script containing the JSON structure
    const nextScript = doc.querySelector('#__NEXT_DATA__');
    if (nextScript) {
       console.log("Found NEXT_DATA script.");
       const data = JSON.parse(nextScript.textContent);
       console.log("Keys:", Object.keys(data));
       fs.writeFileSync('lega_next_data.json', JSON.stringify(data, null, 2));
    } else {
       console.log("No NEXT_DATA script found. Next.js might be using App Router.");
    }

    // Attempt direct DOM parsing just in case it's rendered
    const matches = doc.querySelectorAll('.hm-match-item, .match-card, [class*="match"]');
    console.log(`Found ${matches.length} elements containing 'match' class.`);

  } catch (err) {
    console.error("Scraping error:", err);
  }
}

scrape();
