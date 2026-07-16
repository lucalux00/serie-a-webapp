const cheerio = require('cheerio');
async function test() {
  const r = await fetch('https://www.transfermarkt.it/serie-a/letztetransfers/wettbewerb/IT1', {headers: {'User-Agent': 'Mozilla/5.0'}});
  const html = await r.text();
  const $ = cheerio.load(html);
  $('.items tbody tr').each((i, el) => {
    if (i > 0) return;
    const cols = $(el).children('td');
    console.log('Player:', $(cols[0]).find('.hauptlink a').text().trim());
  });
}
test();
