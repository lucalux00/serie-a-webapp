const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function checkDB() {
  try {
    const { rows } = await sql`SELECT id, match_name, competition FROM ml_predictions LIMIT 5`;
    console.log(rows);
  } catch (e) {
    console.error(e);
  }
}
checkDB();
