import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Set longer timeout for AI parsing

export async function GET(request: Request) {
  // Verifichiamo se è una richiesta autorizzata (tramite Cron Secret)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const parser = new Parser({
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const FEEDS = [
      'https://news.google.com/rss/search?q=calciomercato+serie+a+ufficiale&hl=it&gl=IT&ceid=IT:it',
      'https://news.google.com/rss/search?q=calciomercato+serie+a+trattativa&hl=it&gl=IT&ceid=IT:it'
    ];

    let inserted = 0;
    const textsToAnalyze: string[] = [];

    for (const feedUrl of FEEDS) {
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items.slice(0, 15);
      for (const item of items) {
        if (item.title) textsToAnalyze.push(item.title);
      }
    }

    if (textsToAnalyze.length === 0) {
      return NextResponse.json({ success: true, message: 'Nessuna notizia trovata', inserted: 0 });
    }

    const prompt = `Ecco una lista di titoli di articoli di calciomercato:
${textsToAnalyze.join('\n')}

Estrai tutti i trasferimenti o le trattative (anche solo rumors) delle squadre di Serie A.
Ignora le notizie che non parlano di trasferimenti chiari o trattative tra giocatori e squadre.

Restituisci ESCLUSIVAMENTE un JSON array di oggetti con i seguenti campi:
- "player": nome del giocatore
- "team_id": l'ID della squadra coinvolta. Usa questi esatti ID: atalanta, bologna, cagliari, como, fiorentina, frosinone, genoa, inter, juventus, lazio, lecce, milan, monza, napoli, parma, roma, sassuolo, torino, udinese, venezia.
- "type": "Acquisto", "Cessione" o "Prestito"
- "other_team": la squadra di provenienza o destinazione (stringa libera)
- "status": "Ufficiale" se è un trasferimento concluso, altrimenti "Rumor"
- "fee": il costo o "N/D"

IMPORTANTE: Restituisci SOLO il JSON array. Niente formattazione markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });

    let jsonText = response.text?.trim() || '[]';
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const transfers = JSON.parse(jsonText);
    const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

    for (const t of transfers) {
      const existing = await sql`
        SELECT id FROM transfers 
        WHERE player = ${t.player} AND team_id = ${t.team_id} AND type = ${t.type} 
        AND (status = ${t.status} OR status = 'Ufficiale')
        LIMIT 1
      `;

      if (existing.rows.length === 0) {
        if (t.status === 'Ufficiale') {
          await sql`DELETE FROM transfers WHERE player = ${t.player} AND team_id = ${t.team_id} AND type = ${t.type} AND status = 'Rumor'`;
        }

        await sql`
          INSERT INTO transfers (team_id, type, player, other_team, fee, date, status)
          VALUES (${t.team_id}, ${t.type}, ${t.player}, ${t.other_team || 'N/D'}, ${t.fee || 'N/D'}, ${today}, ${t.status})
        `;
        inserted++;

        if (t.status === 'Ufficiale') {
          try {
            const searchName = '%' + t.player.trim() + '%';
            if (t.type === 'Cessione') {
              // Rimuovi il giocatore dalla squadra che ha venduto
              await sql`DELETE FROM players WHERE team_id = ${t.team_id} AND name ILIKE ${searchName}`;
            } else if (t.type === 'Acquisto' || t.type === 'Prestito') {
              // Controlla se è già nella nuova squadra
              const check = await sql`SELECT id FROM players WHERE team_id = ${t.team_id} AND name ILIKE ${searchName}`;
              if (check.rows.length === 0) {
                // Se era in un'altra squadra di Serie A, aggiornalo
                const findOther = await sql`SELECT id FROM players WHERE name ILIKE ${searchName}`;
                if (findOther.rows.length === 1) {
                  await sql`UPDATE players SET team_id = ${t.team_id} WHERE id = ${findOther.rows[0].id}`;
                } else {
                  // Altrimenti crea un nuovo giocatore in rosa
                  await sql`INSERT INTO players (team_id, name, role, squad_type) VALUES (${t.team_id}, ${t.player.trim()}, 'N/D', 'first')`;
                }
              }
            }
          } catch (e) {
            console.error('Error updating roster for transfer:', t.player, e);
          }
        }
      }
    }

    return NextResponse.json({ success: true, inserted });
  } catch (error: any) {
    console.error('Mercato Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
