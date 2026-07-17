const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });
const API_KEY = "2fc579dbb539cbc9c2e4caa650d7b47f";

async function fetchOdds(sport) {
  try {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

function analyzeAndPick(match) {
  const home = match.home_team;
  const away = match.away_team;
  const bookmaker = match.bookmakers && match.bookmakers[0];
  if (!bookmaker) return null;
  const market = bookmaker.markets.find((m) => m.key === 'h2h');
  if (!market || !market.outcomes) return null;

  const homeOdds = market.outcomes.find((o) => o.name === home)?.price || 2.5;
  const awayOdds = market.outcomes.find((o) => o.name === away)?.price || 2.5;
  const drawOdds = market.outcomes.find((o) => o.name === 'Draw')?.price || 3.0;

  let pick = '';
  let finalOdds = 0;

  if (homeOdds < 1.55) { pick = '1'; finalOdds = homeOdds; }
  else if (awayOdds < 1.55) { pick = '2'; finalOdds = awayOdds; }
  else if (homeOdds < 2.0 && awayOdds > 3.0) { pick = '1X'; finalOdds = Math.max(1.15, homeOdds - 0.4); }
  else if (awayOdds < 2.0 && homeOdds > 3.0) { pick = 'X2'; finalOdds = Math.max(1.15, awayOdds - 0.4); }
  else if (drawOdds < 3.20) { pick = 'X'; finalOdds = drawOdds; }
  else { pick = 'Gol'; finalOdds = 1.75; }

  return { id: match.id, match: `${home} - ${away}`, pick, odds: Math.round(finalOdds * 100) / 100, commence_time: match.commence_time };
}

async function run() {
  console.log("Fetching dati da The Odds API...");
  const data1 = await fetchOdds('soccer_italy_serie_a');
  const data2 = await fetchOdds('soccer_uefa_champs_league');
  const data3 = await fetchOdds('upcoming');
  
  const allData = [...data1, ...data2, ...data3].filter(m => m.sport_key?.startsWith('soccer_'));
  console.log(`Trovati ${allData.length} match grezzi`);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 45); // Mettiamo 45 giorni visto che in estate i campionati sono fermi

  const picks = allData
    .filter(m => new Date(m.commence_time) < nextWeek)
    .map(analyzeAndPick)
    .filter(Boolean);

  const uniquePicksMap = new Map();
  picks.forEach(p => uniquePicksMap.set(p.id, p));
  const uniquePicks = Array.from(uniquePicksMap.values());

  console.log(`Previsioni calcolate: ${uniquePicks.length}`);

  if (uniquePicks.length > 0) {
      // Pulisci vecchi
      await sql`DELETE FROM ml_predictions`;
      
      // Inserisci nuovi
      for (const p of uniquePicks) {
          await sql`
            INSERT INTO ml_predictions (id, match_name, pick, odds, match_date, algorithm_version)
            VALUES (${p.id}, ${p.match}, ${p.pick}, ${p.odds}, ${p.commence_time}, 'v1.0_heuristic')
          `;
      }
      console.log("Inserimento completato!");
  } else {
      console.log("Nessuna previsione disponibile per la prossima settimana.");
  }
}

run();
