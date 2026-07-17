const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = await db.connect();
  try {
    const res = await client.sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'fanta_rosters'`;
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
