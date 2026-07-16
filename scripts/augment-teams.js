const fs = require('fs');
const path = require('path');

const DOMAINS = {
  'atalanta': { d: 'atalanta.it', c1: '#135c91', c2: '#000000' },
  'bologna': { d: 'bolognafc.it', c1: '#0F2653', c2: '#E71337' },
  'cagliari': { d: 'cagliaricalcio.com', c1: '#00254C', c2: '#D6002A' },
  'como': { d: 'comofootball.com', c1: '#004A95', c2: '#FFFFFF' },
  'fiorentina': { d: 'acffiorentina.com', c1: '#4F3585', c2: '#FFFFFF' },
  'genoa': { d: 'genoacfc.it', c1: '#B91225', c2: '#002F55' },
  'inter': { d: 'inter.it', c1: '#00479E', c2: '#000000' },
  'juventus': { d: 'juventus.com', c1: '#000000', c2: '#FFFFFF' },
  'lazio': { d: 'sslazio.it', c1: '#84BBE1', c2: '#FFFFFF' },
  'lecce': { d: 'uslecce.it', c1: '#FFD700', c2: '#D50000' },
  'milan': { d: 'acmilan.com', c1: '#FB090B', c2: '#000000' },
  'monza': { d: 'acmonza.com', c1: '#E11823', c2: '#FFFFFF' },
  'napoli': { d: 'sscnapoli.it', c1: '#12A0D7', c2: '#FFFFFF' },
  'parma': { d: 'parmacalcio1913.com', c1: '#FEE000', c2: '#0026C1' },
  'roma': { d: 'asroma.com', c1: '#9A0B27', c2: '#F4942A' },
  'sassuolo': { d: 'sassuolocalcio.it', c1: '#00A850', c2: '#000000' },
  'torino': { d: 'torinofc.it', c1: '#891436', c2: '#FFFFFF' },
  'udinese': { d: 'udinese.it', c1: '#000000', c2: '#FFFFFF' },
  'venezia': { d: 'veneziafc.it', c1: '#000000', c2: '#F38118' },
  
  'arsenal': { d: 'arsenal.com', c1: '#EF0107', c2: '#023474' },
  'aston-villa': { d: 'avfc.co.uk', c1: '#670E36', c2: '#95BFE5' },
  'chelsea': { d: 'chelseafc.com', c1: '#034694', c2: '#FFFFFF' },
  'everton': { d: 'evertonfc.com', c1: '#003399', c2: '#FFFFFF' },
  'liverpool': { d: 'liverpoolfc.com', c1: '#C8102E', c2: '#00B2A9' },
  'manchester-city': { d: 'mancity.com', c1: '#6CABDD', c2: '#1C2C5B' },
  'manchester-united': { d: 'manutd.com', c1: '#DA291C', c2: '#FBE122' },
  'newcastle': { d: 'nufc.co.uk', c1: '#000000', c2: '#FFFFFF' },
  'tottenham': { d: 'tottenhamhotspur.com', c1: '#132257', c2: '#FFFFFF' },
  
  'barcelona': { d: 'fcbarcelona.com', c1: '#A50044', c2: '#004D98' },
  'real-madrid': { d: 'realmadrid.com', c1: '#FFFFFF', c2: '#FEBE10' },
  'atletico-madrid': { d: 'atleticodemadrid.com', c1: '#CB3524', c2: '#272E61' },
  
  'bayern-munich': { d: 'fcbayern.com', c1: '#DC052D', c2: '#0066B2' },
  'dortmund': { d: 'bvb.de', c1: '#FDE100', c2: '#000000' },
  
  'psg': { d: 'psg.fr', c1: '#004170', c2: '#DA291C' }
};

function run() {
  const teamsPath = path.join(__dirname, '..', 'src', 'data', 'teams.ts');
  const teamsFile = fs.readFileSync(teamsPath, 'utf8');

  // Extract the array using regex
  const match = teamsFile.match(/export const ALL_TEAMS = (\[[\s\S]+?\]);/);
  if (!match) return;

  const teamsStr = match[1];
  
  // Parse via generic evaluate (unsafe ma siamo in build locale fidata)
  const teamsArray = eval(teamsStr);

  const updatedTeams = teamsArray.map(t => {
    let logoUrl, primaryColor, secondaryColor;
    if (DOMAINS[t.id]) {
      logoUrl = `https://logo.clearbit.com/${DOMAINS[t.id].d}`;
      primaryColor = DOMAINS[t.id].c1;
      secondaryColor = DOMAINS[t.id].c2;
    } else {
      // Colori random coerenti per l'id
      const hash = t.id.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
      const hColor = `#${Math.abs(hash).toString(16).substring(0, 6).padStart(6, '0')}`;
      primaryColor = hColor;
      secondaryColor = '#FFFFFF';
      logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=${primaryColor.substring(1)}&color=fff`;
    }
    return {
      ...t,
      logoUrl,
      primaryColor,
      secondaryColor
    };
  });

  const newContent = `export const ALL_TEAMS = ${JSON.stringify(updatedTeams, null, 2)};\n`;
  fs.writeFileSync(teamsPath, newContent);
  console.log("teams.ts aggiornato con successo con dati hardcoded/fallback!");
}

run();
