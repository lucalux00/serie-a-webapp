/**
 * Gemini AI — Libreria centralizzata
 *
 * Sostituisce l'uso duplicato di @google/genai e @google/generative-ai.
 * Tutte le route devono importare da qui.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[gemini.ts] GEMINI_API_KEY non configurata.');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/** Modello da usare in tutta l'app */
export const GEMINI_MODEL = 'gemini-flash-lite-latest';

/**
 * Genera testo (output libero, es. HTML)
 */
export async function generateText(prompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    // Pulisce eventuali fence markdown
    text = text.replace(/```json/gi, '').replace(/```html/gi, '').replace(/```/g, '').trim();
    return text;
  } catch (err) {
    console.error('[gemini.ts] generateText error:', err);
    return null;
  }
}

/**
 * Genera JSON strutturato (responseMimeType: application/json)
 */
export async function generateJSON<T = unknown>(prompt: string): Promise<T | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('[gemini.ts] generateJSON error:', err);
    return null;
  }
}
