require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await sql`ALTER TABLE transfers ADD COLUMN salary VARCHAR(255);`;
    console.log('Column salary added successfully');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('Column salary already exists');
    } else {
      console.error(e);
    }
  }
  process.exit();
}
run();
