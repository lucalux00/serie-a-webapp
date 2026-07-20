require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function check() {
  const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
  if (!FOOTBALL_API_KEY) throw new Error("Manca FOOTBALL_DATA_API_KEY");

  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  const dateFrom = today.toISOString().split('T')[0];
  const dateTo = threeDaysFromNow.toISOString().split('T')[0];

  console.log(`Fetching from ${dateFrom} to ${dateTo}`);

  const response = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&competitions=SA,PL,PD,BL1,CL`, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY }
  });

  const data = await response.json();
  let matches = data.matches || [];
  matches = matches.slice(0, 1); // Test with 1 match
  
  if (matches.length === 0) {
    console.log("No matches found in the API");
    return;
  }

  const m = matches[0];
  console.log('Match found:', m.homeTeam.name, m.awayTeam.name);

  // simulate gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-lite-latest",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `Sei un esperto analista di calcio.
Analizza: ${m.homeTeam.name} - ${m.awayTeam.name} (${m.competition.name}).
Genera un JSON:
{
  "quotes": [ { "type": "Esito Finale (1X2)", "pick": "1", "odds": 1.85 } ],
  "analysis": "<p>Test</p>"
}`;

  console.log("Calling Gemini...");
  const result = await model.generateContent(prompt);
  const geminiData = JSON.parse(result.response.text().trim());
  console.log("Gemini Success. Inserting into DB...");

  try {
    const query = sql`
      INSERT INTO daily_ai_predictions (match_id, home_team, away_team, match_date, competition, quotes, analysis)
      VALUES (${m.id}, ${m.homeTeam.name}, ${m.awayTeam.name}, ${m.utcDate}, ${m.competition.name}, ${JSON.stringify(geminiData.quotes)}, ${geminiData.analysis})
      ON CONFLICT (match_id) DO NOTHING
      RETURNING id
    `;
    console.log("Query:", query);
    const dbRes = await query;
    console.log("DB Insert success:", dbRes.rowCount);
  } catch (err) {
    console.error("DB Insert ERROR:", err);
  }
}

check().catch(console.error);
