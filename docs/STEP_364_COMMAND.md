<!-- 2026-06-23 -->
# STEP 364 — [출시준비] 브랜드 파비콘 + OG 이미지 + 도메인 메타(onetrillion.app)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_364_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
브라우저 탭 아이콘이 기본 Next 로고고, 링크 공유 시 미리보기 이미지가 없음 → 브랜드화.
- **파비콘**: 미드나잇 `#0E1116` + 민트 `#2DD4BF` "T" 마크.
- **OG/트위터 이미지**: 링크 공유 시 "Trillion" 워드마크 카드(1200×630).
- **metadataBase = `https://onetrillion.app`** — OG·아이콘 URL 절대경로 해석(도메인 확정).

> 변경: 신규 3파일(`app/icon.svg`·`app/apple-icon.tsx`·`app/opengraph-image.tsx`) + 편집 1(`app/layout.tsx` metadataBase 1줄).
> ⚠️ **메타 이미지 라우트(apple-icon·opengraph-image)는 생성 라우트라 dev 서버 클린 재시작 권장.**

---

## 📄 1) 신규 `app/icon.svg` (파비콘)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0E1116"/>
  <text x="16" y="23" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="21" font-weight="700" fill="#2DD4BF" text-anchor="middle">T</text>
</svg>
```

---

## 📄 2) 신규 `app/apple-icon.tsx` (iOS 홈화면 아이콘)

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E1116',
          color: '#2DD4BF',
          fontSize: 116,
          fontWeight: 800,
        }}
      >
        T
      </div>
    ),
    { ...size }
  );
}
```

---

## 📄 3) 신규 `app/opengraph-image.tsx` (링크 공유 미리보기)

```tsx
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
```

> ※ Korean 태그라인("흩어진 금융정보를 한눈에")은 OG 이미지에 한글 폰트 로딩이 필요해 v1은 영문 라인으로. (HTML 메타·페이지엔 한글 그대로.)

---

## 📄 4) `app/layout.tsx` — metadataBase 추가

**찾기:**
```tsx
export const metadata: Metadata = {
  title: {
```
**바꾸기:**
```tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app"),
  title: {
```

---

## ✅ 검증 (메타 이미지 라우트 → 클린 재시작 권장)
```bash
npm run build
```
빌드 무에러.

dev 서버 클린 재시작:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. **브라우저 탭 아이콘** = 미드나잇 바탕 민트 "T"(기본 Next 로고 아님).
2. 주소창에 `localhost:3333/opengraph-image` → "Trillion" 워드마크 카드(1200×630) 렌더.
3. `localhost:3333/apple-icon` → 민트 "T" 180×180.
4. 페이지 소스에 `og:image`·`twitter:image`가 `…/opengraph-image`로, `metadataBase`로 절대경로 해석.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/icon.svg app/apple-icon.tsx app/opengraph-image.tsx app/layout.tsx && git commit -m "feat(brand): 파비콘+OG 이미지(미드나잇+민트 T / Trillion 워드마크) + metadataBase onetrillion.app (STEP 364)" && git push
```

---

> **한 줄 요약**: 브랜드 파비콘(민트 T)+OG 카드(Trillion)+metadataBase(onetrillion.app). 브라우저 탭·링크 공유 미리보기 브랜드화. 메타 이미지 라우트라 클린 재시작 권장.
