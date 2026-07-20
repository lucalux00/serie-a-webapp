import { config } from 'dotenv';
config({ path: '.env.local' });
import { GoogleGenAI } from '@google/genai';

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash-8b',
    contents: 'Say hello',
  });
  console.log('Response from gemini-1.5-flash-8b:', response.text);
}
run().catch(console.error);
