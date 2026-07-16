const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/trofeiCronologia.json');
let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const updates = {
  // JUVENTUS SCUDETTO 17/18
  "juventus_campionato_serie_a_33": [
    { "name": "G. Buffon", "role": "POR", "isStarter": true },
    { "name": "W. Szczesny", "role": "POR", "isStarter": false },
    { "name": "C. Pinsoglio", "role": "POR", "isStarter": false },
    { "name": "S. Lichtsteiner", "role": "DIF", "isStarter": true },
    { "name": "G. Chiellini", "role": "DIF", "isStarter": true },
    { "name": "M. Benatia", "role": "DIF", "isStarter": true },
    { "name": "Alex Sandro", "role": "DIF", "isStarter": true },
    { "name": "A. Barzagli", "role": "DIF", "isStarter": false },
    { "name": "D. Rugani", "role": "DIF", "isStarter": false },
    { "name": "M. De Sciglio", "role": "DIF", "isStarter": false },
    { "name": "K. Asamoah", "role": "DIF", "isStarter": false },
    { "name": "M. Pjanic", "role": "CEN", "isStarter": true },
    { "name": "B. Matuidi", "role": "CEN", "isStarter": true },
    { "name": "S. Khedira", "role": "CEN", "isStarter": true },
    { "name": "C. Marchisio", "role": "CEN", "isStarter": false },
    { "name": "R. Bentancur", "role": "CEN", "isStarter": false },
    { "name": "S. Sturaro", "role": "CEN", "isStarter": false },
    { "name": "G. Higuain", "role": "ATT", "isStarter": true },
    { "name": "P. Dybala", "role": "ATT", "isStarter": true },
    { "name": "M. Mandzukic", "role": "ATT", "isStarter": true },
    { "name": "D. Costa", "role": "ATT", "isStarter": false },
    { "name": "F. Bernardeschi", "role": "ATT", "isStarter": false },
    { "name": "J. Cuadrado", "role": "ATT", "isStarter": false }
  ],
  
  // JUVENTUS SCUDETTO 16/17
  "juventus_campionato_serie_a_32": [
    { "name": "G. Buffon", "role": "POR", "isStarter": true },
    { "name": "Neto", "role": "POR", "isStarter": false },
    { "name": "L. Bonucci", "role": "DIF", "isStarter": true },
    { "name": "G. Chiellini", "role": "DIF", "isStarter": true },
    { "name": "A. Barzagli", "role": "DIF", "isStarter": true },
    { "name": "Alex Sandro", "role": "DIF", "isStarter": true },
    { "name": "S. Lichtsteiner", "role": "DIF", "isStarter": false },
    { "name": "Dani Alves", "role": "DIF", "isStarter": false },
    { "name": "D. Rugani", "role": "DIF", "isStarter": false },
    { "name": "M. Pjanic", "role": "CEN", "isStarter": true },
    { "name": "S. Khedira", "role": "CEN", "isStarter": true },
    { "name": "C. Marchisio", "role": "CEN", "isStarter": false },
    { "name": "S. Sturaro", "role": "CEN", "isStarter": false },
    { "name": "K. Asamoah", "role": "CEN", "isStarter": false },
    { "name": "T. Rincón", "role": "CEN", "isStarter": false },
    { "name": "G. Higuain", "role": "ATT", "isStarter": true },
    { "name": "P. Dybala", "role": "ATT", "isStarter": true },
    { "name": "M. Mandzukic", "role": "ATT", "isStarter": true },
    { "name": "J. Cuadrado", "role": "ATT", "isStarter": true },
    { "name": "M. Pjaca", "role": "ATT", "isStarter": false }
  ],

  // JUVENTUS SCUDETTO 15/16
  "juventus_campionato_serie_a_31": [
    { "name": "G. Buffon", "role": "POR", "isStarter": true },
    { "name": "Neto", "role": "POR", "isStarter": false },
    { "name": "L. Bonucci", "role": "DIF", "isStarter": true },
    { "name": "G. Chiellini", "role": "DIF", "isStarter": true },
    { "name": "A. Barzagli", "role": "DIF", "isStarter": true },
    { "name": "P. Evra", "role": "DIF", "isStarter": true },
    { "name": "S. Lichtsteiner", "role": "DIF", "isStarter": true },
    { "name": "Alex Sandro", "role": "DIF", "isStarter": false },
    { "name": "D. Rugani", "role": "DIF", "isStarter": false },
    { "name": "M. Caceres", "role": "DIF", "isStarter": false },
    { "name": "P. Pogba", "role": "CEN", "isStarter": true },
    { "name": "C. Marchisio", "role": "CEN", "isStarter": true },
    { "name": "S. Khedira", "role": "CEN", "isStarter": true },
    { "name": "S. Sturaro", "role": "CEN", "isStarter": false },
    { "name": "Hernanes", "role": "CEN", "isStarter": false },
    { "name": "K. Asamoah", "role": "CEN", "isStarter": false },
    { "name": "R. Pereyra", "role": "CEN", "isStarter": false },
    { "name": "P. Dybala", "role": "ATT", "isStarter": true },
    { "name": "M. Mandzukic", "role": "ATT", "isStarter": true },
    { "name": "A. Morata", "role": "ATT", "isStarter": false },
    { "name": "S. Zaza", "role": "ATT", "isStarter": false },
    { "name": "J. Cuadrado", "role": "ATT", "isStarter": false }
  ]
};

let modifiedCount = 0;

data = data.map(trophy => {
  if (updates[trophy.id]) {
    // Rimuovi formation e roster vecchi
    const { formation, roster: oldRoster, ...rest } = trophy;
    rest.roster = updates[trophy.id];
    modifiedCount++;
    return rest;
  }
  return trophy;
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Aggiornati con successo ${modifiedCount} trofei storici!`);
