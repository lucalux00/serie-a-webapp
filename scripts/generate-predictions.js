/**
 * MATCH PREDICTION ENGINE - AI Analysis Generator
 * Per ogni fixture nel DB (prossime 72h), lancia il motore Gemini
 * e salva l'analisi completa in match_predictions
 */

const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function footballFetch(endpoint) {
  await sleep(7000);
  const res = await fetch(`${FOOTBALL_API_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY }
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function getWeather(matchDate, leagueCode) {
  const coords = {
    'SA': { lat: 41.9, lon: 12.5, city: 'Italia' },
    'SB': { lat: 44.4, lon: 8.9, city: 'Italia' },
    'PL': { lat: 51.5, lon: -0.1, city: 'Londra' },
    'PD': { lat: 40.4, lon: -3.7, city: 'Madrid' },
    'BL1': { lat: 52.5, lon: 13.4, city: 'Berlino' },
    'FL1': { lat: 48.9, lon: 2.3, city: 'Parigi' }
  };
  const c = coords[leagueCode] || coords['SA'];
  const dateStr = matchDate.substring(0, 10);
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
    const res = await fetch(url);
    const data = await res.json();
    const d = data.daily;
    return {
      city: c.city,
      tempMax: d?.temperature_2m_max?.[0],
      tempMin: d?.temperature_2m_min?.[0],
      precipitation: d?.precipitation_sum?.[0],
      windMax: d?.windspeed_10m_max?.[0]
    };
  } catch(e) {
    return null;
  }
}

async function geminiAnalyze(prompt) {
  await sleep(5000); // Rate limiting
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json'
      }
    })
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return JSON.parse(text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim());
}

function buildPredictionPrompt(fixture, homeForm, awayForm, h2h, standings, weather) {
  const homeStanding = standings?.find(s => s.team === fixture.home_team_name || s.teamId?.toString() === fixture.home_team_id);
  const awayStanding = standings?.find(s => s.team === fixture.away_team_name || s.teamId?.toString() === fixture.away_team_id);
  
  const formStr = (form) => {
    if (!form || form.length === 0) return 'Dati non disponibili';
    return form.map(f => `${f.result} ${f.goalsFor}-${f.goalsAgainst} vs ${f.opponent} (${f.isHome ? 'Casa' : 'Trasferta'})`).join(' | ');
  };

  const h2hStr = h2h?.length > 0 
    ? h2h.map(m => `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} (${m.date?.substring(0,10)})`).join(' | ')
    : 'Nessuno scontro diretto recente';

  const weatherStr = weather 
    ? `Temperatura max: ${weather.tempMax}°C, min: ${weather.tempMin}°C, Precipitazioni: ${weather.precipitation}mm, Vento max: ${weather.windMax}km/h`
    : 'Meteo non disponibile';

  const matchDateLocal = new Date(fixture.match_date).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' });

  return `Sei il miglior match analyst calcistico al mondo, con accesso a tutti i dati statistici. Analizza questa partita di calcio con la massima profondità e precisione.

## PARTITA DA ANALIZZARE
**${fixture.home_team_name}** vs **${fixture.away_team_name}**
Competizione: ${fixture.league_name}
Data e ora: ${matchDateLocal}
Giornata: ${fixture.matchday || 'N/D'}

## CLASSIFICA ATTUALE
${fixture.home_team_name}: ${homeStanding ? `${homeStanding.position}° posto, ${homeStanding.points} punti, ${homeStanding.playedGames} partite (${homeStanding.won}V-${homeStanding.draw}P-${homeStanding.lost}S), GF:${homeStanding.goalsFor} GS:${homeStanding.goalsAgainst}` : 'Dati non disponibili'}
${fixture.away_team_name}: ${awayStanding ? `${awayStanding.position}° posto, ${awayStanding.points} punti, ${awayStanding.playedGames} partite (${awayStanding.won}V-${awayStanding.draw}P-${awayStanding.lost}S), GF:${awayStanding.goalsFor} GS:${awayStanding.goalsAgainst}` : 'Dati non disponibili'}

## FORMA RECENTE (ultime 5 partite)
${fixture.home_team_name}: ${formStr(homeForm)}
${fixture.away_team_name}: ${formStr(awayForm)}

## SCONTRI DIRETTI STORICI (H2H)
${h2hStr}

## CONDIZIONI METEOROLOGICHE PREVISTE
${weatherStr}

## ISTRUZIONI DI ANALISI

Agisci come un Senior Data Scientist specializzato in modelli predittivi calcistici. 
Considera TUTTI i seguenti fattori nella tua analisi:

1. **FORZA RELATIVA**: Chi ha il vantaggio statistico oggettivo? Analizza i punti per partita, xG impliciti dai risultati, differenza reti.
2. **FATTORE CAMPO**: La squadra di casa ha storicamente un vantaggio. Considera la % di vittorie in casa vs trasferta dalla classifica.
3. **FORMA RECENTE**: Chi è in salita di forma? Chi ha mostrato solidità difensiva/attaccante nelle ultime uscite?
4. **VARIABILI H2H**: Storicamente come si scontrano queste squadre? Ci sono squadre "bestia nera"?
5. **CONDIZIONI METEOROLOGICHE**: Temperatura elevata favorisce chi gioca più lento; pioggia intensa riduce tecnica e favorisce squadre fisiche.
6. **STRESS DA CALENDARIO**: Partite ravvicinate, coppe europee (se applicabile), turni di coppa nazionali.
7. **FATTORI PSICOLOGICI E BLASONE**: Momenti di pressione, attese dei tifosi, periodi critici di stagione (inizio, fine, lotta retrocessione/Champions).
8. **OVER/UNDER e BTTS**: Basati su medie gol fatte/subite delle ultime 5 partite di entrambe le squadre.

Restituisci SOLO un JSON valido nel seguente formato, senza testo aggiuntivo:

{
  "prediction": "1 | X | 2 | 1X | X2 | Over 2.5 | Under 2.5",
  "confidence": <intero 0-100>,
  "home_win_prob": <numero 0-100>,
  "draw_prob": <numero 0-100>,
  "away_win_prob": <numero 0-100>,
  "expected_goals_home": <numero decimale>,
  "expected_goals_away": <numero decimale>,
  "over25_prob": <numero 0-100>,
  "btts_prob": <numero 0-100>,
  "risk_level": "BASSO | MEDIO | ALTO",
  "key_factors": [
    "Fattore chiave 1 (massimo 15 parole)",
    "Fattore chiave 2",
    "Fattore chiave 3",
    "Fattore chiave 4",
    "Fattore chiave 5"
  ],
  "analysis_text": "Analisi dettagliata di almeno 300 parole in italiano che spiega il ragionamento completo dietro il pronostico, includendo tutti i fattori sopra elencati. Sii preciso, usa i dati forniti, e spiega in modo giornalistico-analitico perché il modello ha scelto questo pronostico. NON inventare statistiche non fornite."
}`;
}

async function generatePredictionForFixture(fixture, standings) {
  console.log(`\n🔮 Analyzing: ${fixture.home_team_name} vs ${fixture.away_team_name}`);
  
  try {
    // Fetch dati paralleli
    const [homeForm, awayForm, h2h, weather] = await Promise.allSettled([
      footballFetch(`/teams/${fixture.home_team_id}/matches?status=FINISHED&limit=5`).then(d => 
        d.matches?.map(m => ({
          date: m.utcDate,
          isHome: m.homeTeam.id.toString() === fixture.home_team_id,
          goalsFor: m.homeTeam.id.toString() === fixture.home_team_id ? m.score?.fullTime?.home : m.score?.fullTime?.away,
          goalsAgainst: m.homeTeam.id.toString() === fixture.home_team_id ? m.score?.fullTime?.away : m.score?.fullTime?.home,
          result: m.score?.winner === 'HOME_TEAM' 
            ? (m.homeTeam.id.toString() === fixture.home_team_id ? 'W' : 'L')
            : m.score?.winner === 'AWAY_TEAM'
            ? (m.awayTeam.id.toString() === fixture.home_team_id ? 'W' : 'L')
            : 'D',
          opponent: m.homeTeam.id.toString() === fixture.home_team_id ? m.awayTeam.name : m.homeTeam.name
        }))
      ),
      footballFetch(`/teams/${fixture.away_team_id}/matches?status=FINISHED&limit=5`).then(d =>
        d.matches?.map(m => ({
          date: m.utcDate,
          isHome: m.homeTeam.id.toString() === fixture.away_team_id,
          goalsFor: m.homeTeam.id.toString() === fixture.away_team_id ? m.score?.fullTime?.home : m.score?.fullTime?.away,
          goalsAgainst: m.homeTeam.id.toString() === fixture.away_team_id ? m.score?.fullTime?.away : m.score?.fullTime?.home,
          result: m.score?.winner === 'HOME_TEAM' 
            ? (m.homeTeam.id.toString() === fixture.away_team_id ? 'W' : 'L')
            : m.score?.winner === 'AWAY_TEAM'
            ? (m.awayTeam.id.toString() === fixture.away_team_id ? 'W' : 'L')
            : 'D',
          opponent: m.homeTeam.id.toString() === fixture.away_team_id ? m.awayTeam.name : m.homeTeam.name
        }))
      ),
      footballFetch(`/teams/${fixture.home_team_id}/matches?status=FINISHED&limit=20`).then(d =>
        d.matches?.filter(m => 
          m.homeTeam.id.toString() === fixture.away_team_id || 
          m.awayTeam.id.toString() === fixture.away_team_id
        ).slice(0,5).map(m => ({
          date: m.utcDate,
          homeTeam: m.homeTeam.name,
          awayTeam: m.awayTeam.name,
          homeScore: m.score?.fullTime?.home,
          awayScore: m.score?.fullTime?.away
        }))
      ),
      getWeather(fixture.match_date, fixture.league_code)
    ]);

    const homeFormData = homeForm.status === 'fulfilled' ? homeForm.value : null;
    const awayFormData = awayForm.status === 'fulfilled' ? awayForm.value : null;
    const h2hData = h2h.status === 'fulfilled' ? h2h.value : [];
    const weatherData = weather.status === 'fulfilled' ? weather.value : null;

    console.log(`  📊 Form home: ${homeFormData?.map(f=>f.result).join(',') || 'N/A'}`);
    console.log(`  📊 Form away: ${awayFormData?.map(f=>f.result).join(',') || 'N/A'}`);
    console.log(`  🌦️ Weather: ${weatherData?.tempMax || 'N/A'}°C`);

    // Build prompt e chiama Gemini
    const prompt = buildPredictionPrompt(fixture, homeFormData, awayFormData, h2hData, standings, weatherData);
    
    console.log(`  🤖 Calling Gemini AI...`);
    const analysis = await geminiAnalyze(prompt);
    
    // Salva in DB
    await sql`
      INSERT INTO match_predictions (
        fixture_id, prediction, confidence,
        home_win_prob, draw_prob, away_win_prob,
        over25_prob, btts_prob,
        expected_goals_home, expected_goals_away,
        risk_level, key_factors, analysis_text,
        home_form, away_form, h2h_data, weather_data, standings_data,
        generated_at
      ) VALUES (
        ${fixture.id},
        ${analysis.prediction},
        ${analysis.confidence},
        ${analysis.home_win_prob},
        ${analysis.draw_prob},
        ${analysis.away_win_prob},
        ${analysis.over25_prob},
        ${analysis.btts_prob},
        ${analysis.expected_goals_home},
        ${analysis.expected_goals_away},
        ${analysis.risk_level},
        ${JSON.stringify(analysis.key_factors)},
        ${analysis.analysis_text},
        ${JSON.stringify(homeFormData)},
        ${JSON.stringify(awayFormData)},
        ${JSON.stringify(h2hData)},
        ${JSON.stringify(weatherData)},
        ${JSON.stringify(standings?.slice(0,10))},
        NOW()
      )
      ON CONFLICT (fixture_id) DO UPDATE SET
        prediction = EXCLUDED.prediction,
        confidence = EXCLUDED.confidence,
        home_win_prob = EXCLUDED.home_win_prob,
        draw_prob = EXCLUDED.draw_prob,
        away_win_prob = EXCLUDED.away_win_prob,
        over25_prob = EXCLUDED.over25_prob,
        btts_prob = EXCLUDED.btts_prob,
        expected_goals_home = EXCLUDED.expected_goals_home,
        expected_goals_away = EXCLUDED.expected_goals_away,
        risk_level = EXCLUDED.risk_level,
        key_factors = EXCLUDED.key_factors,
        analysis_text = EXCLUDED.analysis_text,
        home_form = EXCLUDED.home_form,
        away_form = EXCLUDED.away_form,
        h2h_data = EXCLUDED.h2h_data,
        weather_data = EXCLUDED.weather_data,
        standings_data = EXCLUDED.standings_data,
        generated_at = EXCLUDED.generated_at;
    `;

    console.log(`  ✅ Prediction saved: ${analysis.prediction} (${analysis.confidence}% confidence)`);
    return true;
  } catch(e) {
    console.error(`  ❌ Error generating prediction:`, e.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Match Prediction Generator Started');
  console.log('======================================\n');

  // Prendi tutte le fixture delle prossime 72h senza predizione o con predizione vecchia
  const { rows: fixtures } = await sql`
    SELECT f.*, p.generated_at as pred_date
    FROM match_fixtures f
    LEFT JOIN match_predictions p ON p.fixture_id = f.id
    WHERE f.match_date > NOW()
      AND f.match_date < NOW() + INTERVAL '10 days'
      AND f.status = 'SCHEDULED'
      AND (p.generated_at IS NULL OR p.generated_at < NOW() - INTERVAL '12 hours')
    ORDER BY f.match_date ASC
    LIMIT 30;
  `;

  if (fixtures.length === 0) {
    console.log('No fixtures pending analysis. Run fetch-fixtures.js first.');
    process.exit(0);
  }

  console.log(`Found ${fixtures.length} fixtures to analyze\n`);

  // Cache standings per campionato (evita troppe chiamate)
  const standingsCache = {};

  let success = 0, failed = 0;

  for (const fixture of fixtures) {
    if (!standingsCache[fixture.league_code]) {
      try {
        console.log(`📋 Fetching standings for ${fixture.league_name}...`);
        const data = await footballFetch(`/competitions/${fixture.league_code}/standings`);
        standingsCache[fixture.league_code] = data.standings?.[0]?.table?.map(t => ({
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
        })) || [];
      } catch(e) {
        console.warn(`Could not fetch standings for ${fixture.league_code}`);
        standingsCache[fixture.league_code] = [];
      }
    }

    const ok = await generatePredictionForFixture(fixture, standingsCache[fixture.league_code]);
    ok ? success++ : failed++;
    
    // Pausa per rispettare rate limits Gemini
    await sleep(3000);
  }

  console.log(`\n\n🏁 Analysis Complete!`);
  console.log(`✅ Success: ${success} | ❌ Failed: ${failed}`);
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
