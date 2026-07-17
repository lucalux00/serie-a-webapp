const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function setupFeedbackDB() {
  try {
    console.log('Aggiornamento schema database per il Continuous Learning...');
    
    await sql`ALTER TABLE ml_predictions ADD COLUMN IF NOT EXISTS actual_result VARCHAR(50);`;
    await sql`ALTER TABLE ml_predictions ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS ml_team_weights (
        team_name VARCHAR(255) PRIMARY KEY,
        competition VARCHAR(100) NOT NULL,
        form_rating NUMERIC(5,2) DEFAULT 1.0, -- Moltiplicatore di forma: > 1 se over-performa, < 1 se under-performa
        historical_accuracy NUMERIC(5,2) DEFAULT 0.5,
        matches_analyzed INTEGER DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('Schema aggiornato con successo!');
  } catch (error) {
    console.error('Errore durante aggiornamento tabella:', error);
  }
}

setupFeedbackDB();
