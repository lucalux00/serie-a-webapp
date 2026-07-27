import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const resolvedParams = await params;
  const teamId = resolvedParams.teamId;

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
  }

  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ transfers: [] });
    }

    // Fetch trasferimenti ACQUISTI (team come buyer)
    const acquisti = await sql`
      SELECT id, type, player, other_team, fee, salary, date, status 
      FROM transfers 
      WHERE team_id = ${teamId.toLowerCase()} AND type = 'acquisto'
      ORDER BY date DESC
      LIMIT 50
    `;

    // Fetch trasferimenti CESSIONI (team come seller)
    const cessioni = await sql`
      SELECT id, type, player, other_team, fee, salary, date, status 
      FROM transfers 
      WHERE team_id = ${teamId.toLowerCase()} AND type = 'cessione'
      ORDER BY date DESC
      LIMIT 50
    `;

    // Fetch trasferimenti PRESTITI IN
    const prestitiIn = await sql`
      SELECT id, type, player, other_team, fee, salary, date, status 
      FROM transfers 
      WHERE team_id = ${teamId.toLowerCase()} AND type = 'prestito' AND player IS NOT NULL
      ORDER BY date DESC
      LIMIT 50
    `;

    // Combine e normalizza
    const allTransfers = [
      ...acquisti.rows.map((t: any) => ({
        id: t.id,
        type: 'acquisto',
        player: t.player,
        otherTeam: t.other_team,
        fee: t.fee || 'N/D',
        salary: t.salary || 'Non specificato',
        date: t.date || 'Oggi',
        status: t.status || 'ufficiale'
      })),
      ...cessioni.rows.map((t: any) => ({
        id: t.id,
        type: 'cessione',
        player: t.player,
        otherTeam: t.other_team,
        fee: t.fee || 'N/D',
        salary: t.salary || 'Non specificato',
        date: t.date || 'Oggi',
        status: t.status || 'ufficiale'
      })),
      ...prestitiIn.rows.map((t: any) => ({
        id: t.id,
        type: 'prestito',
        player: t.player,
        otherTeam: t.other_team,
        fee: t.fee || 'Prestito',
        salary: t.salary || 'Non specificato',
        date: t.date || 'Oggi',
        status: t.status || 'ufficiale'
      }))
    ];

    return NextResponse.json({ 
      transfers: allTransfers,
      teamId: teamId,
      totalCount: allTransfers.length
    });

  } catch (error: any) {
    console.error(`Error fetching team transfers for ${teamId}:`, error);
    return NextResponse.json({ 
      transfers: [],
      teamId: teamId,
      error: error.message 
    }, { status: 500 });
  }
}
