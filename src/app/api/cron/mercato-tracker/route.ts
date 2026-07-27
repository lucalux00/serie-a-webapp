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

function shouldRunCron(): boolean {
  const italianTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  const hour = italianTime.getHours();
  // Runs only 7 AM - midnight (7:00 - 23:59)
  return hour >= 7 && hour < 24;
}

export async function GET(request: Request) {
  // Verifica se è una chiamata Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.VERCEL_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!shouldRunCron()) {
    return NextResponse.json({ 
      success: true, 
      message: 'Outside business hours (7 AM - midnight)', 
      timestamp: new Date().toISOString() 
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY mancante' }, { status: 500 });
  }

  try {
    // 1. Fetch delle notizie RSS (Google News)
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent('"ufficiale" calciomercato serie a')}&hl=it&gl=IT&ceid=IT:it`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error("Errore fetch RSS");
    
    const xml = await res.text();
    const result = await parseStringPromise(xml);
    const items = result?.rss?.channel?.[0]?.item || [];
    
    // Se non ci sono notizie, non consumare token Gemini
    if (!items || items.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No news found - skipped Gemini call to save tokens',
        transfersInserted: 0 
      });
    }

    // Prendiamo i primi 15 titoli più recenti
    const newsTexts = items.slice(0, 15).map((item: any) => item.title?.[0]).join('\\n- ');

    if (!newsTexts.trim()) {
      return NextResponse.json({ 
        success: true, 
        message: 'Empty news - skipped Gemini call to save tokens',
        transfersInserted: 0 
      });
    }

    // 2. Chiamata a Gemini per estrarre i trasferimenti
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      Sei un esperto giornalista di calciomercato italiano. Leggi i seguenti titoli di giornale e estrai ESATTAMENTE i trasferimenti UFFICIALI e CONCLUSI.
      
      REGOLE OBBLIGATORIE:
      1. Estrai SOLO transazioni realmente UFFICIALI (non rumors).
      2. Per fee: stima sempre un valore anche se non specificato (usa formati: "10M €", "5M €", "Gratuito", "Prestito").
      3. Per salary: dai SEMPRE un valore annuale (usa formati: "2,5M €/anno", "3M €/anno", "Non specificato").
      4. Se è un prestito, scrivi "Prestito" o "Prestito oneroso" come fee.
      5. Se lo stipendio non è menzionato, stima basato sulla squadra e fama del giocatore (es. "1,5M €/anno" per giocatori giovani Serie A).
      
      Rispondi SOLO con un JSON Array valido (niente markdown, niente backticks):
      [
        {
          "player": "Nome Giocatore",
          "buying_team": "Napoli",
          "selling_team": "Inter",
          "fee": "30M €",
          "salary": "3,5M €/anno",
          "date": "Oggi"
        }
      ]

      Titoli di oggi:
      - ${newsTexts}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawJson = response.text || "[]";
    // Pulizia JSON da backticks Markdown se presenti
    if (rawJson.includes('```')) {
      rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    let transfersExtracted: any[] = [];
    try {
      transfersExtracted = JSON.parse(rawJson);
      if (!Array.isArray(transfersExtracted)) {
        transfersExtracted = [];
      }
    } catch {
      console.warn('Failed to parse Gemini response:', rawJson);
      transfersExtracted = [];
    }

    let insertedCount = 0;

    // Funzione per normalizzare fee/salary
    const normalizeFee = (fee: string | null): string => {
      if (!fee) return 'N/D';
      const f = fee.trim();
      if (f.toLowerCase().includes('prestito')) return 'Prestito';
      if (f.toLowerCase().includes('gratuito') || f.toLowerCase().includes('svincolato')) return 'Gratuito';
      if (f.includes('€') || f.includes('M')) return f;
      return f || 'N/D';
    };

    const normalizeSalary = (salary: string | null): string => {
      if (!salary) return 'Non specificato';
      const s = salary.trim();
      if (s.includes('€') || s.includes('M') || s.includes('anno')) return s;
      return s || 'Non specificato';
    };

    // 3. Salvataggio nel database bidirezionale
    for (const t of transfersExtracted) {
      if (!t.player || (!t.buying_team && !t.selling_team)) continue;

      const buyerId = normalizeTeamId(t.buying_team);
      const sellerId = normalizeTeamId(t.selling_team);

      const fee = normalizeFee(t.fee);
      const salary = normalizeSalary(t.salary);
      const dateLabel = t.date || 'Oggi';

      // Insert per il BUYER (Acquisto)
      if (buyerId) {
        // Controllo duplicato
        const checkBuyer = await sql`SELECT id FROM transfers WHERE team_id = ${buyerId} AND player ILIKE ${'%' + t.player + '%'} AND type = 'acquisto'`;
        if (checkBuyer.rowCount === 0) {
          await sql`
            INSERT INTO transfers (team_id, type, player, other_team, fee, salary, date, status)
            VALUES (${buyerId}, 'acquisto', ${t.player}, ${t.selling_team || 'Svincolato'}, ${fee}, ${salary}, ${dateLabel}, 'Ufficiale')
            ON CONFLICT DO NOTHING
          `;
          insertedCount++;
        }
      }

      // Insert per il SELLER (Cessione)
      if (sellerId) {
        const checkSeller = await sql`SELECT id FROM transfers WHERE team_id = ${sellerId} AND player ILIKE ${'%' + t.player + '%'} AND type = 'cessione'`;
        if (checkSeller.rowCount === 0) {
          await sql`
            INSERT INTO transfers (team_id, type, player, other_team, fee, salary, date, status)
            VALUES (${sellerId}, 'cessione', ${t.player}, ${t.buying_team || 'Svincolato'}, ${fee}, ${salary}, ${dateLabel}, 'Ufficiale')
            ON CONFLICT DO NOTHING
          `;
          insertedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processato con successo. Righe inserite: ${insertedCount}`,
      transfersInserted: insertedCount,
      transfersFound: transfersExtracted.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Cron Mercato Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
