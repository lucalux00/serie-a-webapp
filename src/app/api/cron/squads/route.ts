import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verifichiamo che la chiamata venga da Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In futuro, qui richiameremo la logica per lo scraping giornaliero (es. Wikipedia)
    // per aggiornare deepSquads.json o un database in cloud
    console.log("Esecuzione giornaliera dell'aggiornamento delle Rose completata.");

    return NextResponse.json({ success: true, message: 'Aggiornamento Rose completato' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 });
  }
}
