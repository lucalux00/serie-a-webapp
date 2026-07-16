const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function createTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS won_predictions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        matches JSONB NOT NULL,
        total_odds DECIMAL(10, 2) NOT NULL,
        win_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Table 'won_predictions' created successfully.");
  } catch (error) {
    console.error("Error creating table:", error);
  }
}

createTable();
