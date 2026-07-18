const cheerio = require('cheerio');

async function testScraping() {
  const url = 'https://www.corrieredellosport.it/news/calcio/calciomercato/2026/07/17-1234567/news'; // Just a test, but let's use a real one
  // Better to use a valid URL, or we can just fetch google to see if Gemini works.
  // The user said they tried MULTIPLE articles and they all failed.
  // Wait, if ALL articles failed, it could be the Gemini API call itself!
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI KEY:", geminiKey ? "Present" : "Missing");
}
testScraping();
