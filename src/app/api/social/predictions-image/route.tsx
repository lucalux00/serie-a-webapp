import { ImageResponse } from 'next/og';
import { sql } from '@vercel/postgres';
import { getUserFromCookie } from '@/lib/auth';
import { ensurePredictionSchema } from '@/lib/predictionSchema';

export const runtime = 'nodejs';

type Quote = { pick?: string; odds?: number | string };

function parseQuotes(value: unknown): Quote[] {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(String(value || '[]')); } catch { return []; }
}

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return new Response('Non autorizzato', { status: 401 });

  const { rows: admins } = await sql`SELECT email FROM users WHERE id = ${user.userId}`;
  if (!['lucapinelli0000@gmail.com', 'luca.pinelli0000@gmail.com'].includes(admins[0]?.email || '')) {
    return new Response('Permesso negato', { status: 403 });
  }
  await ensurePredictionSchema();

  const { rows } = await sql`
    SELECT home_team, away_team, competition, quotes
    FROM daily_ai_predictions
    WHERE status = 'PUBLISHED'
      AND match_date >= NOW()
    ORDER BY match_date ASC
    LIMIT 3
  `;
  const items = rows.map((row) => ({
    match: `${row.home_team} - ${row.away_team}`,
    pick: parseQuotes(row.quotes)[0]?.pick || 'Analisi sul sito',
  }));

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 64, color: '#F8FAFC', background: 'linear-gradient(135deg, #0B1120, #153C38)' }}>
      <div style={{ display: 'flex', color: '#10B981', fontSize: 26, fontWeight: 800, letterSpacing: 3 }}>TATTICA &amp; PRONOSTICI</div>
      <div style={{ display: 'flex', marginTop: 36, fontSize: 58, fontWeight: 900 }}>MATCH DA SEGUIRE</div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 38, gap: 18 }}>
        {items.map((item, index) => (
          <div key={item.match} style={{ display: 'flex', flexDirection: 'column', padding: '18px 24px', borderRadius: 18, background: '#1E293B' }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 800 }}>{index + 1}. {item.match}</div>
            <div style={{ display: 'flex', marginTop: 8, color: '#10B981', fontSize: 23 }}>{item.pick}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 'auto', color: '#94A3B8', fontSize: 18 }}>Analisi statistica · Solo a scopo informativo</div>
    </div>,
    { width: 1080, height: 1350 },
  );
}
