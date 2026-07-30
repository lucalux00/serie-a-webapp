import { ImageResponse } from 'next/og';

export const alt = 'Tattica & Pronostici — dati, mercato e analisi sul calcio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '64px', color: '#F8FAFC',
      background: 'linear-gradient(135deg, #0B1120 0%, #0F172A 55%, #123D39 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', color: '#10B981', fontSize: 28, fontWeight: 800, letterSpacing: 4 }}>
        DATI • ANALISI • CALCIO
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 1 }}>TATTICA</div>
        <div style={{ display: 'flex', fontSize: 82, fontWeight: 900, lineHeight: 1 }}><span style={{ color: '#10B981' }}>&amp;</span> PRONOSTICI</div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#CBD5E1' }}>Calciomercato, squadre e analisi statistiche.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 23, color: '#94A3B8' }}>Segui il calcio con più contesto.</div>
    </div>,
    size,
  );
}
