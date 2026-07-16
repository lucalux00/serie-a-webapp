require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');

function normalizeTeamId(teamName) {
  if (!teamName) return null;
  const t = teamName.toLowerCase();
  if (t.includes('atalanta')) return 'atalanta';
  if (t.includes('bologna')) return 'bologna';
  if (t.includes('cagliari')) return 'cagliari';
  if (t.includes('como')) return 'como';
  if (t.includes('fiorentina')) return 'fiorentina';
  if (t.includes('frosinone')) return 'frosinone';
  if (t.includes('genoa')) return 'genoa';
  if (t.includes('inter')) return 'inter';
  if (t.includes('juve')) return 'juventus';
  if (t.includes('lazio')) return 'lazio';
  if (t.includes('lecce')) return 'lecce';
  if (t.includes('milan')) return 'milan';
  if (t.includes('monza')) return 'monza';
  if (t.includes('napoli')) return 'napoli';
  if (t.includes('parma')) return 'parma';
  if (t.includes('roma')) return 'roma';
  if (t.includes('sassuolo')) return 'sassuolo';
  if (t.includes('torino')) return 'torino';
  if (t.includes('udinese')) return 'udinese';
  if (t.includes('venezia')) return 'venezia';
  return null;
}

const transfers = [
  { seller: "Catanzaro", buyer: "Como", player: "Mattia Liberali", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Leicester City", buyer: "Cagliari", player: "Harry Winks", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Union Berlino", buyer: "Lazio", player: "Danilho Doekhi", fee: "Parametro zero", salary: "Non divulgato" },
  { seller: "Hammarby", buyer: "Como", player: "Adrian Lahdo", fee: "10 mln €", salary: "Non divulgato" },
  { seller: "Cagliari", buyer: "Cremonese", player: "Sebastiano Luperto", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Marsiglia", buyer: "Sassuolo", player: "Darryl Bakola", fee: "10 mln €", salary: "Non divulgato" },
  { seller: "Juventus Next Gen", buyer: "Sassuolo", player: "Pedro Felipe", fee: "Prestito con diritto", salary: "Non divulgato" },
  { seller: "Getafe", buyer: "Como", player: "Luis Milla", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Tottenham", buyer: "Fiorentina", player: "Radu Dragusin", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Nizza", buyer: "Juventus", player: "Jeremie Boga", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Paris Saint-Germain", buyer: "Milan", player: "Gonçalo Ramos", fee: "65 mln € + 5 mln bonus", salary: "Non divulgato" },
  { seller: "West Ham", buyer: "Milan", player: "Niclas Fullkrug", fee: "Prestito con diritto", salary: "Non divulgato" },
  { seller: "Bayern Monaco", buyer: "Roma", player: "Bryan Zaragoza", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Aston Villa", buyer: "Roma", player: "Donyell Malen", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Sporting CP", buyer: "Napoli", player: "Alisson Santos", fee: "20 mln € (Riscatto)", salary: "Non divulgato" },
  { seller: "Manchester United", buyer: "Napoli", player: "Rasmus Hojlund", fee: "Titolo definitivo", salary: "Non divulgato" },
  { seller: "Atalanta", buyer: "Fiorentina", player: "Marco Brescianini", fee: "10 mln € (Riscatto)", salary: "Non divulgato" },
  { seller: "Reggiana", buyer: "Lazio", player: "Edoardo Motta", fee: "1.2 mln €", salary: "Non divulgato" },
  { seller: "Dinamo Zagabria", buyer: "Torino", player: "Sandro Kulenovic", fee: "3 mln € (Riscatto)", salary: "Non divulgato" }
];

async function seed() {
  let inserted = 0;
  for (const t of transfers) {
    const buyerId = normalizeTeamId(t.buyer);
    const sellerId = normalizeTeamId(t.seller);
    const typeBuyer = t.fee.toLowerCase().includes('prestito') ? 'Prestito' : 'Acquisto';
    const typeSeller = t.fee.toLowerCase().includes('prestito') ? 'Prestito' : 'Cessione';

    if (buyerId) {
      const checkBuyer = await sql`SELECT id FROM transfers WHERE team_id = ${buyerId} AND player = ${t.player} AND type = ${typeBuyer}`;
      if (checkBuyer.rowCount === 0) {
        await sql`
          INSERT INTO transfers (team_id, type, player, other_team, fee, salary, date, status)
          VALUES (${buyerId}, ${typeBuyer}, ${t.player}, ${t.seller}, ${t.fee}, ${t.salary}, 'Oggi', 'Ufficiale')
        `;
        inserted++;
      }
    }
    
    if (sellerId) {
      const checkSeller = await sql`SELECT id FROM transfers WHERE team_id = ${sellerId} AND player = ${t.player} AND type = ${typeSeller}`;
      if (checkSeller.rowCount === 0) {
        await sql`
          INSERT INTO transfers (team_id, type, player, other_team, fee, salary, date, status)
          VALUES (${sellerId}, ${typeSeller}, ${t.player}, ${t.buyer}, ${t.fee}, ${t.salary}, 'Oggi', 'Ufficiale')
        `;
        inserted++;
      }
    }
  }
  console.log(`Finito! Inserite ${inserted} righe bidirezionali.`);
  process.exit();
}
seed();
