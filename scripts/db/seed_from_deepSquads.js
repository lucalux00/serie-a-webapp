const { db } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    const client = await db.connect();
    console.log("Connesso al DB Vercel Postgres.");
    
    try {
        console.log("Eliminazione vecchi giocatori...");
        await client.sql`TRUNCATE TABLE players RESTART IDENTITY`;

        console.log("Lettura file locale deepSquads.json...");
        const squadsPath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
        const data = fs.readFileSync(squadsPath, 'utf8');
        const allSquads = JSON.parse(data);

        let inserted = 0;

        for (const [teamId, teamData] of Object.entries(allSquads)) {
            const players = teamData.firstTeam?.players || [];
            
            for (const player of players) {
                if(!player.name || !player.position) continue;
                
                const role = player.position.toUpperCase().substring(0, 3);
                
                await client.sql`
                    INSERT INTO players (team_id, name, role, is_coach, is_staff)
                    VALUES (${teamId}, ${player.name}, ${role}, false, false)
                `;
                inserted++;
            }
            
            // Add coach if available
            const coach = teamData.firstTeam?.coach;
            if (coach && coach.name && coach.name !== 'Dati Reali') {
                await client.sql`
                    INSERT INTO players (team_id, name, role, is_coach, is_staff)
                    VALUES (${teamId}, ${coach.name}, 'ALL', true, false)
                `;
                inserted++;
            }
        }
        
        console.log(`✅ Inseriti ${inserted} giocatori completi da deepSquads.json.`);

        const res = await client.sql`SELECT count(*) FROM players`;
        console.log("VERIFICA COUNT DOPO INSERT:", res.rows[0].count);

    } catch(e) {
        console.error("Errore fatale:", e);
    } finally {
        await client.end();
    }
}

seed();
