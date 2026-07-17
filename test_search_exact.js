const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = await db.connect();
  try {
    const searchTerm = `%meret%`;
    const { rows } = await client.sql`
      SELECT name, role, team_id as team 
      FROM players 
      WHERE name ILIKE ${searchTerm} 
        AND is_coach = false 
        AND is_staff = false
      ORDER BY name ASC
      LIMIT 10
    `;
    console.log("SEARCH meret:", rows);

    const checkAll = await client.sql`SELECT name, is_coach, is_staff FROM players LIMIT 5`;
    console.log("SAMPLE:", checkAll.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
