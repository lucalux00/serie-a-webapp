require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    const res = await sql`SELECT id, title, pub_date FROM news ORDER BY pub_date DESC LIMIT 5`;
    console.log('LATEST NEWS:');
    console.table(res.rows);

    const res2 = await sql`SELECT id, player, date FROM transfers ORDER BY id DESC LIMIT 5`;
    console.log('LATEST TRANSFERS:');
    console.table(res2.rows);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

run();
