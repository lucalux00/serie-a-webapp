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

const FIRST_NAMES = ['Mario', 'Luigi', 'Andrea', 'Marco', 'Giuseppe', 'Antonio', 'Giovanni', 'Roberto', 'Lorenzo', 'Mattia', 'Federico', 'Alessandro', 'Luca', 'Davide', 'Giacomo', 'Pietro', 'Paolo', 'Emanuele', 'Simone', 'Daniele', 'Francesco', 'Edoardo', 'Riccardo', 'Stefano', 'Michele', 'Angelo', 'Vincenzo', 'Fabio', 'Massimo', 'Claudio'];
const LAST_NAMES = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti', 'Fontana', 'Santoro', 'Caruso', 'Mariani', 'Martini', 'Leone', 'Longo', 'Galli', 'Ferrara', 'Conte'];
const GRADES = ['60/100 (Sufficiente)', '75/100 (Buono)', '82/100 (Distinto)', '95/100 (Ottimo)', '100/100 (Eccellente)', '100 e Lode', 'Non pervenuto', 'In corso (Liceo)'];

function generatePlayer(pos, idx, isPrimavera = false) {
  const isGoalie = pos === 'POR';
  const age = isPrimavera ? getRandomInt(16, 19) : getRandomInt(18, 38);
  
  // 20% dei giocatori in prima squadra sono in prestito (in uscita o in entrata, qui simuliamo in uscita per esuberi)
  const isLoanOut = !isPrimavera && Math.random() > 0.8;
  const loanDetails = isLoanOut ? {
    toTeam: getRandomItem(TEAMS),
    type: getRandomItem(['Secco', 'Con Diritto di Riscatto', 'Con Obbligo di Riscatto']),
    fee: getRandomInt(0, 5) + 'M €',
    buyOption: getRandomInt(5, 30) + 'M €'
  } : null;

  return {
    id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
    position: pos,
    number: isGoalie ? (idx === 0 ? 1 : getRandomInt(12, 99)) : getRandomInt(2, 99),
    age,
    height: getRandomInt(170, 195),
    weight: getRandomInt(65, 90),
    foot: getRandomItem(['Destro', 'Sinistro', 'Ambidestro']),
    status: isLoanOut ? 'In Prestito' : 'In Rosa',
    loanDetails,
    stats: {
      appearances: isPrimavera ? getRandomInt(0, 15) : getRandomInt(0, 38),
      goals: isGoalie ? 0 : getRandomInt(0, 20),
      assists: isGoalie ? 0 : getRandomInt(0, 15),
      yellowCards: getRandomInt(0, 10),
      redCards: getRandomInt(0, 2),
      xG: isGoalie ? 0 : (Math.random() * 15).toFixed(2),
      passCompletion: getRandomInt(65, 95)
    },
    curiosities: {
      diploma: isPrimavera ? 'In corso (Superiori)' : getRandomItem(GRADES),
      hobby: getRandomItem(['PlayStation', 'Pesca', 'Padel', 'Lettura', 'Cucina', 'Moda', 'Scacchi', 'Cryptovalute'])
    }
  };
}

function generateTransfers() {
  const statuses = ['Conclusa', 'In Corso', 'Fallita'];
  const types = ['Acquisto Definitivo', 'Cessione Definitiva', 'Prestito in Entrata', 'Prestito in Uscita', 'Svincolato'];
  
  const transfers = [];
  const numTransfers = getRandomInt(8, 15);
  for(let i=0; i<numTransfers; i++) {
    transfers.push({
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
      type: getRandomItem(types),
      status: getRandomItem(statuses),
      otherTeam: getRandomItem(TEAMS),
      fee: getRandomInt(0, 80) + 'M €',
      date: new Date(Date.now() - getRandomInt(0, 30) * 86400000).toLocaleDateString('it-IT')
    });
  }
  return transfers;
}

function generateTeamData() {
  const mainPlayers = [];
  // 45 giocatori in prima squadra (tesserati totali, molti in prestito)
  // 4 POR, 15 DIF, 16 CEN, 10 ATT
  for(let i=0; i<4; i++) mainPlayers.push(generatePlayer('POR', i));
  for(let i=0; i<15; i++) mainPlayers.push(generatePlayer('DIF', i));
  for(let i=0; i<16; i++) mainPlayers.push(generatePlayer('CEN', i));
  for(let i=0; i<10; i++) mainPlayers.push(generatePlayer('ATT', i));

  const primaveraPlayers = [];
  // 25 giocatori in primavera
  for(let i=0; i<3; i++) primaveraPlayers.push(generatePlayer('POR', i, true));
  for(let i=0; i<8; i++) primaveraPlayers.push(generatePlayer('DIF', i, true));
  for(let i=0; i<8; i++) primaveraPlayers.push(generatePlayer('CEN', i, true));
  for(let i=0; i<6; i++) primaveraPlayers.push(generatePlayer('ATT', i, true));
  
  return {
    firstTeam: {
      coach: { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Allenatore', module: getRandomItem(['4-3-3', '3-5-2', '4-2-3-1', '4-4-2']), diploma: getRandomItem(GRADES) },
      staff: [
        { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Vice Allenatore', diploma: getRandomItem(GRADES) },
        { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Prep. Atletico', diploma: getRandomItem(GRADES) },
        { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Prep. Portieri', diploma: getRandomItem(GRADES) },
        { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Match Analyst', diploma: getRandomItem(GRADES) },
        { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Medico Sociale', diploma: 'Laurea in Medicina' }
      ],
      players: mainPlayers
    },
    primavera: {
      coach: { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Allenatore Primavera', module: '4-3-3', diploma: getRandomItem(GRADES) },
      staff: [
        { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Vice U19', diploma: getRandomItem(GRADES) },
        { name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`, role: 'Prep. Atletico U19', diploma: getRandomItem(GRADES) }
      ],
      players: primaveraPlayers
    },
    transfers: generateTransfers()
  };
}

const allSquads = {};
for (const team of TEAMS) {
  const id = team.toLowerCase().replace(/\s+/g, '');
  allSquads[id] = generateTeamData();
}

const outputFilePath = path.join(process.cwd(), 'src', 'data', 'deepSquads.json');
fs.writeFileSync(outputFilePath, JSON.stringify(allSquads, null, 2), 'utf-8');
console.log('Generazione completata: src/data/deepSquads.json con Prima Squadra (45), Primavera (25) e Mercato');
