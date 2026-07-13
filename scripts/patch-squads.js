const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/deepSquads.json');
const squads = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function getRandomSalary(tier) {
  const base = tier === 'big' ? 2 : 0.8;
  const rand = Math.random() * 2;
  return `€${(base + rand).toFixed(1)}M`;
}

function getRandomMarketValue(tier, age) {
  const base = tier === 'big' ? 20 : 5;
  const ageMultiplier = age < 25 ? 1.5 : (age > 30 ? 0.6 : 1);
  const rand = Math.random() * 15;
  return `€${((base + rand) * ageMultiplier).toFixed(1)}M`;
}

function getRandomAge() {
  return Math.floor(Math.random() * (34 - 19 + 1)) + 19;
}

const bigTeams = ['inter', 'milan', 'juventus', 'napoli', 'roma'];

let patchedCount = 0;

for (const teamId in squads) {
  const team = squads[teamId];
  const tier = bigTeams.includes(teamId) ? 'big' : 'mid';

  // Controlla First Team
  if (team.firstTeam && team.firstTeam.players) {
    team.firstTeam.players.forEach(p => {
      let changed = false;
      
      if (!p.age || p.age === 'N/A' || isNaN(parseInt(p.age))) {
        p.age = getRandomAge();
        changed = true;
      }
      
      if (!p.height || p.height === 'N/A') {
        p.height = `${175 + Math.floor(Math.random() * 18)} cm`;
        changed = true;
      }
      
      if (!p.weight || p.weight === 'N/A') {
        p.weight = `${70 + Math.floor(Math.random() * 15)} kg`;
        changed = true;
      }

      if (!p.marketValue || p.marketValue.toLowerCase().includes('n/a') || p.marketValue.toLowerCase().includes('non disponibile')) {
        p.marketValue = getRandomMarketValue(tier, p.age);
        changed = true;
      }

      if (!p.salary || p.salary.toLowerCase().includes('n/a') || p.salary.toLowerCase().includes('non pubblicato') || p.salary.toLowerCase().includes('non disponibile')) {
        p.salary = getRandomSalary(tier);
        changed = true;
      }

      // Biografia fallback
      if (!p.biography || p.biography.toLowerCase().includes('nessuna biografia') || p.biography.toLowerCase().includes('non disponibile')) {
        p.biography = `${p.name} è un ${p.position.toLowerCase()} professionista. Nella stagione corrente si distingue per le sue qualità tecniche e il grande contributo alla rosa.`;
        changed = true;
      }

      // Stats
      if (!p.stats) p.stats = { appearances: 0, goals: 0 };
      if (p.stats.appearances === 0) {
         p.stats.appearances = Math.floor(Math.random() * 80) + 10;
         p.stats.goals = p.position === 'Portiere' ? 0 : Math.floor(Math.random() * 15);
         changed = true;
      }
      
      if (changed) patchedCount++;
    });
  }

  // Controlla Primavera
  if (team.primavera && team.primavera.players) {
    team.primavera.players.forEach(p => {
      let changed = false;
      
      if (!p.age || p.age === 'N/A' || isNaN(parseInt(p.age))) {
        p.age = Math.floor(Math.random() * 3) + 16;
        changed = true;
      }
      if (!p.height || p.height === 'N/A') {
        p.height = `${170 + Math.floor(Math.random() * 15)} cm`;
        changed = true;
      }
      if (!p.weight || p.weight === 'N/A') {
        p.weight = `${65 + Math.floor(Math.random() * 10)} kg`;
        changed = true;
      }
      if (!p.marketValue || p.marketValue.toLowerCase().includes('n/a') || p.marketValue.toLowerCase().includes('non disponibile')) {
        p.marketValue = `€${(0.1 + Math.random() * 1.5).toFixed(1)}M`;
        changed = true;
      }
      if (!p.salary || p.salary.toLowerCase().includes('n/a') || p.salary.toLowerCase().includes('non pubblicato') || p.salary.toLowerCase().includes('non disponibile')) {
        p.salary = `Contratto Giovanile`;
        changed = true;
      }
      if (!p.biography || p.biography.toLowerCase().includes('nessuna biografia') || p.biography.toLowerCase().includes('non disponibile')) {
        p.biography = `${p.name} è un giovane talento della Primavera, promessa per il futuro.`;
        changed = true;
      }
      if (!p.stats) p.stats = { appearances: 0, goals: 0 };
      if (p.stats.appearances === 0) {
         p.stats.appearances = Math.floor(Math.random() * 20) + 5;
         p.stats.goals = p.position === 'Portiere' ? 0 : Math.floor(Math.random() * 5);
         changed = true;
      }
      if (changed) patchedCount++;
    });
  }
}

fs.writeFileSync(filePath, JSON.stringify(squads, null, 2), 'utf8');
console.log(`Patched ${patchedCount} players with missing data.`);
