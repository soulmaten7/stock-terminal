import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E1116' }}>
        <svg width="118" height="118" viewBox="0 0 100 100">
          <rect x="16" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
          <rect x="42.5" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
          <rect x="69" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
          <rect x="42.5" y="35" width="15" height="43" rx="2.5" fill="#2DD4BF" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
