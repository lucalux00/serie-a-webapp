import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * La diretta testuale richiede un feed di eventi con licenza. Non esponiamo
 * cronache ricavate da scraping e, soprattutto, non generiamo simulazioni.
 */
export async function GET(request: Request) {
  const team = new URL(request.url).searchParams.get('team');
  if (!team) return NextResponse.json({ error: 'Team is required' }, { status: 400 });

  return NextResponse.json({
    isLive: false,
    reason: 'verified_live_source_not_configured',
    message: 'La diretta sarà disponibile solo quando sarà attiva una fonte di eventi verificata.',
  });
}
