const { db } = require('@vercel/postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    const client = await db.connect();
    console.log("Connesso al DB Vercel Postgres.");
    
    try {
        console.log("Eliminazione vecchi giocatori...");
        await client.sql`TRUNCATE TABLE players RESTART IDENTITY`;

        console.log("Lettura file locale rosters_2026.json...");
        const data = fs.readFileSync('rosters_2026.json', 'utf8');
        const roster = JSON.parse(data);

        let inserted = 0;
        for (const player of roster) {
            if(!player.name || !player.role) continue;
            
            const role = player.role.toUpperCase().substring(0, 3);
            const is_coach = player.is_coach || false;
            const is_staff = player.is_staff || false;
            
            await client.sql`
                INSERT INTO players (team_id, name, role, is_coach, is_staff)
                VALUES (${player.team_id.toLowerCase()}, ${player.name}, ${role}, ${is_coach}, ${is_staff})
            `;
            inserted++;
        }
        console.log(`✅ Inseriti ${inserted} giocatori aggiornati a Luglio 2026.`);

        const res = await client.sql`SELECT count(*) FROM players`;
        console.log("VERIFICA COUNT DOPO INSERT:", res.rows[0].count);

    } catch(e) {
        console.error("Errore fatale:", e);
    } finally {
        await client.end();
    }
}

seed();
