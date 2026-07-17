const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = await db.connect();
  try {
    const res = await client.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `;
    console.log("Tables in DB:", res.rows);
    
    const countRes = await client.sql`SELECT count(*) FROM players`;
    console.log("Players count:", countRes.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
