/**
 * MATCH PREDICTION ENGINE - Data Fetcher
 * Scarica fixtures, classifiche e H2H da football-data.org
 * e meteo da open-meteo.com, poi li salva in Postgres
 */

const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

// Mapping campionati -> codici football-data.org
const LEAGUE_CODES = {
  'A': { code: 'SA', name: 'Serie A' },
  'B': { code: 'SB', name: 'Serie B' },
  'PL': { code: 'PL', name: 'Premier League' },
  'LL': { code: 'PD', name: 'La Liga' },
  'BL': { code: 'BL1', name: 'Bundesliga' },
  'L1': { code: 'FL1', name: 'Ligue 1' }
};

// Coordinate stadi per meteo
const STADIUM_COORDS = {
  'SA': { lat: 41.9, lon: 12.5 }, // Default Roma
  'SB': { lat: 44.4, lon: 8.9 },
  'PL': { lat: 51.5, lon: -0.1 }, // Londra
  'PD': { lat: 40.4, lon: -3.7 }, // Madrid
  'BL1': { lat: 52.5, lon: 13.4 }, // Berlino
  'FL1': { lat: 48.9, lon: 2.3 }  // Parigi
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function footballFetch(endpoint) {
  await sleep(7000); // Rispetto 10 req/min
  const url = `${FOOTBALL_API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Football API Error ${res.status}: ${txt}`);
  }
  return res.json();
}

async function getWeather(lat, lon, dateStr) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weathercode&start_date=${dateStr}&end_date=${dateStr}&timezone=Europe/Rome`;
    const res = await fetch(url);
    const data = await res.json();
    // Prendi valori medi del pomeriggio (ore 15-21)
    const hours = data.hourly;
    const sliceStart = 15;
    const temp = hours.temperature_2m?.slice(sliceStart, sliceStart+6);
    const rain = hours.precipitation_probability?.slice(sliceStart, sliceStart+6);
    const wind = hours.wind_speed_10m?.slice(sliceStart, sliceStart+6);
    const avg = arr => arr ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null;
    return {
      temp_avg: avg(temp),
      rain_prob: avg(rain),
      wind_kmh: avg(wind)
    };
  } catch(e) {
    console.warn('Meteo unavailable:', e.message);
    return null;
  }
}

async function setupDB() {
  console.log('📦 Setting up predictions database...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS match_fixtures (
      id SERIAL PRIMARY KEY,
      external_id INTEGER UNIQUE NOT NULL,
      home_team_id VARCHAR(100) NOT NULL,
      home_team_name VARCHAR(100) NOT NULL,
      away_team_id VARCHAR(100) NOT NULL,
      away_team_name VARCHAR(100) NOT NULL,
      home_logo TEXT,
      away_logo TEXT,
      league_code VARCHAR(10) NOT NULL,
      league_name VARCHAR(50) NOT NULL,
      match_date TIMESTAMPTZ NOT NULL,
      venue VARCHAR(100),
      matchday INTEGER,
      status VARCHAR(20) DEFAULT 'SCHEDULED',
      home_score INTEGER,
      away_score INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS match_predictions (
      id SERIAL PRIMARY KEY,
      fixture_id INTEGER REFERENCES match_fixtures(id) ON DELETE CASCADE,
      prediction VARCHAR(20),
      confidence INTEGER,
      home_win_prob NUMERIC(5,2),
      draw_prob NUMERIC(5,2),
      away_win_prob NUMERIC(5,2),
      over25_prob NUMERIC(5,2),
      btts_prob NUMERIC(5,2),
      expected_goals_home NUMERIC(4,2),
      expected_goals_away NUMERIC(4,2),
      risk_level VARCHAR(10),
      key_factors JSONB DEFAULT '[]',
      analysis_text TEXT,
      home_form JSONB,
      away_form JSONB,
      h2h_data JSONB,
      weather_data JSONB,
      standings_data JSONB,
      generated_at TIMESTAMPTZ,
      UNIQUE(fixture_id)
    );
  `;

  console.log('✅ Database setup complete');
}

async function fetchFixturesForLeague(leagueKey) {
  const league = LEAGUE_CODES[leagueKey];
  if (!league) return [];
  
  console.log(`\n🏆 Fetching fixtures for ${league.name} (${league.code})...`);
  
  try {
    const data = await footballFetch(`/competitions/${league.code}/matches?status=SCHEDULED&limit=20`);
    
    if (!data.matches || data.matches.length === 0) {
      console.log(`  No upcoming matches for ${league.name}`);
      return [];
    }

    // Filtro partite nei prossimi 10 giorni
    const now = new Date();
    const tenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const upcoming = data.matches.filter(m => {
      const d = new Date(m.utcDate);
      return d >= now && d <= tenDays;
    });

    console.log(`  Found ${upcoming.length} upcoming matches`);
    
    const saved = [];
    for (const match of upcoming) {
      try {
        const result = await sql`
          INSERT INTO match_fixtures (
            external_id, home_team_id, home_team_name, away_team_id, away_team_name,
            home_logo, away_logo, league_code, league_name, match_date, matchday, status
          ) VALUES (
            ${match.id},
            ${match.homeTeam.id.toString()},
            ${match.homeTeam.name},
            ${match.awayTeam.id.toString()},
            ${match.awayTeam.name},
            ${match.homeTeam.crest || null},
            ${match.awayTeam.crest || null},
            ${league.code},
            ${league.name},
            ${match.utcDate},
            ${match.matchday || null},
            ${match.status || 'SCHEDULED'}
          )
          ON CONFLICT (external_id) DO UPDATE SET
            status = EXCLUDED.status,
            updated_at = NOW()
          RETURNING id, home_team_name, away_team_name;
        `;
        if (result.rows[0]) {
          console.log(`  ✅ ${result.rows[0].home_team_name} vs ${result.rows[0].away_team_name}`);
          saved.push({ ...result.rows[0], externalId: match.id, leagueCode: league.code, matchDate: match.utcDate });
        }
      } catch (e) {
        console.warn(`  ⚠️ Error saving match ${match.id}:`, e.message);
      }
    }
    return saved;
  } catch (e) {
    console.error(`  ❌ Error fetching ${league.name}:`, e.message);
    return [];
  }
}

async function fetchTeamForm(teamId, leagueCode) {
  try {
    const data = await footballFetch(`/teams/${teamId}/matches?status=FINISHED&limit=5`);
    if (!data.matches) return null;
    
    return data.matches.map(m => ({
      date: m.utcDate,
      isHome: m.homeTeam.id === teamId,
      goalsFor: m.homeTeam.id === teamId ? m.score?.fullTime?.home : m.score?.fullTime?.away,
      goalsAgainst: m.homeTeam.id === teamId ? m.score?.fullTime?.away : m.score?.fullTime?.home,
      result: m.score?.winner === 'HOME_TEAM' 
        ? (m.homeTeam.id === teamId ? 'W' : 'L')
        : m.score?.winner === 'AWAY_TEAM'
        ? (m.awayTeam.id === teamId ? 'W' : 'L')
        : 'D',
      opponent: m.homeTeam.id === teamId ? m.awayTeam.name : m.homeTeam.name
    }));
  } catch(e) {
    return null;
  }
}

async function fetchH2H(homeTeamId, awayTeamId) {
  try {
    // Usiamo l'API matches con filtro
    const data = await footballFetch(`/teams/${homeTeamId}/matches?status=FINISHED&limit=20`);
    if (!data.matches) return [];
    
    const h2h = data.matches
      .filter(m => m.homeTeam.id === awayTeamId || m.awayTeam.id === awayTeamId)
      .slice(0, 5)
      .map(m => ({
        date: m.utcDate,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeScore: m.score?.fullTime?.home,
        awayScore: m.score?.fullTime?.away
      }));
    
    return h2h;
  } catch(e) {
    return [];
  }
}

async function fetchStandings(leagueCode) {
  try {
    const data = await footballFetch(`/competitions/${leagueCode}/standings`);
    if (!data.standings) return null;
    const table = data.standings[0]?.table || [];
    return table.map(t => ({
      position: t.position,
      team: t.team.name,
      teamId: t.team.id,
      points: t.points,
      playedGames: t.playedGames,
      won: t.won,
      draw: t.draw,
      lost: t.lost,
      goalsFor: t.goalsFor,
      goalsAgainst: t.goalsAgainst
    }));
  } catch(e) {
    return null;
  }
}

async function main() {
  console.log('🚀 Match Fixtures Fetcher Started');
  console.log('=====================================\n');
  
  await setupDB();
  
  const leagueKeys = ['A', 'PL', 'LL', 'BL', 'L1'];
  
  for (const key of leagueKeys) {
    await fetchFixturesForLeague(key);
    await sleep(2000);
  }
  
  console.log('\n\n✅ All fixtures fetched and saved to DB!');
  console.log('📊 Now run: node scripts/generate-predictions.js');
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
