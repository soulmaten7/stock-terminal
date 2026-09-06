import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// 2026-09-06: 옛 "T" 마크(Trillion 잔재) → EarthTicker 지구본 심볼(헤더·icon.svg와 동일 원본,
// 배경 제거만 하고 iOS 자체 라운딩에 맡기기 위해 사각형 그대로 둔 소스 — app/apple-icon-source.png).
export default async function AppleIcon() {
  const source = await readFile(join(process.cwd(), 'app/apple-icon-source.png'));
  const dataUrl = `data:image/png;base64,${source.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E1116' }}>
        <img src={dataUrl} width={size.width} height={size.height} alt="" />
      </div>
    ),
    { ...size }
  );
}
