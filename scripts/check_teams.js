require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkTeams() {
  const { rows } = await sql`SELECT id, name FROM teams`;
  console.log(rows);
}
checkTeams();
