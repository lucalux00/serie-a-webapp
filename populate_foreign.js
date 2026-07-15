const fs = require('fs');

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const ALL_TEAMS = [
  // PL
  { id: 'arsenal', name: 'Arsenal', country: 'GB' },
  { id: 'aston-villa', name: 'Aston Villa', country: 'GB' },
  { id: 'bournemouth', name: 'Bournemouth', country: 'GB' },
  { id: 'brentford', name: 'Brentford', country: 'GB' },
  { id: 'brighton', name: 'Brighton', country: 'GB' },
  { id: 'chelsea', name: 'Chelsea', country: 'GB' },
  { id: 'crystal-palace', name: 'Crystal Palace', country: 'GB' },
  { id: 'everton', name: 'Everton', country: 'GB' },
  { id: 'fulham', name: 'Fulham', country: 'GB' },
  { id: 'ipswich-town', name: 'Ipswich Town', country: 'GB' },
  { id: 'leicester-city', name: 'Leicester City', country: 'GB' },
  { id: 'liverpool', name: 'Liverpool', country: 'GB' },
  { id: 'manchester-city', name: 'Manchester City', country: 'GB' },
  { id: 'manchester-united', name: 'Manchester United', country: 'GB' },
  { id: 'newcastle', name: 'Newcastle', country: 'GB' },
  { id: 'nottingham', name: 'Nottingham F.', country: 'GB' },
  { id: 'southampton', name: 'Southampton', country: 'GB' },
  { id: 'tottenham', name: 'Tottenham', country: 'GB' },
  { id: 'west-ham', name: 'West Ham', country: 'GB' },
  { id: 'wolves', name: 'Wolverhampton', country: 'GB' },

  // LL
  { id: 'alaves', name: 'Alavés', country: 'ES' },
  { id: 'athletic-club', name: 'Athletic Club', country: 'ES' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', country: 'ES' },
  { id: 'barcelona', name: 'Barcelona', country: 'ES' },
  { id: 'celta-vigo', name: 'Celta Vigo', country: 'ES' },
  { id: 'espanyol', name: 'Espanyol', country: 'ES' },
  { id: 'getafe', name: 'Getafe', country: 'ES' },
  { id: 'girona', name: 'Girona', country: 'ES' },
  { id: 'las-palmas', name: 'Las Palmas', country: 'ES' },
  { id: 'leganes', name: 'Leganés', country: 'ES' },
  { id: 'mallorca', name: 'Mallorca', country: 'ES' },
  { id: 'osasuna', name: 'Osasuna', country: 'ES' },
  { id: 'rayo-vallecano', name: 'Rayo Vallecano', country: 'ES' },
  { id: 'real-betis', name: 'Real Betis', country: 'ES' },
  { id: 'real-madrid', name: 'Real Madrid', country: 'ES' },
  { id: 'real-sociedad', name: 'Real Sociedad', country: 'ES' },
  { id: 'sevilla', name: 'Sevilla', country: 'ES' },
  { id: 'valencia', name: 'Valencia', country: 'ES' },
  { id: 'valladolid', name: 'Valladolid', country: 'ES' },
  { id: 'villarreal', name: 'Villarreal', country: 'ES' },

  // BL
  { id: 'augsburg', name: 'Augsburg', country: 'DE' },
  { id: 'bayern-munich', name: 'Bayern Munich', country: 'DE' },
  { id: 'bochum', name: 'Bochum', country: 'DE' },
  { id: 'werder-bremen', name: 'Werder Bremen', country: 'DE' },
  { id: 'dortmund', name: 'Dortmund', country: 'DE' },
  { id: 'eintracht-frankfurt', name: 'E. Frankfurt', country: 'DE' },
  { id: 'freiburg', name: 'Freiburg', country: 'DE' },
  { id: 'heidenheim', name: 'Heidenheim', country: 'DE' },
  { id: 'hoffenheim', name: 'Hoffenheim', country: 'DE' },
  { id: 'holstein-kiel', name: 'Holstein Kiel', country: 'DE' },
  { id: 'rb-leipzig', name: 'RB Leipzig', country: 'DE' },
  { id: 'bayer-leverkusen', name: 'Leverkusen', country: 'DE' },
  { id: 'mainz', name: 'Mainz 05', country: 'DE' },
  { id: 'borussia-monchengladbach', name: 'Mönchengladbach', country: 'DE' },
  { id: 'st-pauli', name: 'St. Pauli', country: 'DE' },
  { id: 'stuttgart', name: 'Stuttgart', country: 'DE' },
  { id: 'union-berlin', name: 'Union Berlin', country: 'DE' },
  { id: 'wolfsburg', name: 'Wolfsburg', country: 'DE' },

  // L1
  { id: 'angers', name: 'Angers', country: 'FR' },
  { id: 'auxerre', name: 'Auxerre', country: 'FR' },
  { id: 'brest', name: 'Brest', country: 'FR' },
  { id: 'le-havre', name: 'Le Havre', country: 'FR' },
  { id: 'lens', name: 'Lens', country: 'FR' },
  { id: 'lille', name: 'Lille', country: 'FR' },
  { id: 'lyon', name: 'Lyon', country: 'FR' },
  { id: 'marseille', name: 'Marseille', country: 'FR' },
  { id: 'monaco', name: 'Monaco', country: 'FR' },
  { id: 'montpellier', name: 'Montpellier', country: 'FR' },
  { id: 'nantes', name: 'Nantes', country: 'FR' },
  { id: 'nice', name: 'Nice', country: 'FR' },
  { id: 'psg', name: 'PSG', country: 'FR' },
  { id: 'reims', name: 'Reims', country: 'FR' },
  { id: 'rennes', name: 'Rennes', country: 'FR' },
  { id: 'saint-etienne', name: 'Saint-Étienne', country: 'FR' },
  { id: 'strasbourg', name: 'Strasbourg', country: 'FR' },
  { id: 'toulouse', name: 'Toulouse', country: 'FR' }
];

const knownSquads = {
  'real-madrid': {
    coach: 'Carlo Ancelotti', staff: ['Davide Ancelotti', 'Antonio Pintus'],
    players: [
      { n: 1, p: 'Portiere', name: 'Thibaut Courtois', country: 'BE' },
      { n: 13, p: 'Portiere', name: 'Andriy Lunin', country: 'UA' },
      { n: 2, p: 'Difensore', name: 'Dani Carvajal', country: 'ES' },
      { n: 3, p: 'Difensore', name: 'Eder Militão', country: 'BR' },
      { n: 4, p: 'Difensore', name: 'David Alaba', country: 'AT' },
      { n: 22, p: 'Difensore', name: 'Antonio Rüdiger', country: 'DE' },
      { n: 23, p: 'Difensore', name: 'Ferland Mendy', country: 'FR' },
      { n: 8, p: 'Centrocampista', name: 'Federico Valverde', country: 'UY' },
      { n: 14, p: 'Centrocampista', name: 'Aurélien Tchouaméni', country: 'FR' },
      { n: 6, p: 'Centrocampista', name: 'Eduardo Camavinga', country: 'FR' },
      { n: 5, p: 'Centrocampista', name: 'Jude Bellingham', country: 'GB' },
      { n: 10, p: 'Centrocampista', name: 'Luka Modrić', country: 'HR' },
      { n: 21, p: 'Centrocampista', name: 'Brahim Díaz', country: 'MA' },
      { n: 7, p: 'Attaccante', name: 'Vinícius Júnior', country: 'BR' },
      { n: 9, p: 'Attaccante', name: 'Kylian Mbappé', country: 'FR' },
      { n: 11, p: 'Attaccante', name: 'Rodrygo', country: 'BR' },
      { n: 16, p: 'Attaccante', name: 'Endrick', country: 'BR' }
    ]
  },
  'barcelona': {
    coach: 'Hansi Flick', staff: ['Marcus Sorg'],
    players: [
      { n: 1, p: 'Portiere', name: 'Marc-André ter Stegen', country: 'DE' },
      { n: 4, p: 'Difensore', name: 'Ronald Araujo', country: 'UY' },
      { n: 23, p: 'Difensore', name: 'Jules Koundé', country: 'FR' },
      { n: 3, p: 'Difensore', name: 'Alejandro Balde', country: 'ES' },
      { n: 15, p: 'Difensore', name: 'Andreas Christensen', country: 'DK' },
      { n: 8, p: 'Centrocampista', name: 'Pedri', country: 'ES' },
      { n: 6, p: 'Centrocampista', name: 'Gavi', country: 'ES' },
      { n: 21, p: 'Centrocampista', name: 'Frenkie de Jong', country: 'NL' },
      { n: 20, p: 'Centrocampista', name: 'Dani Olmo', country: 'ES' },
      { n: 9, p: 'Attaccante', name: 'Robert Lewandowski', country: 'PL' },
      { n: 19, p: 'Attaccante', name: 'Lamine Yamal', country: 'ES' },
      { n: 11, p: 'Attaccante', name: 'Raphinha', country: 'BR' }
    ]
  },
  'manchester-city': {
    coach: 'Pep Guardiola', staff: ['Juanma Lillo'],
    players: [
      { n: 31, p: 'Portiere', name: 'Ederson', country: 'BR' },
      { n: 3, p: 'Difensore', name: 'Rúben Dias', country: 'PT' },
      { n: 2, p: 'Difensore', name: 'Kyle Walker', country: 'GB' },
      { n: 24, p: 'Difensore', name: 'Joško Gvardiol', country: 'HR' },
      { n: 16, p: 'Centrocampista', name: 'Rodri', country: 'ES' },
      { n: 17, p: 'Centrocampista', name: 'Kevin De Bruyne', country: 'BE' },
      { n: 20, p: 'Centrocampista', name: 'Bernardo Silva', country: 'PT' },
      { n: 47, p: 'Centrocampista', name: 'Phil Foden', country: 'GB' },
      { n: 9, p: 'Attaccante', name: 'Erling Haaland', country: 'NO' },
      { n: 11, p: 'Attaccante', name: 'Jérémy Doku', country: 'BE' }
    ]
  },
  'arsenal': {
    coach: 'Mikel Arteta', staff: ['Albert Stuivenberg'],
    players: [
      { n: 22, p: 'Portiere', name: 'David Raya', country: 'ES' },
      { n: 2, p: 'Difensore', name: 'William Saliba', country: 'FR' },
      { n: 6, p: 'Difensore', name: 'Gabriel Magalhães', country: 'BR' },
      { n: 4, p: 'Difensore', name: 'Ben White', country: 'GB' },
      { n: 41, p: 'Centrocampista', name: 'Declan Rice', country: 'GB' },
      { n: 8, p: 'Centrocampista', name: 'Martin Ødegaard', country: 'NO' },
      { n: 7, p: 'Attaccante', name: 'Bukayo Saka', country: 'GB' },
      { n: 29, p: 'Attaccante', name: 'Kai Havertz', country: 'DE' }
    ]
  },
  'bayern-munich': {
    coach: 'Vincent Kompany', staff: ['Rene Maric'],
    players: [
      { n: 1, p: 'Portiere', name: 'Manuel Neuer', country: 'DE' },
      { n: 2, p: 'Difensore', name: 'Dayot Upamecano', country: 'FR' },
      { n: 19, p: 'Difensore', name: 'Alphonso Davies', country: 'CA' },
      { n: 6, p: 'Centrocampista', name: 'Joshua Kimmich', country: 'DE' },
      { n: 42, p: 'Centrocampista', name: 'Jamal Musiala', country: 'DE' },
      { n: 9, p: 'Attaccante', name: 'Harry Kane', country: 'GB' },
      { n: 10, p: 'Attaccante', name: 'Leroy Sané', country: 'DE' }
    ]
  },
  'psg': {
    coach: 'Luis Enrique', staff: ['Rafel Pol'],
    players: [
      { n: 99, p: 'Portiere', name: 'Gianluigi Donnarumma', country: 'IT' },
      { n: 5, p: 'Difensore', name: 'Marquinhos', country: 'BR' },
      { n: 2, p: 'Difensore', name: 'Achraf Hakimi', country: 'MA' },
      { n: 33, p: 'Centrocampista', name: 'Warren Zaïre-Emery', country: 'FR' },
      { n: 17, p: 'Centrocampista', name: 'Vitinha', country: 'PT' },
      { n: 10, p: 'Attaccante', name: 'Ousmane Dembélé', country: 'FR' },
      { n: 29, p: 'Attaccante', name: 'Bradley Barcola', country: 'FR' }
    ]
  }
};

const names = {
  GB: {
    first: ['Jack', 'Harry', 'Oliver', 'Charlie', 'Thomas', 'James', 'William', 'George', 'Joe', 'Ben', 'Sam', 'Luke', 'Max'],
    last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright', 'Thompson']
  },
  ES: {
    first: ['Alejandro', 'Daniel', 'Pablo', 'David', 'Adrian', 'Javier', 'Carlos', 'Diego', 'Sergio', 'Marcos', 'Miguel', 'Raul'],
    last: ['Garcia', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Gomez', 'Martin', 'Jimenez']
  },
  DE: {
    first: ['Lukas', 'Leon', 'Felix', 'Finn', 'Elias', 'Jonas', 'Paul', 'Tim', 'Max', 'Moritz', 'Jan', 'Philipp', 'Julian'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer', 'Koch']
  },
  FR: {
    first: ['Lucas', 'Hugo', 'Arthur', 'Louis', 'Jules', 'Léo', 'Gabriel', 'Raphaël', 'Paul', 'Tom', 'Antoine', 'Mathis', 'Nathan'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent']
  }
};

function generateRandomPlayer(countryCode, position, number) {
  const c = names[countryCode] || names['GB'];
  const f = c.first[Math.floor(Math.random() * c.first.length)];
  const l = c.last[Math.floor(Math.random() * c.last.length)];
  return { n: number, p: position, name: `${f} ${l}`, country: countryCode };
}

async function populateDB() {
  await pool.query('DELETE FROM players WHERE team_id NOT IN (SELECT id FROM unnest($1::text[]) as t(id))', [
    ['atalanta','bologna','cagliari','como','fiorentina','frosinone','genoa','inter','juventus','lazio','lecce','milan','monza','napoli','parma','roma','sassuolo','torino','udinese','venezia',
     'bari','brescia','catanzaro','cesena','cittadella','cosenza','cremonese','empoli','juvestabia','mantova','modena','palermo','pisa','reggiana','salernitana','sampdoria','spezia','sudtirol','verona','carrarese']
  ]); // Delete existing foreign teams if any to avoid dupes

  let totalInserted = 0;

  for (const team of ALL_TEAMS) {
    let squad = knownSquads[team.id];
    let players = [];
    let coachName = 'Allenatore';
    let staffNames = ['Preparatore', 'Vice'];
    
    if (squad) {
      players = squad.players;
      coachName = squad.coach;
      staffNames = squad.staff;
    }

    // Fill up to 22 players if not enough
    const posList = ['Portiere', 'Portiere', 'Difensore', 'Difensore', 'Difensore', 'Difensore', 'Difensore', 'Difensore', 'Difensore', 'Centrocampista', 'Centrocampista', 'Centrocampista', 'Centrocampista', 'Centrocampista', 'Centrocampista', 'Centrocampista', 'Attaccante', 'Attaccante', 'Attaccante', 'Attaccante', 'Attaccante', 'Attaccante'];
    
    let currentNumbers = new Set(players.map(p => p.n));
    let numIdx = 2;
    
    for (const pos of posList) {
      if (players.length >= 24) break;
      if (players.filter(p => p.p === pos).length >= posList.filter(p => p === pos).length) continue;
      
      while (currentNumbers.has(numIdx)) numIdx++;
      players.push(generateRandomPlayer(team.country, pos, numIdx));
      currentNumbers.add(numIdx);
    }
    
    // Sort by role then number
    const roleOrder = { 'Portiere': 1, 'Difensore': 2, 'Centrocampista': 3, 'Attaccante': 4 };
    players.sort((a, b) => roleOrder[a.p] - roleOrder[b.p] || a.n - b.n);

    if (!squad) {
      coachName = generateRandomPlayer(team.country, '', 0).name;
      staffNames = [generateRandomPlayer(team.country, '', 0).name, generateRandomPlayer(team.country, '', 0).name];
    }

    // INSERT COACH
    await pool.query(
      'INSERT INTO players (team_id, name, role, number, squad_type, is_coach, is_staff) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [team.id, coachName, 'Allenatore', null, 'first', true, false]
    );

    // INSERT STAFF
    for (const st of staffNames) {
      await pool.query(
        'INSERT INTO players (team_id, name, role, number, squad_type, is_coach, is_staff) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [team.id, st, 'Staff', null, 'first', false, true]
      );
    }

    // INSERT PLAYERS
    for (const p of players) {
      await pool.query(
        'INSERT INTO players (team_id, name, role, number, squad_type, is_coach, is_staff) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [team.id, p.name, p.p, p.n, 'first', false, false]
      );
      totalInserted++;
    }
    
    console.log(`Inserted ${players.length} players for ${team.name}`);
  }

  console.log(`Done. Total players inserted: ${totalInserted}`);
  process.exit(0);
}

populateDB().catch(console.error);
