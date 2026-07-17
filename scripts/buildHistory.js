const fs = require('fs');
const path = require('path');

const ROSTERS_DIR = path.join(__dirname, '../src/data/rosters');
const HISTORY_FILE = path.join(__dirname, '../src/data/history.ts');
const OUTPUT_FILE = path.join(__dirname, '../src/data/trofeiCronologia.json');
const CL_FILE = path.join(ROSTERS_DIR, 'champions_league.json');

const historyContent = fs.readFileSync(HISTORY_FILE, 'utf-8');

// Estrarre l'oggetto JS puro da history.ts
const match = historyContent.match(/export const HISTORY_DATA[\s\S]*?=\s*(\{[\s\S]+\});/);
if (!match) {
    console.error("Non riesco a trovare HISTORY_DATA in history.ts");
    process.exit(1);
}

let dataStr = match[1];

// Eval sicuro
let HISTORY_DATA = {};
try {
    HISTORY_DATA = eval('(' + dataStr + ')');
} catch (e) {
    console.error("Errore nel parsing di history.ts:", e);
    process.exit(1);
}

const leagueNames = {
    'LL': { name: 'La Liga', icon: '🇪🇸' },
    'PL': { name: 'Premier League', icon: '🇬🇧' },
    'BL': { name: 'Bundesliga', icon: '🇩🇪' },
    'L1': { name: 'Ligue 1', icon: '🇫🇷' },
    'CL': { name: 'Champions League', icon: '🇪🇺' }
};

function normalizeYear(year) {
    if (year.length === 9 && year.includes('/')) {
        return year.substring(0, 5) + year.substring(7);
    }
    return year;
}

function normalizeTeamId(teamName) {
    return teamName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// 1. Carica il trofeiCronologia.json ORIGINALE (ripristinato)
let finalDb = [];
try {
    const rawData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    finalDb = JSON.parse(rawData);
} catch (e) {
    console.error("Errore lettura trofeiCronologia.json originale:", e);
}

// 2. Arricchisci le formazioni italiane esistenti con le rose complete se disponibili
for (let trophy of finalDb) {
    const teamId = normalizeTeamId(trophy.team);
    const nYear = normalizeYear(trophy.year);
    
    const rosterPath = path.join(ROSTERS_DIR, `${teamId}.json`);
    if (fs.existsSync(rosterPath)) {
        try {
            const teamData = JSON.parse(fs.readFileSync(rosterPath, 'utf-8'));
            if (teamData[nYear] && teamData[nYear].roster) {
                trophy.roster = teamData[nYear].roster;
                // possiamo rimuovere formation
                delete trophy.formation;
            }
        } catch(e) {}
    }
}

// 3. Aggiungi campionati esteri (LL, PL, BL, L1) da history.ts
for (const [leagueId, teams] of Object.entries(HISTORY_DATA)) {
    if (leagueId === 'A' || leagueId === 'CL') continue; // L'Italia è già in trofeiCronologia, CL la facciamo a parte

    const leagueInfo = leagueNames[leagueId];
    
    for (const teamObj of teams) {
        const teamName = teamObj.team;
        const teamId = normalizeTeamId(teamName);
        let teamRosters = {};
        
        const rosterPath = path.join(ROSTERS_DIR, `${teamId}.json`);
        if (fs.existsSync(rosterPath)) {
            try {
                teamRosters = JSON.parse(fs.readFileSync(rosterPath, 'utf-8'));
            } catch(e) {}
        }

        for (let i = 0; i < teamObj.wins.length; i++) {
            const year = teamObj.wins[i]; // formato 2023/24
            
            let roster = [];
            if (teamRosters[year] && teamRosters[year].roster) {
                roster = teamRosters[year].roster;
            } else {
                roster = [{ name: "Formazione in aggiornamento", role: "CEN", isStarter: true }];
            }

            finalDb.push({
                id: `${teamId}_${leagueId}_${i}`,
                team: teamName,
                name: leagueInfo.name,
                year: year,
                icon: leagueInfo.icon,
                coach: "Dato Storico",
                points: "Vittoria Storica",
                roster: roster
            });
        }
    }
}

// 4. Aggiungi Champions League usando champions_league.json
let clData = {};
if (fs.existsSync(CL_FILE)) {
    clData = JSON.parse(fs.readFileSync(CL_FILE, 'utf-8'));
}

if (HISTORY_DATA['CL']) {
    const clIcon = leagueNames['CL'].icon;
    const clName = leagueNames['CL'].name;

    for (const teamObj of HISTORY_DATA['CL']) {
        const teamName = teamObj.team;
        const teamId = normalizeTeamId(teamName);

        for (let i = 0; i < teamObj.wins.length; i++) {
            const year = teamObj.wins[i];
            
            let clEntry = clData[year];
            if (clEntry && clEntry.winner === teamName) {
                // Abbiamo i dati completi
                finalDb.push({
                    id: `${teamId}_cl_${i}`,
                    team: teamName,
                    name: clName,
                    year: year,
                    icon: clIcon,
                    coach: clEntry.coach || "Dato Storico",
                    points: clEntry.score || "Vittoria",
                    runnerUp: clEntry.runnerUp,
                    stadium: clEntry.stadium,
                    stats: clEntry.stats,
                    roster: clEntry.roster
                });
            } else {
                // Non abbiamo i dati per questo specifico team/anno in clData
                finalDb.push({
                    id: `${teamId}_cl_${i}`,
                    team: teamName,
                    name: clName,
                    year: year,
                    icon: clIcon,
                    coach: "Dato Storico",
                    points: "Vittoria Storica",
                    roster: [{ name: "Formazione in aggiornamento", role: "CEN", isStarter: true }]
                });
            }
        }
    }
}


fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalDb, null, 2));
console.log(`Generated ${finalDb.length} historical records successfully!`);
