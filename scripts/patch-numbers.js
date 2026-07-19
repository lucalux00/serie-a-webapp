const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function patchNumbers() {
  try {
    const squadsPath = path.join(__dirname, '..', 'src', 'data', 'deepSquads.json');
    const allSquads = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));

    let updatedCount = 0;

    for (const [teamId, squadData] of Object.entries(allSquads)) {
      if (squadData.firstTeam && squadData.firstTeam.players) {
        for (const player of squadData.firstTeam.players) {
          const num = parseInt(player.number);
          if (!isNaN(num) && num > 0) {
            await sql`
              UPDATE players
              SET number = ${num}
              WHERE team_id = ${teamId} AND name = ${player.name} AND is_coach = false AND is_staff = false
            `;
            updatedCount++;
          }
        }
      }
      
      if (squadData.primavera && squadData.primavera.players) {
        for (const player of squadData.primavera.players) {
          const num = parseInt(player.number);
          if (!isNaN(num) && num > 0) {
            await sql`
              UPDATE players
              SET number = ${num}
              WHERE team_id = ${teamId} AND name = ${player.name} AND is_coach = false AND is_staff = false
            `;
            updatedCount++;
          }
        }
      }
    }

    console.log(`Updated ${updatedCount} player numbers successfully.`);
  } catch (error) {
    console.error('Error updating player numbers:', error);
  }
}

patchNumbers().then(() => process.exit(0)).catch(() => process.exit(1));
