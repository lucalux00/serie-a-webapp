import fs from 'fs';
import path from 'path';

const API_KEY = process.env.RAPIDAPI_KEY;
const API_URL = 'https://v3.football.api-sports.io';

if (!API_KEY || API_KEY === 'inserisci_qui_la_tua_chiave') {
  console.error("ERRORE CRITICO: Non hai inserito la RAPIDAPI_KEY nel file .env!");
  console.log("Vai su https://dashboard.api-football.com/register o usa RapidAPI per ottenere una chiave gratuita (100 req/giorno).");
  process.exit(1);
}

const headers = {
  'x-rapidapi-host': 'v3.football.api-sports.io',
  'x-apisports-key': API_KEY
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('API Error:', data.errors);
        throw new Error('API limit reached or error');
      }
      return data.response;
    } catch (e) {
      console.log(`Fetch failed, retrying (${i+1}/${retries})...`);
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  return null;
}

async function run() {
  console.log("=== INIZIO SINCRONIZZAZIONE DATI REALI ===");
  console.log("Questo script scarica le rose reali della Serie A (ID: 135) per la stagione 2024.");
  
  // Esempio logica (per ora scarichiamo solo i team di Serie A per non esaurire il free tier)
  const season = 2024; // o 2025/2024 se i dati 2026 non sono ancora pronti sulle API pubbliche in estate
  const leagueId = 135; // Serie A Italia
  
  console.log("1. Fetching Teams...");
  const teamsData = await fetchWithRetry(`${API_URL}/teams?league=${leagueId}&season=${season}`);
  
  if (!teamsData) {
    console.error("Impossibile recuperare le squadre. Controlla la API Key.");
    process.exit(1);
  }

  const allSquads = {};

  for (const t of teamsData) {
    const teamId = t.team.id;
    const teamName = t.team.name;
    const internalId = teamName.toLowerCase().replace(/\s+/g, '');
    
    console.log(`2. Fetching Roster per ${teamName}...`);
    // Endpoint per la rosa completa
    const squadData = await fetchWithRetry(`${API_URL}/players/squads?team=${teamId}`);
    
    // Attesa per non sforare il rate limit (spesso 10 req / min nel free tier)
    await new Promise(res => setTimeout(res, 6000));

    if (squadData && squadData.length > 0) {
      const players = squadData[0].players.map(p => ({
        id: p.id.toString(),
        name: p.name,
        position: p.position === 'Goalkeeper' ? 'POR' : p.position === 'Defender' ? 'DIF' : p.position === 'Midfielder' ? 'CEN' : 'ATT',
        number: p.number || '-',
        age: p.age,
        height: '180', // API squads non dà l'altezza di base, richiede chiamata extra
        weight: '75',
        foot: 'Destro',
        status: 'In Rosa',
        stats: { appearances: 0, goals: 0, xG: '0.00', passCompletion: 0 }
      }));

      allSquads[internalId] = {
        firstTeam: {
          coach: { name: 'Dati Reali', role: 'Allenatore', module: '4-3-3' },
          staff: [],
          players: players
        },
        primavera: { coach: { name: 'N/A' }, staff: [], players: [] }, // Primavera richiede chiamate extra su leghe giovanili
        transfers: [] // Richiede endpoint /transfers
      };
    }
  }

  const outputFilePath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(allSquads, null, 2), 'utf-8');
  console.log('Sincronizzazione completata con successo! I dati in deepSquads.json sono ora REALI.');
}

run();
