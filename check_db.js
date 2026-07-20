require('dotenv').config({path: '.env.local'});
const { createClient } = require('@vercel/postgres');

async function check() {
  const client = createClient();
  await client.connect();
  const res = await client.query(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('ml_explanations', 'daily_ai_predictions');`);
  console.log(res.rows);
  const constr = await client.query(`SELECT conname, contype, conrelid::regclass FROM pg_constraint WHERE conrelid::regclass::text IN ('ml_explanations', 'daily_ai_predictions');`);
  console.log(constr.rows);
  await client.end();
}
check().catch(console.error);
