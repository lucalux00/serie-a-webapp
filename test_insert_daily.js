require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');

async function test() {
  try {
    const matchId = 12345;
    const homeTeam = 'Inter';
    const awayTeam = 'Milan';
    const matchDate = '2024-05-18T16:00:00Z';
    const competition = 'Serie A';
    const quotes = [{pick: '1', odds: 1.8}];
    const analysis = '<p>Test</p>';
    
    console.log('Inserting...');
    const res = await sql`
      INSERT INTO daily_ai_predictions (match_id, home_team, away_team, match_date, competition, quotes, analysis)
      VALUES (${matchId}, ${homeTeam}, ${awayTeam}, ${matchDate}, ${competition}, ${JSON.stringify(quotes)}, ${analysis})
      ON CONFLICT (match_id) DO NOTHING
      RETURNING id
    `;
    console.log('Success:', res.rows);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
test();
