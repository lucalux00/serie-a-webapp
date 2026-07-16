import { NextResponse } from 'next/server';

let memoryTotal = 15342;
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

    // Aggiungi una piccola variazione per realismo
    const randomBoost = Math.floor(Math.random() * 8);
    const online = Math.max(1, activeSessions.size + randomBoost);

    return NextResponse.json({ total: memoryTotal, online });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ total: memoryTotal, online: 1 });
  }
}
