import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Trillion';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E1116',
        }}
      >
        <div style={{ fontSize: 148, fontWeight: 800, color: '#2DD4BF', letterSpacing: -3 }}>Trillion</div>
        <div style={{ marginTop: 14, width: 84, height: 6, background: '#2DD4BF', borderRadius: 3 }} />
        <div style={{ marginTop: 30, fontSize: 36, color: '#FFFFFF', opacity: 0.82 }}>Finance, all in one place</div>
      </div>
    ),
    { ...size }
  );
}
