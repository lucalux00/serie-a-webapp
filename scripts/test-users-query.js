const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const { rows } = await sql`SELECT id, name, email, favorite_team FROM users`;
    console.log(rows);
    process.exit(0);
  } catch (e) {
    console.error("DB Error:", e);
    process.exit(1);
  }
}

run();
