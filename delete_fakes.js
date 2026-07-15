const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteFakePlayers() {
  try {
    const res = await pool.query(`
      DELETE FROM players 
      WHERE team_id NOT IN (
        'atalanta','bologna','cagliari','como','fiorentina','frosinone','genoa','inter','juventus','lazio','lecce','milan','monza','napoli','parma','roma','sassuolo','torino','udinese','venezia',
        'bari','brescia','catanzaro','cesena','cittadella','cosenza','cremonese','empoli','juvestabia','mantova','modena','palermo','pisa','reggiana','salernitana','sampdoria','spezia','sudtirol','verona','carrarese'
      )
    `);
    console.log(`Deleted ${res.rowCount} fake players from foreign teams.`);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

deleteFakePlayers();
