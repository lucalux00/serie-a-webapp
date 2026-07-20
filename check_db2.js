require('dotenv').config({path: '.env.local'});
const { createClient } = require('@vercel/postgres');

async function check() {
  const client = createClient();
  await client.connect();
  const res = await client.query(`
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = 'ml_explanations'::regclass AND i.indisprimary;
  `);
  console.log('PK ml_explanations:', res.rows);
  const res2 = await client.query(`
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = 'daily_ai_predictions'::regclass AND i.indisprimary;
  `);
  console.log('PK daily_ai_predictions:', res2.rows);
  await client.end();
}
check().catch(console.error);
