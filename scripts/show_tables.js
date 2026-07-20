require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');
async function run() {
  try {
    const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
