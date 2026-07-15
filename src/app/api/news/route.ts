import { NextResponse } from 'next/server';
import { fetchNewsForTeam } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  const league = searchParams.get('league') || 'A';

  if (!team) {
    return NextResponse.json({ error: 'Team is required' }, { status: 400 });
  }

  try {
    const news = await fetchNewsForTeam(team, league);
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
