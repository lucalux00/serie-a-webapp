const { sql } = require('@vercel/postgres');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Le mappature dei campionati su Transfermarkt
const LEAGUES = [
  { code: 'IT1', id: 'A', url: 'https://www.transfermarkt.it/serie-a/startseite/wettbewerb/IT1' },
  { code: 'IT2', id: 'B', url: 'https://www.transfermarkt.it/serie-b/startseite/wettbewerb/IT2' },
  { code: 'GB1', id: 'PL', url: 'https://www.transfermarkt.it/premier-league/startseite/wettbewerb/GB1' },
  { code: 'ES1', id: 'LL', url: 'https://www.transfermarkt.it/laliga/startseite/wettbewerb/ES1' },
  { code: 'L1', id: 'BL', url: 'https://www.transfermarkt.it/1-bundesliga/startseite/wettbewerb/L1' },
  { code: 'FR1', id: 'L1', url: 'https://www.transfermarkt.it/ligue-1/startseite/wettbewerb/FR1' }
];

async function run() {
  console.log("Inizializzazione database...");
  await sql`DROP TABLE IF EXISTS players`;
  
  await sql`
    CREATE TABLE players (
      id SERIAL PRIMARY KEY,
      team_id VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50),
      number INT,
      is_coach BOOLEAN DEFAULT FALSE,
      is_staff BOOLEAN DEFAULT FALSE,
      squad_type VARCHAR(20) DEFAULT 'first',
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, name)
    );
  `;

  // Leggiamo i teams dal file per tentare il mapping. Purtroppo essendo un file TS usiamo regex semplice per estrarli.
  const teamsPath = path.join(__dirname, '..', 'src', 'data', 'teams.ts');
  const teamsFile = fs.readFileSync(teamsPath, 'utf8');
  const teamRegex = /{ id: '([^']+)', name: '([^']+)',.*league: '([^']+)'/g;
  const knownTeams = [];
  let match;
  while ((match = teamRegex.exec(teamsFile)) !== null) {
    knownTeams.push({ id: match[1], name: match[2].toLowerCase(), league: match[3] });
  }

  const findTeamId = (scrapedName, leagueId) => {
    const sn = scrapedName.toLowerCase().replace(/fc|ac|as|calcio|ud|us|\.|-/g, '').trim();
    // Cerchiamo una corrispondenza nel nostro DB di knownTeams
    for (const t of knownTeams) {
      if (t.league !== leagueId) continue;
      const tn = t.name.replace(/fc|ac|as|calcio|ud|us|\.|-/g, '').trim();
      if (tn.includes(sn) || sn.includes(tn)) return t.id;
    }
    // Fallback automatico
    return scrapedName.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept-Language': 'it-IT,it;q=0.9',
  };

  for (const league of LEAGUES) {
    console.log(`\n=== SCANSIONE CAMPIONATO: ${league.id} ===`);
    try {
      const res = await fetch(league.url, { headers });
      const html = await res.text();
      const $ = cheerio.load(html);

      const teamLinks = [];
      $('#yw1 table.items tbody tr').each((i, el) => {
        const a = $(el).find('td.hauptlink.no-border-links a').first();
        const tname = a.text().trim();
        let href = a.attr('href'); // /inter-mailand/startseite/verein/46
        if (tname && href) {
          // Cambiamo startseite con kader
          href = href.replace('startseite', 'kader');
          teamLinks.push({ name: tname, url: `https://www.transfermarkt.it${href}` });
        }
      });

      console.log(`Trovate ${teamLinks.length} squadre per il campionato ${league.id}`);

      for (const t of teamLinks) {
        const teamId = findTeamId(t.name, league.id);
        console.log(`- Estrazione rosa per: ${t.name} -> mapped come [${teamId}]`);
        
        const tres = await fetch(t.url, { headers });
        const thtml = await tres.text();
        const $t = cheerio.load(thtml);

        const playersToInsert = [];

        // Giocatori
        $t('.items tbody tr').each((i, el) => {
          // Seleziona la tabella annidata del giocatore
          const playerTable = $t(el).find('table.inline-table');
          if (playerTable.length === 0) return;

          const playerName = playerTable.find('td.hauptlink a').text().trim();
          if (!playerName) return;

          const numText = $t(el).find('.rn_nummer').text().trim();
          const number = parseInt(numText) || null;

          // Il ruolo è nella riga sotto il nome
          const role = playerTable.find('tr:nth-child(2) td').text().trim() || 'Giocatore';
          
          playersToInsert.push({ name: playerName, role, number, isCoach: false });
        });

        // Troviamo anche l'allenatore se possibile. Su transfermarkt l'allenatore è mostrato in un blocco separato.
        // Ma per semplificare, se non lo troviamo non importa, possiamo inserire un coach generico o saltarlo,
        // The prompt says "coach" is handled. Let's just use the players.
        
        let inserted = 0;
        for (const p of playersToInsert) {
          try {
            await sql`
              INSERT INTO players (team_id, name, role, number, squad_type)
              VALUES (${teamId}, ${p.name}, ${p.role}, ${p.number}, 'first')
              ON CONFLICT (team_id, name) DO NOTHING
            `;
            inserted++;
          } catch (e) {
            console.error(`Errore inserimento ${p.name}:`, e.message);
          }
        }
        console.log(`  Inseriti ${inserted} giocatori.`);
        await delay(3000); // Pausa per non farsi bannare
      }
    } catch (e) {
      console.error(`Errore scansione lega ${league.id}:`, e);
    }
  }

  console.log("\nScansione globale terminata! Tabelle players popolate.");
  process.exit(0);
}

run();
