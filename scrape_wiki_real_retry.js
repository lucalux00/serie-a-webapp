const cheerio = require('cheerio');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const ALL_TEAMS = [
  // PL
  { id: 'arsenal', name: 'Arsenal', search: 'Arsenal F.C.' },
  { id: 'aston-villa', name: 'Aston Villa', search: 'Aston Villa F.C.' },
  { id: 'bournemouth', name: 'Bournemouth', search: 'A.F.C. Bournemouth' },
  { id: 'brentford', name: 'Brentford', search: 'Brentford F.C.' },
  { id: 'brighton', name: 'Brighton', search: 'Brighton & Hove Albion F.C.' },
  { id: 'chelsea', name: 'Chelsea', search: 'Chelsea F.C.' },
  { id: 'crystal-palace', name: 'Crystal Palace', search: 'Crystal Palace F.C.' },
  { id: 'everton', name: 'Everton', search: 'Everton F.C.' },
  { id: 'fulham', name: 'Fulham', search: 'Fulham F.C.' },
  { id: 'ipswich-town', name: 'Ipswich Town', search: 'Ipswich Town F.C.' },
  { id: 'leicester-city', name: 'Leicester City', search: 'Leicester City F.C.' },
  { id: 'liverpool', name: 'Liverpool', search: 'Liverpool F.C.' },
  { id: 'manchester-city', name: 'Manchester City', search: 'Manchester City F.C.' },
  { id: 'manchester-united', name: 'Manchester United', search: 'Manchester United F.C.' },
  { id: 'newcastle', name: 'Newcastle', search: 'Newcastle United F.C.' },
  { id: 'nottingham', name: 'Nottingham F.', search: 'Nottingham Forest F.C.' },
  { id: 'southampton', name: 'Southampton', search: 'Southampton F.C.' },
  { id: 'tottenham', name: 'Tottenham', search: 'Tottenham Hotspur F.C.' },
  { id: 'west-ham', name: 'West Ham', search: 'West Ham United F.C.' },
  { id: 'wolves', name: 'Wolverhampton', search: 'Wolverhampton Wanderers F.C.' },

  // LL
  { id: 'alaves', name: 'Alavés', search: 'Deportivo Alavés' },
  { id: 'athletic-club', name: 'Athletic Club', search: 'Athletic Bilbao' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', search: 'Atlético Madrid' },
  { id: 'barcelona', name: 'Barcelona', search: 'FC Barcelona' },
  { id: 'celta-vigo', name: 'Celta Vigo', search: 'RC Celta de Vigo' },
  { id: 'espanyol', name: 'Espanyol', search: 'RCD Espanyol' },
  { id: 'getafe', name: 'Getafe', search: 'Getafe CF' },
  { id: 'girona', name: 'Girona', search: 'Girona FC' },
  { id: 'las-palmas', name: 'Las Palmas', search: 'UD Las Palmas' },
  { id: 'leganes', name: 'Leganés', search: 'CD Leganés' },
  { id: 'mallorca', name: 'Mallorca', search: 'RCD Mallorca' },
  { id: 'osasuna', name: 'Osasuna', search: 'CA Osasuna' },
  { id: 'rayo-vallecano', name: 'Rayo Vallecano', search: 'Rayo Vallecano' },
  { id: 'real-betis', name: 'Real Betis', search: 'Real Betis' },
  { id: 'real-madrid', name: 'Real Madrid', search: 'Real Madrid CF' },
  { id: 'real-sociedad', name: 'Real Sociedad', search: 'Real Sociedad' },
  { id: 'sevilla', name: 'Sevilla', search: 'Sevilla FC' },
  { id: 'valencia', name: 'Valencia', search: 'Valencia CF' },
  { id: 'valladolid', name: 'Valladolid', search: 'Real Valladolid' },
  { id: 'villarreal', name: 'Villarreal', search: 'Villarreal CF' },

  // BL
  { id: 'augsburg', name: 'Augsburg', search: 'FC Augsburg' },
  { id: 'bayern-munich', name: 'Bayern Munich', search: 'FC Bayern Munich' },
  { id: 'bochum', name: 'Bochum', search: 'VfL Bochum' },
  { id: 'werder-bremen', name: 'Werder Bremen', search: 'SV Werder Bremen' },
  { id: 'dortmund', name: 'Dortmund', search: 'Borussia Dortmund' },
  { id: 'eintracht-frankfurt', name: 'E. Frankfurt', search: 'Eintracht Frankfurt' },
  { id: 'freiburg', name: 'Freiburg', search: 'SC Freiburg' },
  { id: 'heidenheim', name: 'Heidenheim', search: '1. FC Heidenheim' },
  { id: 'hoffenheim', name: 'Hoffenheim', search: 'TSG 1899 Hoffenheim' },
  { id: 'holstein-kiel', name: 'Holstein Kiel', search: 'Holstein Kiel' },
  { id: 'rb-leipzig', name: 'RB Leipzig', search: 'RB Leipzig' },
  { id: 'bayer-leverkusen', name: 'Leverkusen', search: 'Bayer 04 Leverkusen' },
  { id: 'mainz', name: 'Mainz 05', search: '1. FSV Mainz 05' },
  { id: 'borussia-monchengladbach', name: 'Mönchengladbach', search: 'Borussia Mönchengladbach' },
  { id: 'st-pauli', name: 'St. Pauli', search: 'FC St. Pauli' },
  { id: 'stuttgart', name: 'Stuttgart', search: 'VfB Stuttgart' },
  { id: 'union-berlin', name: 'Union Berlin', search: '1. FC Union Berlin' },
  { id: 'wolfsburg', name: 'Wolfsburg', search: 'VfL Wolfsburg' },

  // L1
  { id: 'angers', name: 'Angers', search: 'Angers SCO' },
  { id: 'auxerre', name: 'Auxerre', search: 'AJ Auxerre' },
  { id: 'brest', name: 'Brest', search: 'Stade Brestois 29' },
  { id: 'le-havre', name: 'Le Havre', search: 'Le Havre AC' },
  { id: 'lens', name: 'Lens', search: 'RC Lens' },
  { id: 'lille', name: 'Lille', search: 'Lille OSC' },
  { id: 'lyon', name: 'Lyon', search: 'Olympique Lyonnais' },
  { id: 'marseille', name: 'Marseille', search: 'Olympique de Marseille' },
  { id: 'monaco', name: 'Monaco', search: 'AS Monaco FC' },
  { id: 'montpellier', name: 'Montpellier', search: 'Montpellier HSC' },
  { id: 'nantes', name: 'Nantes', search: 'FC Nantes' },
  { id: 'nice', name: 'Nice', search: 'OGC Nice' },
  { id: 'psg', name: 'PSG', search: 'Paris Saint-Germain F.C.' },
  { id: 'reims', name: 'Reims', search: 'Stade de Reims' },
  { id: 'rennes', name: 'Rennes', search: 'Stade Rennais F.C.' },
  { id: 'saint-etienne', name: 'Saint-Étienne', search: 'AS Saint-Étienne' },
  { id: 'strasbourg', name: 'Strasbourg', search: 'RC Strasbourg Alsace' },
  { id: 'toulouse', name: 'Toulouse', search: 'Toulouse FC' }
];

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getWikipediaPageTitle(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.query && data.query.search && data.query.search.length > 0) {
    return data.query.search[0].title;
  }
  return null;
}

function mapPosition(abbr) {
  const map = {
    'GK': 'Portiere',
    'DF': 'Difensore',
    'MF': 'Centrocampista',
    'FW': 'Attaccante',
    'FWD': 'Attaccante',
    'MID': 'Centrocampista',
    'DEF': 'Difensore'
  };
  return map[abbr.toUpperCase()] || 'Giocatore';
}

async function scrapeTeam(team) {
  try {
    const exactTitle = await getWikipediaPageTitle(team.search);
    if (!exactTitle) {
      console.log(`Could not find page for ${team.name}`);
      return [];
    }
    
    await delay(1000); // Prevent rate limit
    
    const htmlRes = await fetch(`https://en.wikipedia.org/wiki/${encodeURIComponent(exactTitle)}`);
    const html = await htmlRes.text();
    const $ = cheerio.load(html);
    
    const players = [];
    
    $('tr.vcard').each((j, row) => {
      let no = $(row).find('td').eq(0).text().trim();
      let posAbbr = $(row).find('td').eq(1).find('abbr').text().trim() || $(row).find('td').eq(1).text().trim();
      
      let name = $(row).find('.fn').text().trim();
      if (!name) name = $(row).find('td').eq(3).text().trim();
      name = name.replace(/\([^)]+\)/g, '').trim();
      
      if (name && posAbbr && /^(GK|DF|MF|FW|FWD|MID|DEF)$/i.test(posAbbr)) {
        let validNo = parseInt(no, 10);
        if (isNaN(validNo)) validNo = null;
        players.push({ no: validNo, pos: mapPosition(posAbbr), name });
      }
    });

    let coachName = 'Allenatore';
    const managerLink = $('th:contains("Manager")').next('td').find('a').first().text() 
                     || $('th:contains("Head coach")').next('td').find('a').first().text()
                     || $('th:contains("Manager")').next('td').text().trim();
    if (managerLink) {
      coachName = managerLink.replace(/\([^)]+\)/g, '').trim();
    }
    
    return { players, coach: coachName };
  } catch (e) {
    console.error(`Error scraping ${team.name}:`, e.message);
    return { players: [], coach: 'Allenatore' };
  }
}

async function run() {
  let totalPlayers = 0;
  
  // Find teams that failed
  for (const team of ALL_TEAMS) {
    const check = await pool.query('SELECT count(*) FROM players WHERE team_id = $1', [team.id]);
    if (parseInt(check.rows[0].count) > 0) {
      continue; // Already has data
    }
    
    console.log(`Retrying scrape for ${team.name}...`);
    const data = await scrapeTeam(team);
    
    if (data.players.length === 0) {
      console.log(`WARNING: Still 0 players found for ${team.name}`);
      continue;
    }
    
    console.log(`Found ${data.players.length} players and manager ${data.coach} for ${team.name}`);
    
    // INSERT COACH
    await pool.query(
      'INSERT INTO players (team_id, name, role, number, squad_type, is_coach, is_staff) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [team.id, data.coach, 'Allenatore', null, 'first', true, false]
    );

    // INSERT PLAYERS
    for (const p of data.players) {
      await pool.query(
        'INSERT INTO players (team_id, name, role, number, squad_type, is_coach, is_staff) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [team.id, p.name, p.pos, p.no || null, 'first', false, false]
      );
      totalPlayers++;
    }
    
    await delay(1500); // Extra delay
  }
  
  console.log(`Done. Inserted ${totalPlayers} missing real players.`);
  process.exit(0);
}

run().catch(console.error);
