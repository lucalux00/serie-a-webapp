const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = await db.connect();
  try {
    const payload = { userId: '1' }; // Mock user ID
    const res = await client.sql`
        INSERT INTO fanta_rosters (user_id, player_name, team_name, role)
        VALUES (${payload.userId}, 'Alex Meret Test', 'napoli', 'POR')
        ON CONFLICT (user_id, player_name) DO NOTHING
        RETURNING id, player_name as "playerName", team_name as "teamName", role
      `;
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
