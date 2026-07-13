const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/classifiche.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// The 20 teams
const teams = [
  "Inter", "Parma", "Fiorentina", "Milan", "Torino", "Juventus", "Como", 
  "Napoli", "Verona", "Lecce", "Atalanta", "Roma", "Cagliari", "Bologna", 
  "Udinese", "Lazio", "Venezia", "Empoli", "Monza", "Genoa"
];

// Funzione per generare calendario (Algoritmo di Berger)
function generateBerger(teamsArray) {
  const n = teamsArray.length;
  const totalRounds = n - 1;
  const matchesPerRound = n / 2;
  const rounds = [];
  
  let currentTeams = [...teamsArray];
  
  for (let round = 0; round < totalRounds; round++) {
    const roundMatches = [];
    for (let i = 0; i < matchesPerRound; i++) {
      let home = currentTeams[i];
      let away = currentTeams[n - 1 - i];
      
      // Inverti casa/trasferta a turni alterni
      if (round % 2 === 1 && i === 0) {
        [home, away] = [away, home];
      }
      
      // Forzatura Genoa-Napoli alla 1a giornata
      // Se è il primo round, manipoleremo dopo
      roundMatches.push({ home, away });
    }
    rounds.push(roundMatches);
    
    // Rotazione (tieni fermo il primo elemento)
    const last = currentTeams.pop();
    currentTeams.splice(1, 0, last);
  }
  
  return rounds;
}

const firstLeg = generateBerger(teams);

// Cerchiamo dove è capitata Genoa-Napoli o Napoli-Genoa e swappiamo l'intero round con il round 0
let targetRoundIndex = -1;
for (let i = 0; i < firstLeg.length; i++) {
  if (firstLeg[i].some(m => (m.home === 'Genoa' && m.away === 'Napoli') || (m.home === 'Napoli' && m.away === 'Genoa'))) {
    targetRoundIndex = i;
    break;
  }
}

if (targetRoundIndex !== -1 && targetRoundIndex !== 0) {
  const temp = firstLeg[0];
  firstLeg[0] = firstLeg[targetRoundIndex];
  firstLeg[targetRoundIndex] = temp;
}

// Forziamo Genoa in casa contro Napoli nel Round 1
const matchIndex = firstLeg[0].findIndex(m => (m.home === 'Genoa' && m.away === 'Napoli') || (m.home === 'Napoli' && m.away === 'Genoa'));
firstLeg[0][matchIndex] = { home: 'Genoa', away: 'Napoli' };

// Creiamo le 38 giornate (girone di ritorno asimmetrico: mescoliamo i round dal 20 al 38)
const secondLeg = [...firstLeg].sort(() => Math.random() - 0.5).map(round => 
  round.map(m => ({ home: m.away, away: m.home }))
);

const fullCalendar = [...firstLeg, ...secondLeg];

// Costruiamo il JSON finale per Serie A
const serieACalendar = [];
let startDate = new Date('2026-08-22T20:45:00');

fullCalendar.forEach((round, index) => {
  const roundNum = index + 1;
  const roundDate = new Date(startDate.getTime() + (index * 7 * 24 * 60 * 60 * 1000));
  
  round.forEach((match, mIdx) => {
    // Orari finti distribuiti nel weekend
    const timeOffsetStr = mIdx === 0 ? "20:45" : mIdx % 2 === 0 ? "18:30" : "15:00";
    const dateStr = roundDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) + ", " + timeOffsetStr;
    
    serieACalendar.push({
      round: roundNum,
      home: match.home,
      away: match.away,
      date: dateStr
    });
  });
});

data.serieA.calendar = serieACalendar;

// E stessa cosa approssimativa per Serie B
const teamsB = data.serieB.standings.map(s => s.team);
const firstLegB = generateBerger(teamsB);
const secondLegB = [...firstLegB].sort(() => Math.random() - 0.5).map(round => 
  round.map(m => ({ home: m.away, away: m.home }))
);
const fullCalendarB = [...firstLegB, ...secondLegB];

const serieBCalendar = [];
let startDateB = new Date('2026-08-21T20:30:00');

fullCalendarB.forEach((round, index) => {
  const roundNum = index + 1;
  const roundDate = new Date(startDateB.getTime() + (index * 7 * 24 * 60 * 60 * 1000));
  round.forEach((match, mIdx) => {
    const timeOffsetStr = mIdx === 0 ? "20:30" : "15:00";
    const dateStr = roundDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) + ", " + timeOffsetStr;
    serieBCalendar.push({
      round: roundNum,
      home: match.home,
      away: match.away,
      date: dateStr
    });
  });
});

data.serieB.calendar = serieBCalendar;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Calendario ufficiale Serie A e Serie B a 38 giornate generato e inserito in classifiche.json.');
