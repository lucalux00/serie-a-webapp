import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/auth';
import deepSquads from '@/data/deepSquads.json';

export const dynamic = 'force-dynamic';

const ALERT_TERMS = ['infortun', 'squalif', 'rientr', 'stop', 'dubbio', 'turnover', 'formazione', 'indispon', 'recuper', 'condizione', 'forma fisica', 'fuori rosa', 'esclus'];
const MARKET_TERMS = ['mercato', 'rumor', 'trattativa', 'acquisto', 'cessione', 'prestito'];

type NewsRow = { id: number; title: string; link: string; source: string; snippet: string | null; pub_date: string; time: string | null };

function hasRadarSignal(item: NewsRow) {
  const text = `${item.title} ${item.snippet ?? ''}`.toLocaleLowerCase('it');
  return ALERT_TERMS.some((term) => text.includes(term)) || MARKET_TERMS.some((term) => text.includes(term));
}

function signalLabel(item: NewsRow) {
  const text = `${item.title} ${item.snippet ?? ''}`.toLocaleLowerCase('it');
  if (text.includes('infortun') || text.includes('stop') || text.includes('indispon')) return 'Infortunio / stop';
  if (text.includes('squalif')) return 'Squalifica';
  if (text.includes('formazione') || text.includes('turnover') || text.includes('dubbio')) return 'Titolare da verificare';
  if (text.includes('rientr') || text.includes('recuper')) return 'Rientro';
  if (text.includes('forma') || text.includes('condizione')) return 'Forma fisica';
  if (text.includes('fuori rosa') || text.includes('esclus')) return 'Fuori rosa';
  if (MARKET_TERMS.some((term) => text.includes(term))) return 'Rumor di mercato';
  return 'Disponibilità da verificare';
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const user = token ? await verifyJwt(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mode = request.nextUrl.searchParams.get('mode') === 'league' ? 'league' : 'roster';
  const [{ rows: newsRows }, { rows: rosterRows }] = await Promise.all([
    sql`SELECT id, title, link, source, snippet, pub_date, time FROM news ORDER BY pub_date DESC LIMIT 250`,
    sql`SELECT player_name FROM fanta_rosters WHERE user_id = ${user.userId}`,
  ]);
  const rows = newsRows as NewsRow[];
  const playerNames = rosterRows.map((player) => String(player.player_name ?? '').trim()).filter(Boolean);
  const serieAPlayers = Object.values(deepSquads)
    .flatMap((squad) => squad.firstTeam.players.map((player) => player.name.toLocaleLowerCase('it')))
    .filter((name) => name.length >= 5);

  const filtered = mode === 'league'
    ? rows.filter((item) => {
      const text = `${item.title} ${item.snippet ?? ''}`.toLocaleLowerCase('it');
      // Solo segnali fantacalcistici collegati a calciatori della Serie A:
      // esclude cronaca, risultati e notizie generiche già presenti in Notizie.
      return hasRadarSignal(item) && serieAPlayers.some((name) => text.includes(name));
    })
    : rows.filter((item) => {
      const text = `${item.title} ${item.snippet ?? ''}`.toLocaleLowerCase('it');
      return playerNames.some((name) => text.includes(name.toLocaleLowerCase('it')));
    });

  return NextResponse.json({
    mode,
    rosterCount: playerNames.length,
    items: filtered.slice(0, 20).map((item) => ({ ...item, signal: signalLabel(item) })),
  });
}
