const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("Creazione tabelle Fase 2...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS fanta_rosters (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        player_name VARCHAR(100) NOT NULL,
        team_name VARCHAR(100),
        role VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, player_name)
      );
    `;
    console.log("Tabella fanta_rosters creata.");

    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Tabella push_subscriptions creata.");
  } catch (err) {
    console.error("Errore DB:", err);
  }
}

main();
