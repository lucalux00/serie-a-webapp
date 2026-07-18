require('dotenv').config({ path: '.env.local' });

async function testGeminiSearch() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const title = "Juventus, ufficiale Zeki Celik a parametro zero";
  
  const prompt = `
Sei un esperto giornalista sportivo.
Cerca informazioni recenti su questa notizia e scrivi un riassunto di 2-3 paragrafi.
Notizia: ${title}
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }]
    })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
testGeminiSearch();
