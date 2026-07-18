import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { url, title, snippet, source } = await request.json();

    if (!title && !url) {
      return NextResponse.json({ error: 'Dati mancanti per il riassunto' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ summary: 'Chiave API Gemini mancante. Impossibile generare il riassunto.' }, { status: 500 });
    }

    const prompt = `
Sei un giornalista sportivo professionista.
Il tuo compito è scrivere un breve pezzo discorsivo (1 o 2 paragrafi) basandoti ESCLUSIVAMENTE sulle seguenti informazioni.
REGOLA FONDAMENTALE: NON DEVI INVENTARE NULLA. Usa solo fatti reali deducibili dal testo fornito. Non inventare cifre, date o nomi non presenti. Se l'informazione è frammentaria, scrivi un riassunto molto breve e coerente.

Titolo: ${title || 'Nessun titolo'}
Snippet/Estratto: ${snippet || 'Nessun estratto'}
Fonte originaria: ${source || 'Fonte generica'}

Scrivi in italiano corretto, scorrevole e giornalistico. Non usare elenchi puntati.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API Error:", errorText);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          return NextResponse.json({ summary: `Errore Gemini API: ${errorJson.error.message}` });
        }
      } catch (e) {}
      return NextResponse.json({ summary: "Errore dal server Gemini (Probabile limite di quota o chiave invalida)." });
    }

    const geminiData = await geminiRes.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessun riassunto generato.';

    return NextResponse.json({ summary: summary.trim() });

  } catch (error: any) {
    console.error("Summarize Error:", error.message);
    return NextResponse.json({ error: error.message || 'Errore imprevisto' }, { status: 500 });
  }
}
