const fs = require('fs');
const path = require('path');

const ROSTERS_DIR = path.join(__dirname, '../src/data/rosters');
const HISTORY_FILE = path.join(__dirname, '../src/data/history.ts');
const OUTPUT_FILE = path.join(__dirname, '../src/data/trofeiCronologia.json');

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

const finalDb = [];

const leagueNames = {
    'A': 'Campionato Serie A',
    'LL': 'La Liga',
    'PL': 'Premier League',
    'BL': 'Bundesliga',
    'L1': 'Ligue 1',
    'CL': 'Champions League'
};

for (const [leagueId, teams] of Object.entries(HISTORY_DATA)) {
    const trophyName = leagueNames[leagueId] || 'Campionato';

    for (const teamDataObj of teams) {
        const teamNameRaw = teamDataObj.team;
        let teamId = teamNameRaw.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
        teamId = teamId.replace(/ñ/g, 'n').replace(/ü/g, 'u').replace(/é/g, 'e');
        const wins = teamDataObj.wins;

        // Prova a caricare il file JSON del team
        let teamData = {};
        const teamFile = path.join(ROSTERS_DIR, `${teamId}.json`);
        if (fs.existsSync(teamFile)) {
            teamData = JSON.parse(fs.readFileSync(teamFile, 'utf-8'));
        }

        // Se è CL, i dati li peschiamo da champions_league.json
        let clData = {};
        if (leagueId === 'CL') {
            const clFile = path.join(ROSTERS_DIR, 'champions_league.json');
            if (fs.existsSync(clFile)) {
                clData = JSON.parse(fs.readFileSync(clFile, 'utf-8'));
            }
        }

        wins.forEach((yearLabel, idx) => {
            const yearMatch = yearLabel.match(/\d+/g);
            let specificData = null;

            if (leagueId === 'CL') {
                // Per la CL peschiamo il dato esatto dell'annata dal database della CL
                const finalData = clData[yearLabel];
                if (finalData && finalData.winner === teamNameRaw) {
                    specificData = finalData;
                }
            } else {
                // Per i campionati nazionali cerchiamo nel file del team
                if (yearMatch && yearMatch.length > 0) {
                    const endYear = yearMatch.length > 1 ? yearMatch[1] : yearMatch[0];
                    const fullEndYear = endYear.length === 2 ? `19${endYear}` : endYear;
                    const targetYear = fullEndYear.length === 2 ? (parseInt(endYear) > 25 ? `19${endYear}` : `20${endYear}`) : fullEndYear;
                    
                    specificData = teamData[yearLabel] || teamData[targetYear];
                }
            }

            if (!specificData) {
                specificData = {
                    coach: 'Dato Storico in Aggiornamento',
                    points: leagueId === 'CL' ? 'Vittoria Finale' : 'Vittoria Campionato',
                    roster: [
                        { name: 'Formazione in aggiornamento', role: 'CEN', isStarter: true }
                    ]
                };
            }

            const trophyEntry = {
                id: `${teamId}_${leagueId}_${idx}`,
                team: teamId,
                name: trophyName,
                year: yearLabel,
                icon: leagueId === 'CL' ? "🇪🇺" : "🏆",
                coach: specificData.coach || 'Dato Storico',
                points: specificData.points || (leagueId === 'CL' ? 'Vittoria' : 'Vittoria Storica'),
                roster: specificData.roster || []
            };

            if (leagueId === 'CL' && specificData.runnerUp) {
                trophyEntry.runnerUp = specificData.runnerUp;
                trophyEntry.score = specificData.score;
                trophyEntry.stadium = specificData.stadium;
                trophyEntry.stats = specificData.stats;
            }

            finalDb.push(trophyEntry);
        });
    }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalDb, null, 2));
console.log(`Generati ${finalDb.length} trofei in ${OUTPUT_FILE}`);
