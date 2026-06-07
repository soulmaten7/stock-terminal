<!-- 2026-06-06 -->
# STEP 185 — 지수 스파크라인 area fill (선 밑 그라데이션, 토스/네이버식)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_185_COMMAND.md 파일 내용대로 실행해줘`

## 목표
주요 지수 카드의 스파크라인이 지금은 **선만** → 토스·네이버처럼 **선 밑을 옅은 그라데이션으로 채워** 등락 폭 체감.
- 데이터(`spark`)는 그대로, 렌더링만 변경
- 상승=초록 채움, 하락=빨강 채움(선 색과 동일). 위는 옅게(0.26)→아래 투명
- 외부 라이브러리 X (inline SVG)

## 전제 상태
- HEAD: STEP 184 적용된 상태
- 변경: `components/home-v6/HomeIndexBar.tsx`(import 1줄 + Sparkline 함수) 1파일

---

## 작업 1/2 — import 에 `useId` 추가

**찾기:**
```tsx
import { useEffect, useState } from "react";
```
**바꾸기:**
```tsx
import { useEffect, useId, useState } from "react";
```

## 작업 2/2 — `Sparkline` 함수 교체

**찾기:**
```tsx
// 작은 추세선(스파크라인) — 외부 라이브러리 없이 inline SVG
function Sparkline({ points, up }: { points?: number[]; up: boolean }) {
  if (!points || points.length < 2) return null;
  const w = 100;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-5 mt-1.5" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={up ? "#1AC267" : "#F04452"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
```

**바꾸기:**
```tsx
// 작은 추세선(스파크라인) — inline SVG (선 + 밑면 그라데이션으로 등락 체감)
function Sparkline({ points, up }: { points?: number[]; up: boolean }) {
  const rawId = useId();
  if (!points || points.length < 2) return null;
  const gid = `sg${rawId.replace(/:/g, "")}`;
  const w = 100;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const color = up ? "#1AC267" : "#F04452";
  const line = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-5 mt-1.5" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.26} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
```

> 핵심: 선 path(`line`) 밑에 baseline(y=h)까지 닫은 area path를 추가하고, `useId`로 카드마다 고유 그라데이션 id 부여(충돌 방지). 선은 그대로 위에 한 번 더 그림.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeIndexBar.tsx && git commit -m "feat(v7): 지수 스파크라인 area fill — 선 밑 그라데이션(토스/네이버식 등락 체감) (STEP 185)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 주요 지수 카드 스파크라인이 **선 밑까지 옅은 색으로 채워지는지**(상승 초록·하락 빨강), 위 진하고 아래로 투명
- [ ] 선은 그대로 또렷하게 보이는지
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- `useId`는 hook이라 early-return 위에서 호출(순서 OK). 콜론 제거해 SVG id로 사용.
- 채움 진하기 조절: `stopOpacity={0.26}` 숫자만 바꾸면 됨(0.2~0.35 권장).
- 하단 고정 티커엔 스파크라인 없음 — 이 카드만 적용.

---
> STEP 185 = 스파크라인 area fill. 전제 STEP 184. 다음: 카테고리 2열 레이아웃 등. 문서 묶어 갱신.
