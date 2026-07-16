import { NextResponse } from 'next/server';

// Queste variabili tengono in memoria i dati reali del server
let memoryTotal = 1200;
let activeSessions = new Set<string>();

export async function GET() {
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, isNewSession } = body || {};

    // Ad ogni nuova visita di chiunque, aumenta di 1 il totale in modo reale
    if (isNewSession) {
      memoryTotal++;
    }
    
    // Registra le persone reali attualmente online
    if (sessionId) {
      activeSessions.add(sessionId);
    }
    
    // Manutenzione cache serverless
    if (activeSessions.size > 1000) {
      activeSessions.clear();
      if (sessionId) activeSessions.add(sessionId);
    }

    // Gli online sono le tue 10 visite base + le persone REALI attualmente connesse
    const online = 10 + activeSessions.size;

    return NextResponse.json({ total: memoryTotal, online });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ total: memoryTotal, online: 11 });
  }
}
