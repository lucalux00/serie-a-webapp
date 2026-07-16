require('dotenv').config({path: '.env.local'});
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const newsTexts = "- UFFICIALE - Colpo Napoli: preso Lautaro Martinez dall'Inter per 60M. Guadagnerà 8 milioni netti.\\n- UFFICIALE: La Juventus acquista Donnarumma dal PSG per 30M.";
  
  const prompt = `
      Sei un esperto giornalista di calciomercato. Leggi i seguenti titoli di giornale e identifica SOLO i trasferimenti UFFICIALI e CONCLUSI tra squadre di Serie A o verso la Serie A per la stagione estiva.
      
      Regole:
      - Estrai SOLO transazioni realmente concluse/ufficiali menzionate nei titoli.
      - Se il costo del cartellino non è specificato, scrivi "Dettagli non noti" o stima in base alla fama (es. "Svincolato", "Prestito").
      - Se lo stipendio non è specificato, usa la stringa "Non specificato".
      
      Rispondi ESATTAMENTE E SOLO con un JSON Array valido con questa struttura (niente markdown o backticks extra, solo il raw JSON array):
      [
        {
          "player": "Nome Giocatore",
          "buying_team": "Nome Squadra che Compra (es. Napoli)",
          "selling_team": "Nome Squadra che Vende (es. Inter)",
          "fee": "Costo (es. 30M € o Gratuito)",
          "salary": "Stipendio (es. 5M €/anno)",
          "date": "Oggi"
        }
      ]

      Titoli di oggi:
      - \${newsTexts}
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    console.log("Raw Response:");
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
