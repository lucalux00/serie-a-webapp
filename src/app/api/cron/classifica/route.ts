import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Il solo scopo di questa route è "scaldare" la cache della route /api/classifiche
    // per assicurare che la classifica in home sia sempre aggiornata
    
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/classifiche?league=A`, {
      cache: 'no-store' // non vogliamo cacciare questa specifica chiamata "di pinger"
    });

    return NextResponse.json({ success: true, message: 'Classifica cache warmed up' });
  } catch (err: any) {
    console.error('[Cron Classifica Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
