const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("ERRORE: GEMINI_API_KEY non trovata nel file .env.local");
    process.exit(1);
  }

  // Creazione tabella
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS player_stats_cache (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        team VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, team)
      )
    `;
    console.log("Tabella verificata/creata con successo.");
  } catch (e) {
    console.error("Errore creazione tabella:", e);
    process.exit(1);
  }

  const squadsPath = path.join(__dirname, '..', 'src', 'data', 'deepSquads.json');
  const allSquads = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));

  let count = 0;
  
  for (const teamId of Object.keys(allSquads)) {
    const team = allSquads[teamId];
    console.log(`\n=== Inizio elaborazione squadra: ${teamId} ===`);

    const playersToProcess = [
      ...team.firstTeam.players,
      ...team.firstTeam.staff,
      team.firstTeam.coach,
    ].filter(Boolean); // rimuove null/undefined

    for (const player of playersToProcess) {
      if (!player.name) continue;

      // Check se esiste già
      try {
        const { rows } = await sql`SELECT id FROM player_stats_cache WHERE name = ${player.name} AND team = ${teamId}`;
        if (rows.length > 0) {
          console.log(`[SKIP] ${player.name} (${teamId}) - Già nel DB`);
          continue;
        }
      } catch (e) {
        console.error("DB Check error:", e);
      }

      console.log(`[FETCH] Generazione dati per ${player.name} (${teamId})...`);
      
      const isCoach = player.is_coach || player.role?.toLowerCase() === 'allenatore';
      const isGk = player.role?.toLowerCase() === 'por';

      const prompt = `Agisci come un database statistico e finanziario calcistico aggiornato al 2026.
      RESTITUISCI SOLO ED ESCLUSIVAMENTE UN OGGETTO JSON. Nessun altro testo prima o dopo. Nessun commento.
      Genera il profilo iper-realistico per il ${isCoach ? 'manager/allenatore' : 'calciatore'}: ${player.name} (${player.role || 'Allenatore'}) della squadra ${teamId}.
      (I dati devono essere coerenti per il 2026).
      Usa la seguente struttura JSON (e nient'altro):

      {
        "isCoach": ${isCoach},
        "biografia": "Testo emozionante e professionale",
        "caratteristiche": "Punti di forza tattici/tecnici",
        "anagrafica": { "dataNascita": "", "luogoNascita": "", "nazionalita": "", "eta": 0, "altezza": "cm", "peso": "kg", "piede": "" },
        "economia": { "stipendio": "€X.XM", "valoreMercato": "€X.XM", "scadenzaContratto": "Giugno 20XX" },
        "palmares": [ { "nome": "Trofeo", "anno": "20XX", "squadra": "Nome Team" } ],
        "stats": {
          "isGoalkeeper": ${isGk},
          "carriera": { "presenze": 0, "gol": 0 },
          "nazionale": { "presenze": 0, "gol": 0 },
          "squadraAttuale": { "nome": "${teamId}", "presenze": 0, "gol": 0 },
          "stagioneCorrente": { "presenze": 0, "minutiGiocati": 0 },
          "ruoloSpeciale": { "Metric 1": "Valore", "Metric 2": "Valore", "Metric 3": "Valore" },
          "coach": null
        }
      }`;

      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
          }),
        });

        if (res.status === 429) {
          console.warn(`[RATE LIMIT] in attesa per 5 secondi...`);
          await delay(5000);
          continue; 
        }

        if (!res.ok) {
          console.error(`[ERRORE API] ${res.status} per ${player.name}`);
          await delay(2000);
          continue;
        }

        const data = await res.json();
        let jsonText = data.candidates[0].content.parts[0].text;
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        const result = JSON.parse(jsonText);

        await sql`
          INSERT INTO player_stats_cache (name, team, data)
          VALUES (${player.name}, ${teamId}, ${JSON.stringify(result)})
          ON CONFLICT (name, team) DO UPDATE SET data = ${JSON.stringify(result)}
        `;
        
        console.log(`[SUCCESS] ${player.name} salvato.`);
        count++;

        // Rispetta i limiti Google (15 RPM = 1 ogni 4 secondi)
        await delay(4500);

      } catch (err) {
        console.error(`[CATCH ERRORE] per ${player.name}:`, err.message);
        await delay(2000);
      }
    }
  }

  console.log(`\nFinito! Inseriti/Aggiornati ${count} giocatori nel Database.`);
  process.exit(0);
}

run();
