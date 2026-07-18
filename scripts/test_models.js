require('dotenv').config({ path: '.env.local' });

async function testGemini() {
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log("Key prefix:", geminiKey ? geminiKey.substring(0, 5) : "none");
  
  const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  
  for (const model of models) {
    console.log(`\nTesting ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Ciao" }] }] })
      });
      const data = await res.text();
      console.log(`Status: ${res.status}`);
      if (!res.ok) console.log(`Error: ${data.substring(0, 150)}`);
      else console.log(`Success!`);
    } catch (e) {
      console.error(e.message);
    }
  }
}
testGemini();
