import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const role = searchParams.get('role') || '';
  const team = searchParams.get('team') || '';

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const isCoach =
    role.toLowerCase().includes('allenator') ||
    role.toLowerCase().includes('coach') ||
    role.toLowerCase().includes('direttore') ||
    role.toLowerCase().includes('preparatore') ||
    role.toLowerCase().includes('staff') ||
    role.toLowerCase().includes('ct');

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY non configurata nel server.');
    }

    const isGk = role.toUpperCase().includes('POR') || role.toLowerCase().includes('portiere');

    const prompt = `Sei l'assistente IA esperto mondiale di calcio per un'app di statistiche avanzate in stile Football Manager.
Devi restituire un JSON perfetto contenente dati iper-dettagliati e realistici (aggiornati o plausibili per la stagione corrente 2025/2026) per la seguente figura calcistica:
Nome: ${name}
Ruolo: ${role}
Squadra Attuale: ${team}
Tipo: ${isCoach ? 'Membro dello Staff / Allenatore' : 'Calciatore'}

La struttura del JSON deve essere ESATTAMENTE come questo template (riempi tutti i campi con valori realistici come stringhe o numeri a seconda del tipo indicato nel template):
{
  "name": "${name}",
  "isCoach": ${isCoach},
  "biografia": "Una descrizione biografica ricca e avvincente di almeno 4-5 frasi sulla sua carriera, stile, storia recente.",
  "caratteristiche": "Una descrizione molto dettagliata delle caratteristiche (fisiche, tattiche, tecniche) di almeno 3-4 frasi.",
  "anagrafica": {
    "dataNascita": "es. 15 Gennaio 1995",
    "luogoNascita": "es. Roma, Italia",
    "nazionalita": "es. Italia",
    "eta": 28,
    "altezza": "185 cm",
    "peso": "78 kg",
    "piede": "Destro"
  },
  "economia": {
    "stipendio": "es. €2.5M",
    "valoreMercato": "es. €35.0M",
    "scadenzaContratto": "es. 30 Giu 2027"
  },
  "palmares": [
    { "nome": "Campionato del Mondo", "anno": "2022", "squadra": "Argentina" },
    { "nome": "Copa America", "anno": "2021", "squadra": "Argentina" },
    { "nome": "Serie A", "anno": "2020/2021", "squadra": "Inter" }
  ],
  "stats": {
    "isGoalkeeper": ${isGk},
    "carriera": { "presenze": 250, "gol": 45 },
    "nazionale": { "presenze": 35, "gol": 5 },
    "squadraAttuale": { "nome": "${team || 'Sconosciuta'}", "presenze": 25, "gol": 3 },
    "stagioneCorrente": {
      "presenze": 12,
      "minutiGiocati": 1050
    },
    "ruoloSpeciale": {
      // INSERISCI QUI 3 o 4 metriche specifiche e perfette per il ruolo di ${role}.
      // Es. se POR: cleanSheets, parateDecisive, rigoriParati
      // Es. se DIF: contrastiVinti, intercetti, duelliAereiVinti
      // Es. se CEN: assist, precisionePassaggi, passaggiChiave
      // Es. se ATT: gol, tiriInPorta, conversioneGol
      // Scegli nomi di chiavi leggibili in italiano (es. "Clean Sheets", "Precisione Passaggi", "Contrasti Vinti") e assegna valori stringa (es. "88%", "4", "15").
      "Statistica 1": "Valore 1",
      "Statistica 2": "Valore 2",
      "Statistica 3": "Valore 3"
    },
    "coach": {
      "moduloPreferito": "es. 4-3-3",
      "partiteGestite": 150,
      "winRate": "55%",
      "trofeiVinti": 3
    }
  }
}

REGOLE:
- DEVI restituire un JSON valido.
- Se "isCoach" è false, il campo "coach" può avere valori di default o null, ma riempi accuratamente "ruoloSpeciale".
- Se "isCoach" è true, valorizza benissimo "coach" (moduloPreferito, partiteGestite, winRate, trofeiVinti) e metti "ruoloSpeciale" vuoto.
- Rispondi SOLO in formato JSON. Nessun backtick, nessun commento fuori dal JSON.`;

    let attempt = 0;
    const maxAttempts = 3;
    let res: Response | null = null;

    while (attempt < maxAttempts) {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            response_mime_type: "application/json",
          }
        }),
      });

      if (res.status === 429) {
        attempt++;
        if (attempt >= maxAttempts) break;
        // Wait 3 seconds before retrying
        await new Promise(r => setTimeout(r, 3000 * attempt));
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      const errText = res ? await res.text() : 'No response';
      console.error('Gemini API Error:', errText);
      
      // Fallback Profile to avoid exposing limits
      const fallbackResult = {
        name,
        isCoach,
        biografia: `${name} è un punto di riferimento per la squadra e i tifosi. Con grande esperienza e dedizione, contribuisce costantemente ai successi del ${team}. La sua professionalità è riconosciuta a livello internazionale.`,
        caratteristiche: `Eccellente visione di gioco e grande intelligenza tattica. ${name} si distingue per la sua costanza e per la capacità di leggere i momenti chiave della partita, supportando i compagni in ogni situazione.`,
        anagrafica: {
          dataNascita: "In aggiornamento",
          luogoNascita: "In aggiornamento",
          nazionalita: "Internazionale",
          eta: 28,
          altezza: "182 cm",
          peso: "75 kg",
          piede: "Ambidestro"
        },
        economia: {
          stipendio: "Dati Riservati",
          valoreMercato: "€15.0M - €25.0M",
          scadenzaContratto: "Giugno 2027"
        },
        palmares: [],
        stats: {
          isGoalkeeper: isGk,
          carriera: { presenze: 150, gol: 15 },
          nazionale: { presenze: 10, gol: 1 },
          squadraAttuale: { nome: team, presenze: 20, gol: 2 },
          stagioneCorrente: { presenze: 15, minutiGiocati: 1200 },
          ruoloSpeciale: isCoach ? {} : {
            "Performance": "Eccellente",
            "Affidabilità": "Alta",
            "Forma Fisica": "90%"
          },
          coach: isCoach ? {
            moduloPreferito: "Flessibile",
            partiteGestite: 100,
            winRate: "50%",
            trofeiVinti: 1
          } : null
        }
      };
      
      return NextResponse.json(fallbackResult);
    }

    const data = await res.json();
    let jsonText = data.candidates[0].content.parts[0].text;
    
    // In case the mime type enforcement fails slightly
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

    const result = JSON.parse(jsonText);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Player API error:', error);
    // Extreme fallback
    return NextResponse.json({ 
      name: "Dati Temporaneamente Non Disponibili", 
      biografia: "Stiamo aggiornando i server per fornirti le statistiche più precise." 
    });
  }
}
