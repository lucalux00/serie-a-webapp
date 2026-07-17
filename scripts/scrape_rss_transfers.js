const { sql } = require('@vercel/postgres');
const Parser = require('rss-parser');
const { GoogleGenAI } = require('@google/genai');

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FEEDS = [
    'https://news.google.com/rss/search?q=calciomercato+serie+a+ufficiale&hl=it&gl=IT&ceid=IT:it',
    'https://news.google.com/rss/search?q=calciomercato+serie+a+trattativa&hl=it&gl=IT&ceid=IT:it'
];

async function syncTransfers() {
    console.log("🔄 Avvio sincronizzazione calciomercato RSS + Gemini...");
    
    if (!process.env.POSTGRES_URL) {
        console.error("❌ ERRORE: POSTGRES_URL non impostato.");
        process.exit(1);
    }
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ ERRORE: GEMINI_API_KEY non impostato.");
        process.exit(1);
    }

    let inserted = 0;
    try {
        const textsToAnalyze = [];
        for (const feedUrl of FEEDS) {
            console.log(`📡 Lettura feed: ${feedUrl}`);
            const feed = await parser.parseURL(feedUrl);
            const items = feed.items.slice(0, 15);
            for (const item of items) {
                if (item.title) textsToAnalyze.push(item.title);
            }
        }

        if (textsToAnalyze.length === 0) {
            console.log("Nessuna notizia trovata.");
            return;
        }

        console.log(`🤖 Invio ${textsToAnalyze.length} titoli a Gemini per estrazione...`);
        const prompt = `Ecco una lista di titoli di articoli di calciomercato:
${textsToAnalyze.join('\n')}

Estrai tutti i trasferimenti o le trattative (anche solo rumors) delle squadre di Serie A.
Ignora le notizie che non parlano di trasferimenti chiari o trattative tra giocatori e squadre.

Restituisci ESCLUSIVAMENTE un JSON array di oggetti con i seguenti campi:
- "player": nome del giocatore
- "team_id": l'ID della squadra coinvolta. Usa questi esatti ID: atalanta, bologna, cagliari, como, fiorentina, frosinone, genoa, inter, juventus, lazio, lecce, milan, monza, napoli, parma, roma, sassuolo, torino, udinese, venezia.
- "type": "Acquisto", "Cessione" o "Prestito"
- "other_team": la squadra di provenienza o destinazione (stringa libera)
- "status": "Ufficiale" se è un trasferimento concluso, altrimenti "Rumor"
- "fee": il costo o "N/D"

IMPORTANTE: Restituisci SOLO il JSON array. Niente formattazione markdown.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let jsonText = response.text.trim();
        if (jsonText.startsWith('```json')) jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

        const transfers = JSON.parse(jsonText);
        console.log(`📊 Gemini ha identificato ${transfers.length} trasferimenti/rumors.`);

        const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

        for (const t of transfers) {
            // Check if it already exists today to avoid duplicates
            const existing = await sql`
                SELECT id FROM transfers 
                WHERE player = ${t.player} AND team_id = ${t.team_id} AND type = ${t.type} 
                AND (status = ${t.status} OR status = 'Ufficiale')
                LIMIT 1
            `;

            if (existing.rows.length === 0) {
                // Remove any old rumor if an official one arrives
                if (t.status === 'Ufficiale') {
                     await sql`DELETE FROM transfers WHERE player = ${t.player} AND team_id = ${t.team_id} AND type = ${t.type} AND status = 'Rumor'`;
                }

                await sql`
                    INSERT INTO transfers (team_id, type, player, other_team, fee, date, status)
                    VALUES (${t.team_id}, ${t.type}, ${t.player}, ${t.other_team || 'N/D'}, ${t.fee || 'N/D'}, ${today}, ${t.status})
                `;
                console.log(`✅ Inserito: ${t.player} -> ${t.team_id} (${t.type} - ${t.status})`);
                inserted++;
            }
        }

        console.log(`✅ Sincronizzazione completata! ${inserted} nuovi record inseriti.`);
    } catch(e) {
        console.error("❌ Errore durante lo script:", e);
        process.exit(1);
    }
}

syncTransfers();
