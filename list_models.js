const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envStr.match(/GEMINI_API_KEY="([^"]+)"/);
const GEMINI_API_KEY = keyMatch ? keyMatch[1] : null;

fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + GEMINI_API_KEY)
  .then(r => r.json())
  .then(data => {
    console.log(data.models.map(m => m.name));
  })
  .catch(console.error);
