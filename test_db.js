const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = await db.connect();
  try {
    const res = await client.sql`SELECT count(*) FROM players`;
    console.log("Players count:", res.rows[0]);
    
    const searchRes = await client.sql`SELECT name FROM players LIMIT 5`;
    console.log("Sample players:", searchRes.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
