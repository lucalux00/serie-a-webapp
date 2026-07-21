/**
 * GET /api/cron/mercato
 *
 * Aggiorna il database trasferimenti per TUTTE le leghe (Serie A, B, Premier, La Liga, Bundesliga, Ligue 1).
 * Usa Gemini per estrarre calciatori/club/tipo dal testo dei feed RSS.
 *
 * Ottimizzazioni token:
 * - Hash SHA-256 dei titoli: se identici all'ultimo run → skip Gemini (risparmio 100%)
 * - Fascia oraria 07:00-23:59 IT — niente chiamate notturne
 * - Prompt compatto con output JSON minimo
 * - Deduplication DB prima dell'INSERT
 * - SDK centralizzato da lib/gemini.ts
 */
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { generateJSON } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface TransferItem {
  player: string;
  team_id: string;
  league: string;
  type: 'Acquisto' | 'Cessione' | 'Prestito';
  other_team: string;
  status: 'Ufficiale' | 'Rumor';
  fee: string;
}

// Mappa dei feed RSS per lega + query google news
const LEAGUE_FEEDS: Array<{ league: string; feeds: string[] }> = [
  {
    league: 'A',
    feeds: [
      'https://news.google.com/rss/search?q=calciomercato+serie+a+ufficiale&hl=it&gl=IT&ceid=IT:it',
      'https://news.google.com/rss/search?q=calciomercato+serie+a+trattativa&hl=it&gl=IT&ceid=IT:it',
    ],
  },
  {
    league: 'B',
    feeds: [
      'https://news.google.com/rss/search?q=calciomercato+serie+b+ufficiale&hl=it&gl=IT&ceid=IT:it',
    ],
  },
  {
    league: 'PL',
    feeds: [
      'https://news.google.com/rss/search?q=premier+league+transfer+official+2026&hl=en&gl=GB&ceid=GB:en',
    ],
  },
  {
    league: 'LL',
    feeds: [
      'https://news.google.com/rss/search?q=la+liga+fichajes+oficial+2026&hl=es&gl=ES&ceid=ES:es',
    ],
  },
  {
    league: 'BL',
    feeds: [
      'https://news.google.com/rss/search?q=bundesliga+transfer+offiziell+2026&hl=de&gl=DE&ceid=DE:de',
    ],
  },
  {
    league: 'L1',
    feeds: [
      'https://news.google.com/rss/search?q=ligue+1+transfert+officiel+2026&hl=fr&gl=FR&ceid=FR:fr',
    ],
  },
];

// Prompt per estrarre trasferimenti da titoli RSS
interface ArticleEntry {
  title: string;
  snippet?: string;
}

function buildPrompt(articles: ArticleEntry[], league: string): string {
  const leagueCtx =
    league === 'A' ? 'Serie A italiana' :
    league === 'B' ? 'Serie B italiana' :
    league === 'PL' ? 'Premier League inglese' :
    league === 'LL' ? 'La Liga spagnola' :
    league === 'BL' ? 'Bundesliga tedesca' : 'Ligue 1 francese';

  const articlesText = articles.map((a, i) =>
    `[${i + 1}] ${a.title}${a.snippet ? `\n    → ${a.snippet.substring(0, 150)}` : ''}`
  ).join('\n');

  return `Estrai trasferimenti calcistici da questi articoli sulla ${leagueCtx}.
Ignora notizie non relative a trasferimenti di giocatori.

Articoli:
${articlesText}

Rispondi SOLO con JSON array (nessun testo aggiuntivo):
[{"player":"Nome Giocatore","team_id":"id-squadra-slug","league":"${league}","type":"Acquisto|Cessione|Prestito","other_team":"Club controparte","status":"Ufficiale|Rumor","fee":"importo preciso se citato (es: '€45M', '30 milioni', '€12M + bonus') oppure N/D"}]

IMPORTANTE per fee: se nell'articolo viene citata una cifra (anche approssimativa), estraila. Formattala come '€XM' o 'XM€' o 'circa €XM'.
Per team_id usa slug minuscolo (es: "napoli", "milan", "juventus", "real-madrid", "barcelona", "manchester-city", "paris-saint-germain", "bayern-munich", "arsenal" ecc.).
Se non riesci a identificare la squadra principale coinvolta, ometti quella voce.
Restituisci [] se non ci sono trasferimenti chiari.`;
}

export async function GET(request: Request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fascia oraria: solo 07:00-23:59 ora italiana (UTC+2)
  const hourUTC = new Date().getUTCHours();
  const hourIT = (hourUTC + 2) % 24;
  if (hourIT < 7) {
    return NextResponse.json({ success: true, message: 'Fuori fascia oraria (07-24 IT), skip' });
  }

  try {
    const parser = new Parser({
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SportBot/1.0)' },
      timeout: 8000,
    });

    let totalInserted = 0;
    let totalAiCalls = 0;
    const leagueResults: Record<string, { aiCalled: boolean; inserted: number }> = {};

    for (const { league, feeds } of LEAGUE_FEEDS) {
      // 1. Raccogli titoli + snippet da tutti i feed della lega
      const articles: ArticleEntry[] = [];
      for (const feedUrl of feeds) {
        try {
          const feed = await parser.parseURL(feedUrl);
          feed.items.slice(0, 15).forEach((item) => {
            if (item.title) {
              articles.push({
                title: item.title.trim(),
                snippet: (item.contentSnippet || item.content || '').replace(/<[^>]*>/g, '').trim().substring(0, 200) || undefined,
              });
            }
          });
        } catch (feedErr) {
          console.warn(`[cron/mercato] Feed error (${league}):`, feedErr);
        }
      }
      const titles = articles.map(a => a.title);

      if (titles.length === 0) {
        leagueResults[league] = { aiCalled: false, inserted: 0 };
        continue;
      }

      // 2. Calcola hash SHA-256 dei titoli (ordinati per stabilità)
      const titlesHash = createHash('sha256')
        .update(titles.slice().sort().join('|'))
        .digest('hex');

      // 3. Controlla se abbiamo già processato questi titoli
      const { rows: lastRun } = await sql`
        SELECT titles_hash FROM mercato_cron_log
        WHERE titles_hash = ${titlesHash}
          AND created_at > NOW() - INTERVAL '2 hours'
        LIMIT 1
      `;

      if (lastRun.length > 0) {
        console.log(`[cron/mercato] Hash match per ${league} — skip Gemini`);
        leagueResults[league] = { aiCalled: false, inserted: 0 };
        continue;
      }

      // 4. Chiama Gemini per estrarre i trasferimenti
      totalAiCalls++;
      const transfers = await generateJSON<TransferItem[]>(buildPrompt(articles, league));

      // 5. Salva il log dell'hash
      await sql`
        INSERT INTO mercato_cron_log (titles_hash, ai_called, inserted)
        VALUES (${titlesHash}, TRUE, 0)
        ON CONFLICT DO NOTHING
      `;

      if (!transfers || !Array.isArray(transfers)) {
        leagueResults[league] = { aiCalled: true, inserted: 0 };
        continue;
      }

      // 6. Inserisci nel DB (skip duplicati)
      let leagueInserted = 0;
      const today = new Date().toLocaleDateString('it-IT', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

      for (const t of transfers) {
        // Salta record non validi: player mancante, team_id mancante, tipo mancante,
        // oppure player con più di 60 caratteri (è un titolo di notizia, non un nome)
        if (!t.player || !t.team_id || !t.type) continue;
        if (t.player.trim().length > 60) continue;
        if (t.player.toLowerCase().includes('calciomercato')) continue;

        // Check duplicato esatto
        const { rows: existing } = await sql`
          SELECT id FROM transfers
          WHERE player = ${t.player}
            AND team_id = ${t.team_id}
            AND type = ${t.type}
            AND (status = ${t.status} OR status = 'Ufficiale')
          LIMIT 1
        `;

        if (existing.length > 0) continue;

        // Se arriva conferma ufficiale, rimuovi il rumor precedente
        if (t.status === 'Ufficiale') {
          await sql`
            DELETE FROM transfers
            WHERE player = ${t.player}
              AND team_id = ${t.team_id}
              AND status = 'Rumor'
          `;
        }

        await sql`
          INSERT INTO transfers (team_id, league, type, player, other_team, fee, date, status)
          VALUES (
            ${t.team_id},
            ${t.league || league},
            ${t.type},
            ${t.player.trim()},
            ${t.other_team || 'N/D'},
            ${t.fee || 'N/D'},
            ${today},
            ${t.status || 'Rumor'}
          )
        `;
        leagueInserted++;

        // Aggiorna rosa se trasferimento ufficiale Serie A
        if (t.status === 'Ufficiale' && league === 'A') {
          try {
            const searchName = `%${t.player.trim()}%`;
            if (t.type === 'Cessione') {
              await sql`DELETE FROM players WHERE team_id = ${t.team_id} AND name ILIKE ${searchName}`;
            } else if (t.type === 'Acquisto' || t.type === 'Prestito') {
              const { rows: check } = await sql`
                SELECT id FROM players WHERE team_id = ${t.team_id} AND name ILIKE ${searchName}
              `;
              if (check.length === 0) {
                const { rows: findOther } = await sql`
                  SELECT id FROM players WHERE name ILIKE ${searchName}
                `;
                if (findOther.length === 1) {
                  await sql`UPDATE players SET team_id = ${t.team_id} WHERE id = ${findOther[0].id}`;
                } else {
                  await sql`
                    INSERT INTO players (team_id, name, role, squad_type)
                    VALUES (${t.team_id}, ${t.player.trim()}, 'N/D', 'first')
                  `;
                }
              }
            }
          } catch (rosterErr) {
            console.error('[cron/mercato] Roster update error:', t.player, rosterErr);
          }
        }
      }

      // Aggiorna log con count effettivo
      await sql`
        UPDATE mercato_cron_log SET inserted = ${leagueInserted}
        WHERE titles_hash = ${titlesHash}
      `;

      leagueResults[league] = { aiCalled: true, inserted: leagueInserted };
      totalInserted += leagueInserted;
      console.log(`[cron/mercato] ${league}: ${leagueInserted} inseriti`);
    }

    return NextResponse.json({
      success: true,
      totalInserted,
      totalAiCalls,
      byLeague: leagueResults,
    });

  } catch (error: any) {
    console.error('[cron/mercato] Errore:', error);
    return NextResponse.json({ error: 'Errore interno', details: error.message }, { status: 500 });
  }
}
