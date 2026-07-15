const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envStr.match(/GEMINI_API_KEY="([^"]+)"/);
const GEMINI_API_KEY = keyMatch ? keyMatch[1] : null;

const name = "Lautaro Martinez";
const role = "ATT";
const team = "Inter";
const isCoach = false;
const isGk = false;

const prompt = `Sei l'assistente IA esperto mondiale di calcio per un'app di statistiche avanzate in stile Football Manager.
Devi restituire un JSON perfetto contenente dati iper-dettagliati e realistici (aggiornati o plausibili per la stagione corrente 2025/2026) per la seguente figura calcistica:
Nome: ${name}
Ruolo: ${role}
Squadra Attuale: ${team}
Tipo: ${isCoach ? 'Membro dello Staff / Allenatore' : 'Calciatore'}

La struttura del JSON deve essere ESATTAMENTE come questo template (riempi tutti i campi con valori realistici come stringhe o numeri a seconda del tipo indicato nel template):
{
  "name": "${name}",
  "isCoach": ${isCoach},
  "biografia": "Una descrizione biografica ricca e avvincente di almeno 4-5 frasi sulla sua carriera, stile, storia recente.",
  "caratteristiche": "Una descrizione molto dettagliata delle caratteristiche (fisiche, tattiche, tecniche) di almeno 3-4 frasi.",
  "anagrafica": {
    "dataNascita": "es. 15 Gennaio 1995",
    "luogoNascita": "es. Roma, Italia",
    "nazionalita": "es. Italia",
    "eta": 28,
    "altezza": "185 cm",
    "peso": "78 kg",
    "piede": "Destro"
  },
  "economia": {
    "stipendio": "es. €2.5M",
    "valoreMercato": "es. €35.0M",
    "scadenzaContratto": "es. 30 Giu 2027"
  },
  "stats": {
    "isGoalkeeper": ${isGk},
    "carriera": { "presenze": 250, "gol": 45 },
    "nazionale": { "presenze": 35, "gol": 5 },
    "squadraAttuale": { "nome": "${team || 'Sconosciuta'}", "presenze": 25, "gol": 3 },
    "stagioneCorrente": {
      "presenze": 12,
      "minutiGiocati": 1050
    },
    "ruoloSpeciale": {
      "Statistica 1": "Valore 1",
      "Statistica 2": "Valore 2",
      "Statistica 3": "Valore 3"
    },
    "coach": {
      "moduloPreferito": "es. 4-3-3",
      "partiteGestite": 150,
      "winRate": "55%",
      "trofeiVinti": 3
    }
  }
}

REGOLE:
- DEVI restituire un JSON valido.
- Se "isCoach" è false, il campo "coach" può avere valori di default o null, ma riempi accuratamente "ruoloSpeciale".
- Se "isCoach" è true, valorizza benissimo "coach" (moduloPreferito, partiteGestite, winRate, trofeiVinti) e metti "ruoloSpeciale" vuoto.
- Rispondi SOLO in formato JSON. Nessun backtick, nessun commento fuori dal JSON.`;

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.2, // Bassa temperatura per formattazione precisa e dati realistici
      response_mime_type: "application/json",
    }
  }),
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
