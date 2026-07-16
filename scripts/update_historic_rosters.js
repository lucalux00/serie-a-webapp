const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/trofeiCronologia.json');
let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const updates = {
  // MILAN SCUDETTO 21/22
  "milan_campionato_serie_a_18": [
    { "name": "M. Maignan", "role": "POR", "isStarter": true },
    { "name": "C. Tătărușanu", "role": "POR", "isStarter": false },
    { "name": "D. Calabria", "role": "DIF", "isStarter": true },
    { "name": "P. Kalulu", "role": "DIF", "isStarter": true },
    { "name": "F. Tomori", "role": "DIF", "isStarter": true },
    { "name": "T. Hernández", "role": "DIF", "isStarter": true },
    { "name": "A. Romagnoli", "role": "DIF", "isStarter": false },
    { "name": "S. Kjaer", "role": "DIF", "isStarter": false },
    { "name": "M. Gabbia", "role": "DIF", "isStarter": false },
    { "name": "A. Florenzi", "role": "DIF", "isStarter": false },
    { "name": "F. Ballo-Touré", "role": "DIF", "isStarter": false },
    { "name": "S. Tonali", "role": "CEN", "isStarter": true },
    { "name": "F. Kessié", "role": "CEN", "isStarter": true },
    { "name": "I. Bennacer", "role": "CEN", "isStarter": false },
    { "name": "B. Díaz", "role": "CEN", "isStarter": true },
    { "name": "R. Krunić", "role": "CEN", "isStarter": false },
    { "name": "T. Bakayoko", "role": "CEN", "isStarter": false },
    { "name": "R. Leão", "role": "ATT", "isStarter": true },
    { "name": "O. Giroud", "role": "ATT", "isStarter": true },
    { "name": "A. Saelemaekers", "role": "ATT", "isStarter": true },
    { "name": "J. Messias", "role": "ATT", "isStarter": false },
    { "name": "Z. Ibrahimović", "role": "ATT", "isStarter": false },
    { "name": "A. Rebić", "role": "ATT", "isStarter": false }
  ],
  
  // INTER SCUDETTO 20/21
  "inter_campionato_serie_a_2020_2021_1": [
    { "name": "S. Handanovic", "role": "POR", "isStarter": true },
    { "name": "I. Radu", "role": "POR", "isStarter": false },
    { "name": "M. Skriniar", "role": "DIF", "isStarter": true },
    { "name": "S. De Vrij", "role": "DIF", "isStarter": true },
    { "name": "A. Bastoni", "role": "DIF", "isStarter": true },
    { "name": "A. Hakimi", "role": "DIF", "isStarter": true },
    { "name": "A. Young", "role": "DIF", "isStarter": false },
    { "name": "M. Darmian", "role": "DIF", "isStarter": false },
    { "name": "D. D'Ambrosio", "role": "DIF", "isStarter": false },
    { "name": "A. Ranocchia", "role": "DIF", "isStarter": false },
    { "name": "A. Kolarov", "role": "DIF", "isStarter": false },
    { "name": "N. Barella", "role": "CEN", "isStarter": true },
    { "name": "M. Brozovic", "role": "CEN", "isStarter": true },
    { "name": "C. Eriksen", "role": "CEN", "isStarter": true },
    { "name": "A. Vidal", "role": "CEN", "isStarter": false },
    { "name": "I. Perisic", "role": "CEN", "isStarter": true },
    { "name": "R. Gagliardini", "role": "CEN", "isStarter": false },
    { "name": "M. Vecino", "role": "CEN", "isStarter": false },
    { "name": "S. Sensi", "role": "CEN", "isStarter": false },
    { "name": "R. Lukaku", "role": "ATT", "isStarter": true },
    { "name": "L. Martinez", "role": "ATT", "isStarter": true },
    { "name": "A. Sanchez", "role": "ATT", "isStarter": false }
  ],

  // JUVENTUS SCUDETTO 19/20
  "juventus_campionato_serie_a_35": [
    { "name": "W. Szczesny", "role": "POR", "isStarter": true },
    { "name": "G. Buffon", "role": "POR", "isStarter": false },
    { "name": "C. Pinsoglio", "role": "POR", "isStarter": false },
    { "name": "J. Cuadrado", "role": "DIF", "isStarter": true },
    { "name": "L. Bonucci", "role": "DIF", "isStarter": true },
    { "name": "M. de Ligt", "role": "DIF", "isStarter": true },
    { "name": "Alex Sandro", "role": "DIF", "isStarter": true },
    { "name": "G. Chiellini", "role": "DIF", "isStarter": false },
    { "name": "D. Rugani", "role": "DIF", "isStarter": false },
    { "name": "M. Demiral", "role": "DIF", "isStarter": false },
    { "name": "Danilo", "role": "DIF", "isStarter": false },
    { "name": "M. De Sciglio", "role": "DIF", "isStarter": false },
    { "name": "M. Pjanic", "role": "CEN", "isStarter": true },
    { "name": "R. Bentancur", "role": "CEN", "isStarter": true },
    { "name": "B. Matuidi", "role": "CEN", "isStarter": true },
    { "name": "A. Rabiot", "role": "CEN", "isStarter": false },
    { "name": "A. Ramsey", "role": "CEN", "isStarter": false },
    { "name": "S. Khedira", "role": "CEN", "isStarter": false },
    { "name": "Cristiano Ronaldo", "role": "ATT", "isStarter": true },
    { "name": "P. Dybala", "role": "ATT", "isStarter": true },
    { "name": "G. Higuain", "role": "ATT", "isStarter": false },
    { "name": "D. Costa", "role": "ATT", "isStarter": false },
    { "name": "F. Bernardeschi", "role": "ATT", "isStarter": true }
  ],
  
  // JUVENTUS SCUDETTO 18/19
  "juventus_campionato_serie_a_34": [
    { "name": "W. Szczesny", "role": "POR", "isStarter": true },
    { "name": "M. Perin", "role": "POR", "isStarter": false },
    { "name": "J. Cancelo", "role": "DIF", "isStarter": true },
    { "name": "L. Bonucci", "role": "DIF", "isStarter": true },
    { "name": "G. Chiellini", "role": "DIF", "isStarter": true },
    { "name": "Alex Sandro", "role": "DIF", "isStarter": true },
    { "name": "D. Rugani", "role": "DIF", "isStarter": false },
    { "name": "A. Barzagli", "role": "DIF", "isStarter": false },
    { "name": "M. De Sciglio", "role": "DIF", "isStarter": false },
    { "name": "M. Pjanic", "role": "CEN", "isStarter": true },
    { "name": "B. Matuidi", "role": "CEN", "isStarter": true },
    { "name": "E. Can", "role": "CEN", "isStarter": true },
    { "name": "R. Bentancur", "role": "CEN", "isStarter": false },
    { "name": "S. Khedira", "role": "CEN", "isStarter": false },
    { "name": "Cristiano Ronaldo", "role": "ATT", "isStarter": true },
    { "name": "M. Mandzukic", "role": "ATT", "isStarter": true },
    { "name": "P. Dybala", "role": "ATT", "isStarter": true },
    { "name": "D. Costa", "role": "ATT", "isStarter": false },
    { "name": "F. Bernardeschi", "role": "ATT", "isStarter": false },
    { "name": "M. Kean", "role": "ATT", "isStarter": false }
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
