require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');
async function run() {
  try {
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'live';`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published';`;
    await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS snippet TEXT;`;
    console.log('Columns added');
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
