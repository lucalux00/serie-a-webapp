const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { sql } = require('@vercel/postgres');

dotenv.config({ path: '.env.local' });
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// mapping from our ID to football-data ID
const LEAGUE_CODE = 'SA';

async function run() {
  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${LEAGUE_CODE}/teams`, {
      headers: { 'X-Auth-Token': API_KEY }
    });
    if (!res.ok) throw new Error('Failed to fetch teams');
    const data = await res.json();
    
    // We also need the local teams to map the IDs
    const teamsPath = path.join(__dirname, '../src/data/teams.ts');
    let content = fs.readFileSync(teamsPath, 'utf8');
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    const ourTeams = JSON.parse(jsonString);

    let count = 0;
    
    for (const apiTeam of data.teams) {
      if (!apiTeam.coach || !apiTeam.coach.name) continue;
      
      const match = ourTeams.find(ourTeam => {
        if (ourTeam.league !== 'A') return false;
        const ourName = ourTeam.name.toLowerCase().replace(/ f\.| fc| ac| as| ss/g, '').trim();
        const apiName = apiTeam.name.toLowerCase().replace(/ fc| ac| as| ss/g, '').trim();
        const apiShort = (apiTeam.shortName || '').toLowerCase().replace(/ fc| ac| as| ss/g, '').trim();
        return apiName.includes(ourName) || apiShort.includes(ourName) || ourName.includes(apiShort);
      });

      if (match) {
        const coachName = apiTeam.coach.name;
        // Check if exists
        const { rows } = await sql`SELECT id FROM players WHERE name = ${coachName} AND team_id = ${match.id}`;
        if (rows.length === 0) {
          await sql`
            INSERT INTO players (
              name, team_id, number, nationality, 
              date_of_birth, position, role, 
              is_coach, is_staff, created_at, updated_at
            ) VALUES (
              ${coachName}, ${match.id}, null, ${apiTeam.coach.nationality || 'Sconosciuta'},
              ${apiTeam.coach.dateOfBirth || null}, 'Allenatore', 'Allenatore',
              true, false, NOW(), NOW()
            )
          `;
          console.log(`Inserted coach ${coachName} for ${match.name}`);
          count++;
        } else {
           // Update it to make sure is_coach is true
           await sql`UPDATE players SET is_coach = true, role = 'Allenatore', position = 'Allenatore' WHERE id = ${rows[0].id}`;
           console.log(`Updated coach ${coachName} for ${match.name}`);
        }
      }
    }
    
    console.log(`Done! Coaches inserted/updated: ${count}`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
