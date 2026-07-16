const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const { rows } = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`;
    console.log(rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
