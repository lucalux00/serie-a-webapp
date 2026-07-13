const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const Parser = require('rss-parser');
const parser = new Parser();

async function testExtraction() {
  try {
    console.log('Fetching Napoli RSS...');
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=napoli+calcio+when:14d&hl=it&gl=IT&ceid=IT:it');
    
    // Cerchiamo la notizia su Allegri
    const allegriItem = feed.items.find(i => i.title.includes('Allegri')) || feed.items[0];
    console.log('Selected item:', allegriItem.title);
    console.log('URL:', allegriItem.link);

    // Resolve Google News URL
    let resolvedUrl = allegriItem.link;
    try {
      const resRedirect = await fetch(allegriItem.link, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      resolvedUrl = resRedirect.url !== allegriItem.link ? resRedirect.url : allegriItem.link;
    } catch (e) {
      console.log('Redirect failed', e.message);
    }
    
    console.log('Resolved URL:', resolvedUrl);

    // Fetch article
    const res = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'it-IT,it;q=0.9',
      }
    });
    
    console.log('Fetch status:', res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    const doc = new JSDOM(html, { url: resolvedUrl });
    const window = doc.window;
    const elementsToRemove = window.document.querySelectorAll('script, style, nav, footer, aside, .cookie, .ad, .advertisement');
    elementsToRemove.forEach(el => el.remove());

    const reader = new Readability(window.document);
    const article = reader.parse();

    if (article && article.textContent) {
      console.log('Content preview:', article.textContent.trim().substring(0, 200));
    } else {
      console.log('Readability returned null');
    }
  } catch (e) {
    console.error('Extraction error:', e);
  }
}

testExtraction();
