const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const SERIE_A_COACHES = {
  "atalanta": "Gian Piero Gasperini",
  "bologna": "Vincenzo Italiano",
  "cagliari": "Davide Nicola",
  "como": "Cesc Fàbregas",
  "fiorentina": "Raffaele Palladino",
  "frosinone": "Eusebio Di Francesco", // 2026 note: might be relegated, let's just insert anyway
  "genoa": "Alberto Gilardino",
  "inter": "Simone Inzaghi",
  "juventus": "Thiago Motta",
  "lazio": "Marco Baroni",
  "lecce": "Luca Gotti",
  "milan": "Paulo Fonseca",
  "monza": "Alessandro Nesta",
  "napoli": "Antonio Conte",
  "parma": "Fabio Pecchia",
  "roma": "Daniele De Rossi",
  "sassuolo": "Alessio Dionisi", // just placeholders for some
  "torino": "Paolo Vanoli",
  "udinese": "Kosta Runjaic",
  "venezia": "Eusebio Di Francesco"
};

async function run() {
  try {
    for (const [teamId, coachName] of Object.entries(SERIE_A_COACHES)) {
      const { rows } = await sql`SELECT id FROM players WHERE name = ${coachName} AND team_id = ${teamId}`;
      if (rows.length === 0) {
        await sql`
          INSERT INTO players (
            name, team_id, number, role, 
            is_coach, is_staff
          ) VALUES (
            ${coachName}, ${teamId}, null, 'Allenatore',
            true, false
          )
        `;
        console.log(`Inserted coach ${coachName} for ${teamId}`);
      } else {
         await sql`UPDATE players SET is_coach = true, role = 'Allenatore' WHERE id = ${rows[0].id}`;
         console.log(`Updated coach ${coachName} for ${teamId}`);
      }
    }
    console.log("Done inserting hardcoded coaches.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
