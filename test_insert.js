require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');

async function test() {
  try {
    const matchId = "test_match_123";
    const analysis = "<p>Test analysis</p>";
    console.log("Attempting insert...");
    const res = await sql`
      INSERT INTO ml_explanations (match_id, analysis)
      VALUES (${matchId}, ${analysis})
      ON CONFLICT (match_id) DO NOTHING
    `;
    console.log("Success:", res);
  } catch (e) {
    console.error("Insert error:", e);
  }
}
test();
