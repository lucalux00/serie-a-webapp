import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateExplanation(matchStr: string, pick: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `Sei l'algoritmo statistico ufficiale di una piattaforma di pronostici sportivi di alto livello.
Hai appena suggerito l'esito "${pick}" per la partita "${matchStr}".

Scrivi un'analisi statistica e tattica dettagliata (circa 3-4 paragrafi brevi) che giustifichi questa scelta in modo convincente e autorevole.
Usa argomentazioni basate su stato di forma, statistiche recenti, storici degli scontri diretti e moduli tattici.
Scrivi in italiano, in terza persona, con un tono analitico e giornalistico. Usa tag HTML di base (<p>, <strong>, <ul>) per formattare la risposta e renderla leggibile.

Esempio di output:
<p>L'algoritmo ha individuato un netto vantaggio per l'esito <strong>${pick}</strong>. Il modello statistico evidenzia come...</p>

Rispondi SOLO con il codice HTML dell'analisi, senza backtick o markdown aggiuntivo.`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    // Pulisce eventuali rimasugli di markdown HTML generati da Gemini
    text = text.replace(/```html/gi, '').replace(/```/g, '').trim();
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');
    const matchStr = searchParams.get('match');
    const pick = searchParams.get('pick');

    if (!matchId || !matchStr || !pick) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    // 1. Controlla Cache DB
    const { rows } = await sql`SELECT analysis FROM ml_explanations WHERE match_id = ${matchId}`;
    
    if (rows.length > 0) {
      return NextResponse.json({ analysis: rows[0].analysis });
    }

    // 2. Genera con Gemini
    const analysis = await generateExplanation(matchStr, pick);
    if (analysis) {
      // 3. Salva in DB
      await sql`
        INSERT INTO ml_explanations (match_id, analysis)
        VALUES (${matchId}, ${analysis})
        ON CONFLICT (match_id) DO NOTHING
      `;
      return NextResponse.json({ analysis });
    } else {
      return NextResponse.json({ error: 'Impossibile generare l\'analisi' }, { status: 500 });
    }

  } catch (error) {
    console.error("GET /api/pronostici/spiegazione error:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
