import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const TEAMS = [
  { id: 'atalanta', wikiUrl: 'https://it.wikipedia.org/wiki/Atalanta_Bergamasca_Calcio' },
  { id: 'bologna', wikiUrl: 'https://it.wikipedia.org/wiki/Bologna_Football_Club_1909' },
  { id: 'cagliari', wikiUrl: 'https://it.wikipedia.org/wiki/Cagliari_Calcio' },
  { id: 'como', wikiUrl: 'https://it.wikipedia.org/wiki/Como_1907' },
  { id: 'fiorentina', wikiUrl: 'https://it.wikipedia.org/wiki/ACF_Fiorentina' },
  { id: 'frosinone', wikiUrl: 'https://it.wikipedia.org/wiki/Frosinone_Calcio' },
  { id: 'genoa', wikiUrl: 'https://it.wikipedia.org/wiki/Genoa_Cricket_and_Football_Club' },
  { id: 'inter', wikiUrl: 'https://it.wikipedia.org/wiki/Football_Club_Internazionale_Milano' },
  { id: 'juventus', wikiUrl: 'https://it.wikipedia.org/wiki/Juventus_Football_Club' },
  { id: 'lazio', wikiUrl: 'https://it.wikipedia.org/wiki/Societ%C3%A0_Sportiva_Lazio' },
  { id: 'lecce', wikiUrl: 'https://it.wikipedia.org/wiki/Unione_Sportiva_Lecce' },
  { id: 'milan', wikiUrl: 'https://it.wikipedia.org/wiki/Associazione_Calcio_Milan' },
  { id: 'monza', wikiUrl: 'https://it.wikipedia.org/wiki/Associazione_Calcio_Monza' },
  { id: 'napoli', wikiUrl: 'https://it.wikipedia.org/wiki/Societ%C3%A0_Sportiva_Calcio_Napoli' },
  { id: 'parma', wikiUrl: 'https://it.wikipedia.org/wiki/Parma_Calcio_1913' },
  { id: 'roma', wikiUrl: 'https://it.wikipedia.org/wiki/Associazione_Sportiva_Roma' },
  { id: 'sassuolo', wikiUrl: 'https://it.wikipedia.org/wiki/Unione_Sportiva_Sassuolo_Calcio' },
  { id: 'torino', wikiUrl: 'https://it.wikipedia.org/wiki/Torino_Football_Club' },
  { id: 'udinese', wikiUrl: 'https://it.wikipedia.org/wiki/Udinese_Calcio' },
  { id: 'venezia', wikiUrl: 'https://it.wikipedia.org/wiki/Venezia_Football_Club' },
  // ... per la demo Github Actions inseriamo le prime 20. Le altre avranno il fallback sicuro.
];

// Funzione deterministica per generare statistiche basate sul nome
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function generateStatsForPlayer(name, position, age) {
  const seed = hashString(name);
  const isGoalie = position === 'POR';
  
  // Gol in carriera (ATT fanno più gol, DIF meno)
  let careerGoals = 0;
  if (!isGoalie) {
    const multiplier = position === 'ATT' ? 8 : position === 'CEN' ? 3 : 1;
    careerGoals = Math.floor((seed % 30) * multiplier * (age / 25));
  }

  return {
    appearances: (seed % 50) + (age * 10) - 150,
    goals: isGoalie ? 0 : Math.floor((seed % 10) * (age / 25)),
    careerGoals: careerGoals > 0 ? careerGoals : 0,
    trophies: Math.floor((seed % 100) / 15), // da 0 a 6 trofei in media
    xG: isGoalie ? '0.00' : ((seed % 15) + Math.random()).toFixed(2),
    passCompletion: 70 + (seed % 25)
  };
}

async function scrapeTeam(team) {
  console.log(`Scraping ${team.id} da Wikipedia...`);
  try {
    const res = await fetch(team.wikiUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let coachName = 'Allenatore';
    // OVERRIDE MANUALE 2026: L'utente ha specificato Allegri al Napoli
    if (team.id === 'napoli') {
      coachName = 'Massimiliano Allegri';
    } else {
      // Tenta di estrarre dal box informativo di Wikipedia (spesso riga con "Allenatore")
      $('tr').each((i, el) => {
        const thText = $(el).find('th').text().trim();
        if (thText.toLowerCase() === 'allenatore') {
          coachName = $(el).find('td').text().replace(/\[.*?\]/g, '').trim();
        }
      });
    }

    const players = [];
    // Cerca la prima tabella che assomiglia a una Rosa (N., Ruolo, Giocatore)
    const tables = $('table.wikitable');
    let rosaTable = null;
    
    tables.each((i, table) => {
      const text = $(table).text().toLowerCase();
      if (text.includes('ruolo') && (text.includes('giocatore') || text.includes('calciatore'))) {
        rosaTable = table;
        return false; // break loop
      }
    });

    if (rosaTable) {
      $(rosaTable).find('tr').each((i, row) => {
        const colTexts = [];
        $(row).find('td, th').each((j, col) => {
          colTexts.push($(col).text().replace(/\n/g, '').replace(/\[.*?\]/g, '').trim());
        });
        
        if (colTexts.length >= 3) {
          const numberText = colTexts[0];
          const number = parseInt(numberText) || 0;
          
          let roleRaw = '';
          let name = '';
          
          // Trova la colonna del ruolo
          for (let j = 0; j < colTexts.length; j++) {
            const txt = colTexts[j].toLowerCase();
            if (['p', 'por', 'd', 'dif', 'c', 'cen', 'a', 'att'].includes(txt)) {
              roleRaw = txt;
              // Il nome è il primo testo non vuoto dopo il ruolo
              for (let k = j + 1; k < colTexts.length; k++) {
                if (colTexts[k].length > 2) {
                  name = colTexts[k];
                  break;
                }
              }
              break;
            }
          }

          let position = 'CEN';
          if (roleRaw.includes('p') || roleRaw.includes('por')) position = 'POR';
          if (roleRaw.includes('d') || roleRaw.includes('dif')) position = 'DIF';
          if (roleRaw.includes('a') || roleRaw.includes('att')) position = 'ATT';

          // Controlliamo lo status "In Prestito"
          let isLoan = false;
          for (let txt of colTexts) {
            if (txt.toLowerCase().includes('prestito') || txt.toLowerCase().includes('dal ')) {
              isLoan = true;
            }
          }

          if (name && name.length > 2 && !name.toLowerCase().includes('giocatore')) {
            players.push({
              id: `wp_${encodeURIComponent(name.toLowerCase().replace(/ /g, '_'))}`,
              name,
              position,
              number: number || '-',
              age: 'N/A',
              height: 'N/A',
              weight: 'N/A',
              foot: 'N/A',
              status: isLoan ? 'In Prestito' : 'In Rosa',
              stats: null, // Verranno caricati On-Demand dall'API
              curiosities: null
            });
          }
        }
      });
    }

    return { coachName, players };

  } catch (error) {
    console.error(`Errore durante lo scraping di ${team.id}:`, error);
    return null;
  }
}

async function run() {
  console.log("=== INIZIO ESTRAZIONE WIKIPEDIA (2026) ===");
  
  const outputFilePath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
  // Carichiamo il file esistente in modo da non perdere i team di Serie B che non vengono scrapati per risparmiare tempo
  let allSquads = {};
  if (fs.existsSync(outputFilePath)) {
    allSquads = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
  }

  for (const team of TEAMS) {
    const scrapedData = await scrapeTeam(team);
    
    if (scrapedData && scrapedData.players.length > 10) {
      // Se il team esiste nel JSON, aggiorna la Prima Squadra mantenendo Primavera e Transfers
      if (!allSquads[team.id]) {
        allSquads[team.id] = { primavera: { coach: { name: 'N/A' }, staff: [], players: [] }, transfers: [] };
      }
      
      allSquads[team.id].firstTeam = {
        coach: { name: scrapedData.coachName, role: 'Allenatore', module: '4-3-3' },
        staff: [],
        players: scrapedData.players
      };
      console.log(`✅ ${team.id} aggiornato con ${scrapedData.players.length} giocatori reali.`);
    } else {
      console.log(`⚠️ Fallito scraping per ${team.id}, si useranno i dati esistenti.`);
    }
    
    // Attendi 2 secondi tra una richiesta e l'altra per non farsi bloccare da Wikipedia
    await new Promise(res => setTimeout(res, 2000));
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(allSquads, null, 2), 'utf-8');
  console.log('Estrazione 2026 completata e salvata su deepSquads.json!');
}

run();
