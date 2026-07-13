const fs = require('fs');
const path = require('path');

const squadsPath = path.join(__dirname, '../src/data/deepSquads.json');
const realDataPath = path.join(__dirname, '../src/data/realPlayersData.json');

const squads = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));
const realData = JSON.parse(fs.readFileSync(realDataPath, 'utf8'));

let appliedCount = 0;

for (const teamId in realData) {
  if (squads[teamId] && squads[teamId].firstTeam && squads[teamId].firstTeam.players) {
    const realPlayers = realData[teamId].firstTeam;
    
    realPlayers.forEach(realP => {
      // Trova il giocatore nel deepSquads usando match parziale o esatto sul nome
      const target = squads[teamId].firstTeam.players.find(p => p.name.includes(realP.name) || realP.name.includes(p.name));
      
      if (target) {
        if (realP.salary) target.salary = realP.salary;
        if (realP.marketValue) target.marketValue = realP.marketValue;
        if (realP.contractUntil) target.contractUntil = realP.contractUntil;
        if (realP.biography) target.biography = realP.biography;
        // Marca come verified
        target.isVerified = true;
        appliedCount++;
      }
    });
  }
}

fs.writeFileSync(squadsPath, JSON.stringify(squads, null, 2), 'utf8');
console.log(`Applicati ${appliedCount} record reali esatti.`);
