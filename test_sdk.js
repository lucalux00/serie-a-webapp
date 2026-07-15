const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envStr.match(/GEMINI_API_KEY="([^"]+)"/);
const GEMINI_API_KEY = keyMatch ? keyMatch[1] : null;

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  try {
    const result = await model.generateContent("Ciao");
    console.log(result.response.text());
  } catch(e) {
    console.error(e);
  }
}
run();
