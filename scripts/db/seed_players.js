const { db } = require('@vercel/postgres');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const players = [
    // Napoli
    { team_id: 'napoli', name: 'Alex Meret', role: 'POR', is_coach: false, is_staff: false },
    { team_id: 'napoli', name: 'Giovanni Di Lorenzo', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'napoli', name: 'Amir Rrahmani', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'napoli', name: 'Stanislav Lobotka', role: 'CEN', is_coach: false, is_staff: false },
    { team_id: 'napoli', name: 'Khvicha Kvaratskhelia', role: 'CEN', is_coach: false, is_staff: false },
    { team_id: 'napoli', name: 'Victor Osimhen', role: 'ATT', is_coach: false, is_staff: false },
    // Inter
    { team_id: 'inter', name: 'Yann Sommer', role: 'POR', is_coach: false, is_staff: false },
    { team_id: 'inter', name: 'Alessandro Bastoni', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'inter', name: 'Federico Dimarco', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'inter', name: 'Nicolò Barella', role: 'CEN', is_coach: false, is_staff: false },
    { team_id: 'inter', name: 'Hakan Calhanoglu', role: 'CEN', is_coach: false, is_staff: false },
    { team_id: 'inter', name: 'Lautaro Martinez', role: 'ATT', is_coach: false, is_staff: false },
    { team_id: 'inter', name: 'Marcus Thuram', role: 'ATT', is_coach: false, is_staff: false },
    // Milan
    { team_id: 'milan', name: 'Mike Maignan', role: 'POR', is_coach: false, is_staff: false },
    { team_id: 'milan', name: 'Theo Hernandez', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'milan', name: 'Fikayo Tomori', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'milan', name: 'Rafael Leao', role: 'ATT', is_coach: false, is_staff: false },
    { team_id: 'milan', name: 'Christian Pulisic', role: 'CEN', is_coach: false, is_staff: false },
    { team_id: 'milan', name: 'Ruben Loftus-Cheek', role: 'CEN', is_coach: false, is_staff: false },
    // Juve
    { team_id: 'juventus', name: 'Wojciech Szczesny', role: 'POR', is_coach: false, is_staff: false },
    { team_id: 'juventus', name: 'Bremer', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'juventus', name: 'Danilo', role: 'DIF', is_coach: false, is_staff: false },
    { team_id: 'juventus', name: 'Adrien Rabiot', role: 'CEN', is_coach: false, is_staff: false },
    { team_id: 'juventus', name: 'Federico Chiesa', role: 'ATT', is_coach: false, is_staff: false },
    { team_id: 'juventus', name: 'Dusan Vlahovic', role: 'ATT', is_coach: false, is_staff: false }
];

async function seed() {
  const client = await db.connect();
  console.log("Seeding players into database...");
  try {
    for (const p of players) {
        await client.sql`
            INSERT INTO players (team_id, name, role, is_coach, is_staff)
            VALUES (${p.team_id}, ${p.name}, ${p.role}, ${p.is_coach}, ${p.is_staff})
        `;
    }
    console.log("Seed completed successfully!");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
seed();
