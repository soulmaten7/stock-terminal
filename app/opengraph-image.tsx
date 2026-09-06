import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'EarthTicker';

// 🔴 2026-09-06 확인: 실제 서비스되는 OG 이미지는 이 파일이 아니라 정적 public/og.png(ko)·
// public/og-en.png(en)다(app/[locale]/layout.tsx의 openGraph.images가 명시돼 있어 이 파일 기반
// 라우트는 실사용되지 않는 것으로 실측 확인) — 그래도 옛 "T" 마크·구 태그라인을 방치하지 않도록
// 같은 소재(지구본, app/opengraph-image-source.png)·같은 문구로 맞춰 둔다.
export default async function OpengraphImage() {
  const source = await readFile(join(process.cwd(), 'app/opengraph-image-source.png'));
  const dataUrl = `data:image/png;base64,${source.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0E1116', position: 'relative' }}>
        <img src={dataUrl} width={560} height={560} style={{ position: 'absolute', right: -40, top: 35, opacity: 0.96 }} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: 760, marginLeft: 88 }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, color: '#FBFCFD', letterSpacing: -2 }}>
            Earth<span style={{ color: '#FFD65A' }}>Ticker</span>
          </div>
          <div style={{ marginTop: 22, fontSize: 40, fontWeight: 600, color: '#FBFCFD' }}>세계의 주식 정보를, 한 곳에서</div>
          <div style={{ marginTop: 16, fontSize: 24, color: '#9AA1AC' }}>모든 시각을 데이터로. 예측도 추천도 없이, 판단은 당신입니다.</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
