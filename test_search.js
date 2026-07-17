const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = await db.connect();
  try {
    const resP = await client.sql`SELECT count(*) FROM players`;
    console.log("PLAYERS COUNT:", resP.rows[0].count);

    const resT = await client.sql`SELECT count(*) FROM transfers`;
    console.log("TRANSFERS COUNT:", resT.rows[0].count);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
