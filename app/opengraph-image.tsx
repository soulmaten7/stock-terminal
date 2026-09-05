import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'EarthTicker';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0E1116' }}>
        <svg width="124" height="124" viewBox="0 0 100 100" style={{ marginBottom: 30 }}>
          <rect x="16" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
          <rect x="42.5" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
          <rect x="69" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
          <rect x="42.5" y="35" width="15" height="43" rx="2.5" fill="#2DD4BF" />
        </svg>
        <div style={{ fontSize: 130, fontWeight: 800, color: '#FBFCFD', letterSpacing: -3 }}>EarthTicker</div>
        <div style={{ marginTop: 22, fontSize: 34, color: '#FFFFFF', opacity: 0.78 }}>Finance, all in one place</div>
      </div>
    ),
    { ...size }
  );
}
