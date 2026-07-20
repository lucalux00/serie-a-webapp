require('dotenv').config({path: '.env.local'});
const { createClient } = require('@vercel/postgres');
const fetch = require('node-fetch');

async function test() {
  const url = 'http://localhost:3000/api/cron/pronostici'; // We cannot run localhost if it's not running
  // Let's just import the function directly and call it if possible, or run Next.js?
  // Easier: I will just simulate the football API call and the Gemini call, or look at the Vercel logs more closely.
}
