const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_R5rjULKleA3w@ep-patient-poetry-adswpqiv.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  await client.connect();
  console.log('Connesso al DB Neon');

  await client.query(
    'CREATE TABLE IF NOT EXISTS banners (' +
    '  id SERIAL PRIMARY KEY,' +
    '  title VARCHAR(100),' +
    '  message TEXT NOT NULL,' +
    '  link VARCHAR(500),' +
    '  link_label VARCHAR(100),' +
    '  type VARCHAR(20) NOT NULL DEFAULT \'info\',' +
    '  is_active BOOLEAN NOT NULL DEFAULT true,' +
    '  start_date TIMESTAMPTZ,' +
    '  end_date TIMESTAMPTZ,' +
    '  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),' +
    '  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' +
    ')'
  );
  console.log('OK - Tabella banners creata');

  await client.query(
    'CREATE TABLE IF NOT EXISTS subscriptions (' +
    '  id SERIAL PRIMARY KEY,' +
    '  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,' +
    '  plan VARCHAR(20) NOT NULL DEFAULT \'free\',' +
    '  stripe_customer_id VARCHAR(200),' +
    '  stripe_subscription_id VARCHAR(200),' +
    '  status VARCHAR(50) NOT NULL DEFAULT \'inactive\',' +
    '  current_period_start TIMESTAMPTZ,' +
    '  current_period_end TIMESTAMPTZ,' +
    '  cancel_at_period_end BOOLEAN DEFAULT false,' +
    '  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),' +
    '  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),' +
    '  UNIQUE(user_id)' +
    ')'
  );
  console.log('OK - Tabella subscriptions creata');

  const res = await client.query('SELECT COUNT(*) FROM banners');
  const count = parseInt(res.rows[0].count);
  console.log('Banner esistenti: ' + count);

  if (count === 0) {
    await client.query(
      'INSERT INTO banners (title, message, link, link_label, type, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
      ['\u26a1 AI Pro', 'Sblocca statistiche avanzate AI per il tuo Fantacalcio! Solo \u20ac0,99/mese.', '/fantacalcio', 'Scopri', 'promo', true]
    );
    console.log('OK - Banner esempio inserito');
  }

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log('Tabelle nel DB: ' + tables.rows.map(function(r) { return r.table_name; }).join(', '));

  await client.end();
  console.log('Migrazione completata con successo!');
}

migrate().catch(function(e) {
  console.error('ERRORE:', e.message);
  process.exit(1);
});
