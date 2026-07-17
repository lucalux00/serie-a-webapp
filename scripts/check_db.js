const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function checkDB() {
  try {
    const { rows } = await sql`SELECT * FROM ml_predictions`;
    console.log(`Trovate ${rows.length} righe nel database.`);
    if (rows.length > 0) {
        console.log(rows.slice(0, 2)); // Mostra le prime 2
    }
  } catch (e) {
    console.error(e);
  }
}
checkDB();
