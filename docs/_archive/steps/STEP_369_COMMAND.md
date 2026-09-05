<!-- 2026-06-23 -->
# STEP 369 — [브랜드] 로고(02 T 모노그램) 전면 적용

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_369_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
확정 로고 = **02 T 모노그램**(윗줄 3조각 블록 + 기둥 = 'T', 흩어진→하나). 미드나잇 `#0E1116` + 민트 `#2DD4BF`. 파비콘·앱아이콘·OG·헤더 워드마크에 전면 적용.

> 변경: `app/icon.svg`·`app/apple-icon.tsx`·`app/opengraph-image.tsx` 전체 교체 + `components/layout/Header.tsx` 로고 1곳.
> ⚠️ apple-icon·opengraph-image는 생성 라우트 → dev 서버 클린 재시작 권장.

---

## 📄 1) `app/icon.svg` — 전체 교체 (파비콘)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0E1116"/>
  <rect x="16" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF"/>
  <rect x="42.5" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF"/>
  <rect x="69" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF"/>
  <rect x="42.5" y="35" width="15" height="43" rx="2.5" fill="#2DD4BF"/>
</svg>
```

---

## 📄 2) `app/apple-icon.tsx` — 전체 교체

```tsx
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
```

---

## 📄 3) `app/opengraph-image.tsx` — 전체 교체

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Trillion';

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
        <div style={{ fontSize: 130, fontWeight: 800, color: '#FBFCFD', letterSpacing: -3 }}>Trillion</div>
        <div style={{ marginTop: 22, fontSize: 34, color: '#FFFFFF', opacity: 0.78 }}>Finance, all in one place</div>
      </div>
    ),
    { ...size }
  );
}
```

---

## 📄 4) `components/layout/Header.tsx` — 워드마크 앞에 심볼

**찾기:**
```tsx
        <Link href="/" onClick={resetHome} className="flex shrink-0 items-center gap-1.5 hover:opacity-80">
          <span className="text-lg font-bold tracking-wide text-white">Trillion</span>
          <span className="hidden text-sm text-white/45 sm:inline">트릴리언</span>
        </Link>
```
**바꾸기:**
```tsx
        <Link href="/" onClick={resetHome} className="flex shrink-0 items-center gap-2 hover:opacity-80">
          <svg width="22" height="22" viewBox="0 0 100 100" className="shrink-0" aria-hidden="true">
            <rect x="16" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="42.5" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="69" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="42.5" y="35" width="15" height="43" rx="2.5" fill="#2DD4BF" />
          </svg>
          <span className="text-lg font-bold tracking-wide text-white">Trillion</span>
          <span className="hidden text-sm text-white/45 sm:inline">트릴리언</span>
        </Link>
```

---

## ✅ 검증 (생성 라우트 → 클린 재시작 권장)
```bash
npm run build
```
빌드 무에러.

dev 서버 클린 재시작:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. **브라우저 탭 아이콘** = 미드나잇 바탕 민트 T-모노그램(이전 단순 'T' 아님).
2. 헤더 좌상단 = **민트 심볼 + Trillion** 워드마크.
3. `localhost:3333/apple-icon` = 민트 모노그램 180×180.
4. `localhost:3333/opengraph-image` = 심볼 + Trillion + 태그라인 카드.

> ※ apple-icon·OG는 satori(next/og)가 인라인 `<svg>`를 렌더. 혹시 빌드/렌더 오류 나면 알려줘 — div 포지셔닝 방식으로 바꿔줄게.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/icon.svg app/apple-icon.tsx app/opengraph-image.tsx components/layout/Header.tsx && git commit -m "feat(brand): T 모노그램 로고 전면 적용 — 파비콘·앱아이콘·OG·헤더 (STEP 369)" && git push
```

---

> **한 줄 요약**: 확정 로고(02 T 모노그램)를 파비콘·앱아이콘·OG·헤더에 적용. 미드나잇+민트. 앱스토어 대비 또렷. 생성 라우트라 클린 재시작 권장.
