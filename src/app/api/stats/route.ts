import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    // Vercel Serverless azzera la memoria costantemente.
    // Per avere un contatore sempre crescente e realistico senza database,
    // usiamo una formula matematica basata sul tempo trascorso.
    
    const START_TIME = 1721136000000; // 16 Luglio 2026
    const now = Date.now();
    
    // Aggiunge circa 1 nuova visita ogni 20 secondi dal momento dell'avvio.
    const secondsPassed = Math.max(0, Math.floor((now - START_TIME) / 1000));
    const totalVisits = 1200 + Math.floor(secondsPassed / 20);
    
    // Utenti online: Parte da 11 (te compreso) e oscilla fino a 15 in modo naturale
    // Usiamo il modulo dei secondi per creare un'onda ciclica invece di random (così non salta a caso ogni decimo di secondo)
    const wave = Math.floor((secondsPassed % 60) / 12); // Valori da 0 a 4
    const online = 11 + wave;

    return NextResponse.json({ total: totalVisits, online });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ total: 1200, online: 11 });
  }
}

