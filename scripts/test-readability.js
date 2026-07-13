const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

async function testScrape(url) {
  try {
    console.log('Fetching:', url);
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    
    const html = await res.text();
    console.log('HTML size:', html.length);
    
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    
    if (article) {
      console.log('Title:', article.title);
      console.log('Content snippet:', article.textContent.substring(0, 500).trim());
    } else {
      console.log('No article parsed');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testScrape('https://www.tuttomercatoweb.com/serie-a/napoli-kvaratskhelia-sempre-piu-lontano-dal-rinnovo-il-psg-ci-riprova-1980838');
