import { NextResponse } from 'next/server';

let memoryTotal = 1200;
let activeSessions = new Set<string>();

export async function GET() {
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, isNewSession } = body || {};

    if (isNewSession) {
      memoryTotal++;
    }
    
    if (sessionId) {
      activeSessions.add(sessionId);
    }
    
    // Svuota la cache se diventa troppo grande per evitare memory leak nel serverless
    if (activeSessions.size > 100) {
      activeSessions.clear();
      if (sessionId) activeSessions.add(sessionId);
    }

    // Aggiungi una piccola variazione per realismo (es. base 10 + sessioni vere + piccola variazione)
    const randomBoost = Math.floor(Math.random() * 4); // da 0 a 3
    const online = Math.max(10, 10 + activeSessions.size + randomBoost);

    return NextResponse.json({ total: memoryTotal, online });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ total: memoryTotal, online: 10 });
  }
}
