import fs from 'fs';
import path from 'path';

const TEAMS = [
  'Atalanta', 'Bologna', 'Cagliari', 'Como', 'Fiorentina', 'Frosinone', 'Genoa', 'Inter', 'Juventus', 'Lazio',
  'Lecce', 'Milan', 'Monza', 'Napoli', 'Parma', 'Roma', 'Sassuolo', 'Torino', 'Udinese', 'Venezia',
  'Bari', 'Brescia', 'Catanzaro', 'Cesena', 'Cittadella', 'Cosenza', 'Cremonese', 'Empoli', 'Juve Stabia', 'Mantova',
  'Modena', 'Palermo', 'Pisa', 'Reggiana', 'Salernitana', 'Sampdoria', 'Spezia', 'Sudtirol', 'Verona', 'Carrarese'
];

const POSITIONS = ['POR', 'DIF', 'CEN', 'ATT'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FIRST_NAMES = ['Mario', 'Luigi', 'Andrea', 'Marco', 'Giuseppe', 'Antonio', 'Giovanni', 'Roberto', 'Lorenzo', 'Mattia', 'Federico', 'Alessandro', 'Luca', 'Davide', 'Giacomo'];
const LAST_NAMES = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa'];
const GRADES = ['60/100 (Sufficiente)', '75/100 (Buono)', '82/100 (Distinto)', '95/100 (Ottimo)', '100/100 (Eccellente)', '100 e Lode', 'Non pervenuto', 'Ritirato per il calcio'];

function generatePlayer(pos, idx) {
  const isGoalie = pos === 'POR';
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
    position: pos,
    number: isGoalie ? (idx === 0 ? 1 : getRandomInt(12, 99)) : getRandomInt(2, 99),
    age: getRandomInt(18, 38),
    height: getRandomInt(170, 195),
    weight: getRandomInt(65, 90),
    foot: getRandomItem(['Destro', 'Sinistro', 'Ambidestro']),
    stats: {
      appearances: getRandomInt(0, 38),
      goals: isGoalie ? 0 : getRandomInt(0, 20),
      assists: isGoalie ? 0 : getRandomInt(0, 15),
      yellowCards: getRandomInt(0, 10),
      redCards: getRandomInt(0, 2),
      xG: isGoalie ? 0 : (Math.random() * 15).toFixed(2),
      passCompletion: getRandomInt(65, 95)
    },
    curiosities: {
      diploma: getRandomItem(GRADES),
      hobby: getRandomItem(['PlayStation', 'Pesca', 'Padel', 'Lettura', 'Cucina', 'Moda'])
    }
  };
}

function generateSquad() {
  const players = [];
  // 3 POR, 8 DIF, 8 CEN, 5 ATT = 24 players
  for(let i=0; i<3; i++) players.push(generatePlayer('POR', i));
  for(let i=0; i<8; i++) players.push(generatePlayer('DIF', i));
  for(let i=0; i<8; i++) players.push(generatePlayer('CEN', i));
  for(let i=0; i<5; i++) players.push(generatePlayer('ATT', i));
  
  return {
    coach: {
      name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
      role: 'Allenatore',
      module: getRandomItem(['4-3-3', '3-5-2', '4-2-3-1', '4-4-2']),
      diploma: getRandomItem(GRADES)
    },
    staff: [
      { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Vice Allenatore', diploma: getRandomItem(GRADES) },
      { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Prep. Atletico', diploma: getRandomItem(GRADES) },
      { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Prep. Portieri', diploma: getRandomItem(GRADES) }
    ],
    players
  };
}

const allSquads = {};
for (const team of TEAMS) {
  const id = team.toLowerCase().replace(/\s+/g, '');
  allSquads[id] = generateSquad();
}

const outputFilePath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
fs.writeFileSync(outputFilePath, JSON.stringify(allSquads, null, 2), 'utf-8');
console.log('Generazione completata: src/data/deepSquads.json');
