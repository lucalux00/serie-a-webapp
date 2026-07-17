const { db } = require('@vercel/postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    const client = await db.connect();
    console.log("Connesso al DB Vercel Postgres per i transfers.");
    
    try {
        console.log("Eliminazione vecchi transfers...");
        await client.sql`TRUNCATE TABLE transfers RESTART IDENTITY`;

        console.log("Lettura file locale transfers_2026.json...");
        const data = fs.readFileSync('transfers_2026.json', 'utf8');
        const transfers = JSON.parse(data);

        let inserted = 0;
        for (const tr of transfers) {
            await client.sql`
                INSERT INTO transfers (team_id, type, player, other_team, fee, date, status)
                VALUES (${tr.team_id}, ${tr.type}, ${tr.player}, ${tr.otherTeam}, ${tr.fee}, ${tr.date}, ${tr.status})
            `;
            inserted++;
        }
        console.log(`✅ Inseriti ${inserted} trasferimenti aggiornati a Luglio 2026.`);

    } catch(e) {
        console.error("Errore fatale:", e);
    } finally {
        await client.end();
    }
}

seed();
