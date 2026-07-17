const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function setupFantacalcio() {
  const client = await db.connect();
  console.log("Connesso a Vercel Postgres.");

  try {
    console.log("Creazione tabelle Fantacalcio...");

    // 1. Calendario Giornate
    await client.sql`
      CREATE TABLE IF NOT EXISTS fanta_matchdays (
        matchday INTEGER PRIMARY KEY,
        is_active BOOLEAN DEFAULT false,
        is_completed BOOLEAN DEFAULT false
      );
    `;

    // Initialize 38 matchdays if empty
    const checkMatchdays = await client.sql`SELECT count(*) FROM fanta_matchdays`;
    if (parseInt(checkMatchdays.rows[0].count) === 0) {
      console.log("Inizializzazione 38 giornate...");
      for (let i = 1; i <= 38; i++) {
        await client.sql`
          INSERT INTO fanta_matchdays (matchday, is_active, is_completed) 
          VALUES (${i}, ${i === 1 ? true : false}, false)
        `;
      }
    }

    // 2. Formazioni
    await client.sql`
      CREATE TABLE IF NOT EXISTS fanta_lineups (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        matchday INTEGER NOT NULL REFERENCES fanta_matchdays(matchday),
        player_name VARCHAR(255) NOT NULL,
        team_name VARCHAR(255),
        role VARCHAR(10) NOT NULL,
        position_type VARCHAR(20) NOT NULL, -- 'titolare' o 'panchina'
        bench_order INTEGER, -- da 1 a 7 per le riserve, NULL per i titolari
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, matchday, player_name)
      );
    `;

    // 3. Voti Giocatori
    await client.sql`
      CREATE TABLE IF NOT EXISTS fanta_player_votes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL, -- Permettiamo voti custom per utente
        matchday INTEGER NOT NULL REFERENCES fanta_matchdays(matchday),
        player_name VARCHAR(255) NOT NULL,
        base_vote NUMERIC(4,2),
        bonus_malus NUMERIC(4,2),
        final_vote NUMERIC(4,2),
        is_manual_override BOOLEAN DEFAULT false,
        UNIQUE(user_id, matchday, player_name)
      );
    `;

    console.log("Tabelle create con successo!");

  } catch (error) {
    console.error("Errore durante il setup:", error);
  } finally {
    await client.end();
  }
}

setupFantacalcio();
