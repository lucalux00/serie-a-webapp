import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GoogleGenAI } from '@google/genai';
import { parseStringPromise } from 'xml2js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // Consenti fino a 60s per il task AI su Vercel Pro/Hobby

// Helper per normalizzare il nome squadra nell'ID
function normalizeTeamId(teamName: string): string | null {
  if (!teamName) return null;
  const t = teamName.toLowerCase();
  if (t.includes('atalanta')) return 'atalanta';
  if (t.includes('bologna')) return 'bologna';
  if (t.includes('cagliari')) return 'cagliari';
  if (t.includes('como')) return 'como';
  if (t.includes('fiorentina')) return 'fiorentina';
  if (t.includes('frosinone')) return 'frosinone';
  if (t.includes('genoa')) return 'genoa';
  if (t.includes('inter')) return 'inter';
  if (t.includes('juve')) return 'juventus';
  if (t.includes('lazio')) return 'lazio';
  if (t.includes('lecce')) return 'lecce';
  if (t.includes('milan')) return 'milan';
  if (t.includes('monza')) return 'monza';
  if (t.includes('napoli')) return 'napoli';
  if (t.includes('parma')) return 'parma';
  if (t.includes('roma')) return 'roma';
  if (t.includes('sassuolo')) return 'sassuolo';
  if (t.includes('torino')) return 'torino';
  if (t.includes('udinese')) return 'udinese';
  if (t.includes('venezia')) return 'venezia';
  return null;
}

export async function GET(request: Request) {
  // Verifica se è una chiamata Vercel Cron (opzionale per test locale)
  const authHeader = request.headers.get('authorization');
  if (process.env.VERCEL_ENV === 'production' && authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY mancante' }, { status: 500 });
  }

  try {
    // 1. Fetch delle notizie RSS (Google News)
    const url = \`https://news.google.com/rss/search?q=\${encodeURIComponent('"ufficiale" calciomercato serie a')}&hl=it&gl=IT&ceid=IT:it\`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error("Errore fetch RSS");
    
    const xml = await res.text();
    const result = await parseStringPromise(xml);
    const items = result?.rss?.channel?.[0]?.item || [];
    
    // Prendiamo i primi 15 titoli più recenti
    const newsTexts = items.slice(0, 15).map((item: any) => item.title?.[0]).join('\\n- ');

    if (!newsTexts.trim()) {
      return NextResponse.json({ message: 'Nessuna news trovata' });
    }

    // 2. Chiamata a Gemini per estrarre i trasferimenti
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = \`
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
    \`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawJson = response.text || "[]";
    // Pulizia JSON da backticks Markdown se presenti
    if (rawJson.includes('\`\`\`')) {
      rawJson = rawJson.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    
    const transfersExtracted = JSON.parse(rawJson);
    let insertedCount = 0;

    // 3. Salvataggio nel database bidirezionale
    for (const t of transfersExtracted) {
      if (!t.player || (!t.buying_team && !t.selling_team)) continue;

      const buyerId = normalizeTeamId(t.buying_team);
      const sellerId = normalizeTeamId(t.selling_team);

      const fee = t.fee || 'N/D';
      const salary = t.salary || 'Non specificato';
      const dateLabel = t.date || 'Oggi';

      // Insert per il BUYER (Acquisto)
      if (buyerId) {
        // Controllo duplicato (se c'è già un acquisto per questo giocatore e questo team)
        const checkBuyer = await sql\`SELECT id FROM transfers WHERE team_id = \${buyerId} AND player ILIKE \${'%' + t.player + '%'} AND type = 'acquisto'\`;
        if (checkBuyer.rowCount === 0) {
          await sql\`
            INSERT INTO transfers (team_id, type, player, other_team, fee, salary, date, status)
            VALUES (\${buyerId}, 'acquisto', \${t.player}, \${t.selling_team || 'Svincolato'}, \${fee}, \${salary}, \${dateLabel}, 'Ufficiale')
          \`;
          insertedCount++;
        }
      }

      // Insert per il SELLER (Cessione)
      if (sellerId) {
        const checkSeller = await sql\`SELECT id FROM transfers WHERE team_id = \${sellerId} AND player ILIKE \${'%' + t.player + '%'} AND type = 'cessione'\`;
        if (checkSeller.rowCount === 0) {
          await sql\`
            INSERT INTO transfers (team_id, type, player, other_team, fee, salary, date, status)
            VALUES (\${sellerId}, 'cessione', \${t.player}, \${t.buying_team || 'Svincolato'}, \${fee}, \${salary}, \${dateLabel}, 'Ufficiale')
          \`;
          insertedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: \`Processato con successo. Righe inserite: \${insertedCount}\`,
      data: transfersExtracted 
    });

  } catch (error: any) {
    console.error("Cron Mercato Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
