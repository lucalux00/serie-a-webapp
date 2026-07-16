const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

const LEAGUE_CODES = {
  'A': 'SA',
  'PL': 'PL',
  'LL': 'PD',
  'BL': 'BL1',
  'L1': 'FL1',
};

async function run() {
  const teamsPath = path.join(__dirname, '../src/data/teams.ts');
  let content = fs.readFileSync(teamsPath, 'utf8');

  // Extract the JSON array string from teams.ts
  const jsonStart = content.indexOf('[');
  const jsonEnd = content.lastIndexOf(']') + 1;
  const jsonString = content.substring(jsonStart, jsonEnd);
  
  let teams = JSON.parse(jsonString);

  let updatedCount = 0;

  for (const [league, code] of Object.entries(LEAGUE_CODES)) {
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${code}/teams`, {
        headers: { 'X-Auth-Token': API_KEY }
      });
      if (!res.ok) {
        console.log(`Failed to fetch ${code}`);
        continue;
      }
      const data = await res.json();
      
      for (const t of data.teams) {
        // match with our teams
        const match = teams.find(ourTeam => {
          if (ourTeam.league !== league) return false;
          const ourName = ourTeam.name.toLowerCase().replace(/ f\.| fc| ac| as| ss/g, '').trim();
          const apiName = t.name.toLowerCase().replace(/ fc| ac| as| ss/g, '').trim();
          const apiShort = (t.shortName || '').toLowerCase().replace(/ fc| ac| as| ss/g, '').trim();
          return apiName.includes(ourName) || apiShort.includes(ourName) || ourName.includes(apiShort);
        });

        if (match) {
          match.logoUrl = t.crest;
          updatedCount++;
          console.log(`Updated logo for ${match.name}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Rewrite the file
  const newContent = `export const ALL_TEAMS = ${JSON.stringify(teams, null, 2)};\n`;
  fs.writeFileSync(teamsPath, newContent);
  console.log(`Done! Updated ${updatedCount} logos.`);
}

run();
