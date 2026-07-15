async function resolveGoogleNewsUrl(googleUrl) {
  try {
    const matchBase64 = googleUrl.match(/articles\/([A-Za-z0-9_-]+)/);
    if (matchBase64?.[1]) {
      let b64 = matchBase64[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      try {
        const decoded = Buffer.from(b64, 'base64').toString('utf-8');
        const urlMatch = decoded.match(/https?:\/\/(?!.*google\.com)[^\x00-\x1F"'\s>]+/);
        if (urlMatch?.[0]) return urlMatch[0];
      } catch (e) { console.error("Decode err:", e); }
    }

    console.log("Decoding failed, fetching...");
    const res = await fetch(googleUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      }
    });
    console.log("Fetch result URL:", res.url);
    if (!res.url.includes('google.com')) return res.url;

    const html = await res.text();
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    let found = '';
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('http') && !href.includes('google.com') && !found) {
        found = href;
      }
    });
    return found || googleUrl;
  } catch (e) {
    console.error("Total err:", e);
    return googleUrl;
  }
}

resolveGoogleNewsUrl("https://news.google.com/rss/articles/CBMiswFBVV95cUxPWEJ3XzNtcExvZXhhU1IweUotbkxzWGZ0NmV0U3VwYUFpSzd3cExjWEcxRjBnNkVvS3N4U2x2N2NtbTRPZ1NFRU50bF9kckw1eTBPbnpDZW1xZlh0Q3FRYXU3bS15ZExxRHRTcHVSZllPZzNYTk90ZmR0ZUxQZkF2QWRsRWdGZnV6aXp2Sk10R2RfbXNtbDR3ck42cEZxZWMyOFc5a3dJQUl1aUp6SjZ3S1BR?oc=5").then(console.log);
