import { NextResponse } from 'next/server';

const START_DATE = new Date("2026-07-16T12:00:00Z").getTime();

// Variabili per la sessione corrente del server
let sessionExtraVisits = 0;
let activeSessions = new Set<string>();

export async function GET() {
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, isNewSession } = body || {};

    if (isNewSession) {
      sessionExtraVisits++;
    }
    
    if (sessionId) {
      activeSessions.add(sessionId);
    }
    
    // Pulizia
    if (activeSessions.size > 1000) {
      activeSessions.clear();
      if (sessionId) activeSessions.add(sessionId);
    }

    // Calcolo visite totali globali: 1200 + (visite naturali stimate dal lancio) + (visite extra registrate in questa istanza)
    const now = Date.now();
    const minutesSinceStart = Math.max(0, (now - START_DATE) / 60000);
    const simulatedGlobal = Math.floor(minutesSinceStart * 0.5); // Circa 1 visita ogni 2 minuti
    
    const total = 1200 + simulatedGlobal + sessionExtraVisits;

    // Per gli online, prendiamo la base (10) + una fluttuazione naturale + le sessioni reali attive nel server
    const baseOnline = 10;
    const fluctuation = Math.floor(Math.random() * 4); // 0-3
    const online = baseOnline + fluctuation + activeSessions.size;

    return NextResponse.json({ total, online });

  } catch (error) {
    return NextResponse.json({ total: 1200, online: 11 });
  }
}
