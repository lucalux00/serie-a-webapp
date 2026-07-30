import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  const overview = searchParams.get('mode') === 'overview';
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 72, color: '#F8FAFC', background: 'linear-gradient(150deg, #08121f, #153c38)' }}>
      <div style={{ display: 'flex', color: '#34D399', fontSize: 26, fontWeight: 800, letterSpacing: 3 }}>TATTICA &amp; PRONOSTICI</div>
      <div style={{ display: 'flex', marginTop: 58, fontSize: overview ? 68 : 40, fontWeight: 900 }}>{overview ? 'REPORT GIORNATA SERIE A' : 'FOCUS SQUADRA'}</div>
      <div style={{ display: 'flex', marginTop: 48, fontSize: overview ? 38 : 76, lineHeight: 1.1, fontWeight: 900 }}>{overview ? '10 PARTITE · 20 SQUADRE' : team || 'SERIE A'}</div>
      <div style={{ display: 'flex', marginTop: 34, color: '#CBD5E1', fontSize: 30, lineHeight: 1.35 }}>{overview ? 'Calendario completo e analisi pre-partita sul sito.' : 'La partita, il contesto e i punti chiave della settimana.'}</div>
      <div style={{ display: 'flex', marginTop: 'auto', color: '#94A3B8', fontSize: 20 }}>Analisi statistica · Solo a scopo informativo</div>
    </div>, { width: 1080, height: 1920 },
  );
}
