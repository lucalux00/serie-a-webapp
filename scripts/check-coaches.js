require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function run() {
  const { rows } = await sql`SELECT team_id, name, role, is_coach, is_staff FROM players WHERE is_coach = true OR is_staff = true LIMIT 20;`;
  console.log('Coaches/Staff:', JSON.stringify(rows, null, 2));
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
