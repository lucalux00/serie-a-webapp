const fs = require('fs');

async function check() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  let token = '';
  envFile.split('\n').forEach(line => {
    if (line.startsWith('FOOTBALL_DATA_API_KEY=')) {
      token = line.split('=')[1].trim();
      // remove quotes if any
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }
    }
  });

  const url = 'https://api.football-data.org/v4/competitions/SA';
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  const data = await res.json();
  console.log('Current Season:', data.currentSeason);
  
  const standingsUrl = 'https://api.football-data.org/v4/competitions/SA/standings';
  const res2 = await fetch(standingsUrl, { headers: { 'X-Auth-Token': token } });
  const data2 = await res2.json();
  console.log('Standings season:', data2.season);
  console.log('Standings length:', data2.standings ? data2.standings.length : 'none');
}

check();
