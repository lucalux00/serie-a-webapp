const fs = require('fs');
const path = require('path');

async function scrapeLega() {
  try {
    const res = await fetch('https://www.legaseriea.it/serie-a/calendario-risultati');
    const html = await res.text();
    
    // Find NEXT_DATA
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    if (!match) {
      console.log('No __NEXT_DATA__ found!');
      return;
    }
    
    const nextData = JSON.parse(match[1]);
    fs.writeFileSync(path.join(__dirname, 'lega_data.json'), JSON.stringify(nextData, null, 2));
    console.log('Saved lega_data.json for inspection. Size:', match[1].length);
    
    // Try to extract matches if they are easily accessible
    // Usually they are in nextData.props.pageProps...
  } catch (err) {
    console.error(err);
  }
}

scrapeLega();
