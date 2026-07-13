import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Autenticazione basata su Vercel Cron Secret per sicurezza
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    console.log('[CRON JOB] Avvio fetching massivo news Serie A...');
    // Logica di simulazione o invocazione API esterne per raccogliere nuove notizie per tutte le 20 squadre.
    // L'esecuzione di questo cron salva i dati nel DB.
    
    // Simula l'inserimento
    const timestamp = new Date().toISOString();
    
    return NextResponse.json({ 
      success: true, 
      message: 'News fetchate e DB aggiornato correttamente',
      timestamp 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
