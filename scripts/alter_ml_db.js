const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function alterTable() {
  try {
    console.log('Cancellazione e ricreazione tabella ml_predictions in corso...');
    
    // Droppiamo la tabella per ricrearla pulita con la nuova colonna
    await sql`DROP TABLE IF EXISTS ml_predictions;`;
    
    // Ricreiamo la tabella con la colonna competition
    await sql`
      CREATE TABLE ml_predictions (
        id VARCHAR(255) PRIMARY KEY,
        match_name VARCHAR(255) NOT NULL,
        competition VARCHAR(100) NOT NULL,
        pick VARCHAR(50) NOT NULL,
        odds NUMERIC(5,2) NOT NULL,
        match_date TIMESTAMP WITH TIME ZONE NOT NULL,
        confidence_score NUMERIC(5,2),
        algorithm_version VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('Tabella aggiornata con successo con la colonna competition!');
  } catch (error) {
    console.error('Errore durante aggiornamento tabella:', error);
  }
}

alterTable();
