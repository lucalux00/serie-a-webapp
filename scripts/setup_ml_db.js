const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function createTable() {
  try {
    console.log('Creazione tabella ml_predictions in corso...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS ml_predictions (
        id VARCHAR(255) PRIMARY KEY,
        match_name VARCHAR(255) NOT NULL,
        pick VARCHAR(50) NOT NULL,
        odds NUMERIC(5,2) NOT NULL,
        match_date TIMESTAMP WITH TIME ZONE NOT NULL,
        confidence_score NUMERIC(5,2),
        algorithm_version VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('Tabella ml_predictions creata o già esistente.');
  } catch (error) {
    console.error('Errore:', error);
  }
}

createTable();
