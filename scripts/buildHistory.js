const fs = require('fs');
const path = require('path');

const ROSTERS_DIR = path.join(__dirname, '../src/data/rosters');
const HISTORY_FILE = path.join(__dirname, '../src/data/history.ts');
const OUTPUT_FILE = path.join(__dirname, '../src/data/trofeiCronologia.json');

// Leggi history.ts per estrarre la cronologia esatta
const historyContent = fs.readFileSync(HISTORY_FILE, 'utf-8');
// Parsiamo HISTORY_DATA in modo grezzo
const teamsMap = {};
const regex = /\{ team: '([^']+)', crest: '[^']+', wins: \[([^\]]+)\] \}/g;
let match;
while ((match = regex.exec(historyContent)) !== null) {
    const teamName = match[1].toLowerCase().replace(/ /g, '_');
    const winsStr = match[2];
    const wins = winsStr.split(',').map(s => s.trim().replace(/'/g, ''));
    teamsMap[teamName] = wins;
}

const finalDb = [];

for (const [team, wins] of Object.entries(teamsMap)) {
    // Prova a caricare il file JSON del team
    const teamFile = path.join(ROSTERS_DIR, `${team}.json`);
    let teamData = {};
    if (fs.existsSync(teamFile)) {
        teamData = JSON.parse(fs.readFileSync(teamFile, 'utf-8'));
    }

    wins.forEach((yearLabel, idx) => {
        const yearMatch = yearLabel.match(/\d+/g);
        const endYear = yearMatch.length > 1 ? yearMatch[1] : yearMatch[0];
        const fullEndYear = endYear.length === 2 ? `19${endYear}` : endYear; // Semplificazione, la correggiamo dopo
        const targetYear = fullEndYear.length === 2 ? (parseInt(endYear) > 25 ? `19${endYear}` : `20${endYear}`) : fullEndYear;
        
        // Estrai dati specifici o usa fallback
        const specificData = teamData[yearLabel] || teamData[targetYear] || {
            coach: 'Dato Storico in Aggiornamento',
            points: 'Vittoria Scudetto',
            roster: [
                { name: 'Formazione in aggiornamento', role: 'CEN', isStarter: true }
            ]
        };

        finalDb.push({
            id: `${team}_campionato_serie_a_${idx}`,
            team: team,
            name: "Campionato Serie A",
            year: yearLabel, // Usiamo la label esatta di history "2023/24" per fixare ogni bug!
            icon: "🏆",
            coach: specificData.coach || 'Dato Storico',
            points: specificData.points || 'Vittoria Storica',
            roster: specificData.roster || []
        });
    });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalDb, null, 2));
console.log(`Generati ${finalDb.length} trofei in ${OUTPUT_FILE}`);
