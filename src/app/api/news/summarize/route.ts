import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Fetching the HTML content of the article
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer to clean up
    $('script, style, nav, footer, header, aside, .ad, .advertisement, iframe').remove();

    // Extract all paragraphs
    const paragraphs: string[] = [];
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        paragraphs.push(text);
      }
    });

    const articleText = paragraphs.join('\n\n').substring(0, 8000); // Limit to reasonable length

    if (!articleText || articleText.length < 100) {
      return NextResponse.json({ summary: 'Non è stato possibile estrarre il testo da questa pagina.' });
    }

    // 2. Call Gemini API to summarize
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ summary: 'Chiave API Gemini mancante. Impossibile generare il riassunto.' }, { status: 500 });
    }

    const prompt = `
Sei un esperto giornalista sportivo.
Riassumi il seguente articolo di calciomercato o calcio giocato in 2-3 brevi paragrafi.
Scrivi in italiano corretto, in modo chiaro, discorsivo e senza punti elenco.
Non aggiungere informazioni che non sono presenti nel testo.
Se ci sono cifre di mercato (prezzi, stipendi) o nomi di squadre/giocatori, assicurati di includerli.

Testo dell'articolo:
${articleText}
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
      throw new Error("Errore durante la generazione del riassunto");
    }

    const geminiData = await geminiRes.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessun riassunto generato.';

    return NextResponse.json({ summary: summary.trim() });

  } catch (error: any) {
    console.error("Summarize Error:", error.message);
    return NextResponse.json({ error: error.message || 'Errore imprevisto' }, { status: 500 });
  }
}
