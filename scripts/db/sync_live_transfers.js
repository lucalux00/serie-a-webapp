const { db } = require('@vercel/postgres');
const Parser = require('rss-parser');
require('dotenv').config({ path: '.env.local' });

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

const FEEDS = [
    'https://news.google.com/rss/search?q=calciomercato+serie+a+ufficiale&hl=it&gl=IT&ceid=IT:it'
];

async function syncTransfers() {
    console.log("🔄 Avvio sincronizzazione DEFINITIVA calciomercato da Google News RSS in tempo reale...");
    
    let client;
    try {
        client = await db.connect();
        
        await client.sql`TRUNCATE TABLE transfers RESTART IDENTITY`;
        console.log("✅ Tabella trasferimenti azzerata.");

        let inserted = 0;

        for (const feedUrl of FEEDS) {
            console.log(`📡 Lettura feed: ${feedUrl}`);
            const feed = await parser.parseURL(feedUrl);
            
            const items = feed.items.slice(0, 30);

            for (const item of items) {
                const title = item.title || "";
                
                let teamId = "seriea";
                if (title.toLowerCase().includes("juve")) teamId = "juventus";
                else if (title.toLowerCase().includes("milan")) teamId = "milan";
                else if (title.toLowerCase().includes("inter")) teamId = "inter";
                else if (title.toLowerCase().includes("napoli")) teamId = "napoli";
                else if (title.toLowerCase().includes("roma")) teamId = "roma";
                else if (title.toLowerCase().includes("lazio")) teamId = "lazio";
                else if (title.toLowerCase().includes("atalanta")) teamId = "atalanta";
                else if (title.toLowerCase().includes("fiorentina")) teamId = "fiorentina";
                else if (title.toLowerCase().includes("torino")) teamId = "torino";
                
                if (teamId === "seriea") continue;

                let type = "Trattativa";
                let status = "In Corso";
                if (title.toLowerCase().includes("ufficiale")) {
                    type = "Acquisto";
                    status = "Ufficiale";
                }

                const cleanTitle = title.split(' - ')[0]; // Rimuove il nome della testata giornalistica
                const playerStr = cleanTitle.substring(0, 90) + (cleanTitle.length > 90 ? "..." : "");
                const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

                await client.sql`
                    INSERT INTO transfers (team_id, type, player, other_team, fee, date, status)
                    VALUES (${teamId}, ${type}, ${playerStr}, 'Feed Live', 'N/D', ${today}, ${status})
                `;
                inserted++;
            }
        }

        console.log(`✅ Sincronizzazione completata! ${inserted} trattative/ufficialità REALI e NON INVENTATE inserite nel DB.`);

    } catch(e) {
        console.error("❌ Errore durante la sincronizzazione live:", e);
    } finally {
        if (client) await client.end();
    }
}

syncTransfers();
