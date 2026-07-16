const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const coaches = [
  { id: 'atalanta', name: 'Maurizio Sarri' },
  { id: 'bologna', name: 'Domenico Tedesco' },
  { id: 'cagliari', name: 'Fabio Pisacane' },
  { id: 'como', name: 'Cesc Fàbregas' },
  { id: 'fiorentina', name: 'Fabio Grosso' },
  { id: 'frosinone', name: 'Massimiliano Alvini' },
  { id: 'genoa', name: 'Daniele De Rossi' },
  { id: 'inter', name: 'Cristian Chivu' },
  { id: 'juventus', name: 'Luciano Spalletti' },
  { id: 'lazio', name: 'Gennaro Gattuso' },
  { id: 'lecce', name: 'Eusebio Di Francesco' },
  { id: 'milan', name: 'Ruben Amorim' },
  { id: 'monza', name: 'Ivan Jurić' },
  { id: 'napoli', name: 'Massimiliano Allegri' },
  { id: 'parma', name: 'Carlos Cuesta' },
  { id: 'roma', name: 'Gian Piero Gasperini' },
  { id: 'sassuolo', name: 'Alberto Aquilani' },
  { id: 'torino', name: 'Ignazio Abate' },
  { id: 'udinese', name: 'Kosta Runjaić' },
  { id: 'venezia', name: 'Giovanni Stroppa' }
];

async function main() {
  console.log("Inizio aggiornamento allenatori 2026/2027...");

  // 1. Aggiornamento Database Postgres
  if (process.env.POSTGRES_URL) {
    try {
      for (const coach of coaches) {
        // Controlla se esiste già un allenatore per la squadra
        const res = await sql`SELECT id FROM players WHERE team_id = ${coach.id} AND is_coach = true`;
        if (res.rowCount > 0) {
          // Aggiorna
          await sql`UPDATE players SET name = ${coach.name}, role = 'Allenatore' WHERE team_id = ${coach.id} AND is_coach = true`;
          console.log(`[DB] Aggiornato allenatore per ${coach.id}: ${coach.name}`);
        } else {
          // Inserisci
          await sql`INSERT INTO players (team_id, name, is_coach, role, squad_type) VALUES (${coach.id}, ${coach.name}, true, 'Allenatore', 'first')`;
          console.log(`[DB] Inserito nuovo allenatore per ${coach.id}: ${coach.name}`);
        }
      }
    } catch (e) {
      console.error("[DB] Errore DB Postgres:", e);
    }
  } else {
    console.warn("Nessun POSTGRES_URL trovato, skip DB update.");
  }

  // 2. Aggiornamento file JSON di fallback
  try {
    const jsonPath = path.join(__dirname, '..', 'src', 'data', 'deepSquads.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      for (const coach of coaches) {
        if (!data[coach.id]) {
          data[coach.id] = { firstTeam: { coach: { name: coach.name, role: 'Allenatore', module: '4-3-3' }, staff: [], players: [] } };
        } else {
          if (!data[coach.id].firstTeam) data[coach.id].firstTeam = {};
          if (!data[coach.id].firstTeam.coach) {
            data[coach.id].firstTeam.coach = { name: coach.name, role: 'Allenatore', module: '4-3-3' };
          } else {
            data[coach.id].firstTeam.coach.name = coach.name;
          }
        }
        console.log(`[JSON] Aggiornato JSON per ${coach.id}: ${coach.name}`);
      }
      
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
      console.log("File deepSquads.json aggiornato con successo.");
    }
  } catch (e) {
    console.error("[JSON] Errore aggiornamento file JSON:", e);
  }

  console.log("Aggiornamento completato!");
}

main();
