require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transfers'`;
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
run();
