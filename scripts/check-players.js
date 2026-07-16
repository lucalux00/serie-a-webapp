require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function run() {
  // Check players table structure
  const { rows: cols } = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'players' 
    ORDER BY ordinal_position;
  `;
  console.log('\n=== PLAYERS TABLE COLUMNS ===');
  cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

  // Check total count
  const { rows: count } = await sql`SELECT COUNT(*) as total FROM players`;
  console.log(`\nTotal players in DB: ${count[0].total}`);

  // Sample rows for a known team
  const { rows: sample } = await sql`
    SELECT team_id, name, role, squad_type, is_coach, is_staff, number
    FROM players 
    WHERE team_id = 'napoli' 
    LIMIT 10;
  `;
  console.log('\n=== NAPOLI PLAYERS SAMPLE ===');
  if (sample.length === 0) {
    console.log('NO PLAYERS FOUND FOR NAPOLI!');
    // Try to find what team_ids are actually stored
    const { rows: teams } = await sql`SELECT DISTINCT team_id FROM players LIMIT 30`;
    console.log('\nTeam IDs in DB:', teams.map(t => t.team_id).join(', '));
  } else {
    sample.forEach(p => console.log(`  [${p.squad_type}] #${p.number} ${p.name} - ${p.role} | coach:${p.is_coach} staff:${p.is_staff}`));
  }

  // Check distinct squad_type values
  const { rows: sqTypes } = await sql`SELECT DISTINCT squad_type, count(*) as cnt FROM players GROUP BY squad_type`;
  console.log('\n=== SQUAD_TYPE DISTRIBUTION ===');
  sqTypes.forEach(s => console.log(`  ${s.squad_type}: ${s.cnt} players`));
  
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
