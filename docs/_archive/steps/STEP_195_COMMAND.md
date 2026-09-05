<!-- 2026-06-07 -->
# STEP 195 — 인기토론 홈 ① 얇은 지수 티커 헤더 밑 고정 (HomeIndexStrip)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_195_COMMAND.md 파일 내용대로 실행해줘`

## 목표
'주요지수' 큰 박스를 인기토론으로 바꾸기 전, **지수 앵커를 잃지 않게** 얇은 지수 티커를 **홈 맨 위(헤더 밑)에 고정**.
- 하단 마퀴(`HomeStickyTicker`)와 **동일 데이터**(`/api/yahoo/indices`)·동일 스타일, 단 항상 표시(스크롤 시 상단 고정 `sticky top-0`).
- 한국식 색(상승 빨강·하락 파랑) 이미 반영됨.
- 이번 STEP은 **추가만**(큰 박스·하단 티커 유지). 박스→인기토론 교체는 ③(STEP 197).

## 전제 상태
- HEAD: STEP 194 + 문서 갱신 커밋 상태
- 변경: `components/home-v6/HomeIndexStrip.tsx`(신규) + `components/home-v6/HomeClientV6.tsx`(상단 배치)

---

## 작업 1/2 — 신규 `components/home-v6/HomeIndexStrip.tsx` (파일 생성)

```tsx
"use client";

import { useEffect, useState } from "react";

type Item = { name: string; value: string; changeText?: string; changePct: number; isUp: boolean };

export default function HomeIndexStrip() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const j = await (await fetch("/api/yahoo/indices")).json();
        if (!cancelled) setItems(j.items || []);
      } catch {
        /* 무시 */
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (items.length === 0) return null;
  const loop = [...items, ...items]; // 끊김 없는 루프용 2배 복제

  return (
    <div className="sticky top-0 z-30 -mx-6 -mt-5 mb-4 flex h-9 items-center border-b border-unjong-border bg-unjong-surface/95 backdrop-blur">
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex h-full items-center whitespace-nowrap">
          {loop.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs">
              <span className="text-unjong-muted">{it.name}</span>
              <span className="font-semibold tabular-nums text-unjong-primary">{it.value}</span>
              <span className={`tabular-nums ${it.isUp ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                {it.changeText ? `${it.changeText} ` : ""}({it.isUp ? "+" : ""}{it.changePct.toFixed(2)}%)
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

> `-mx-6 -mt-5`로 홈 패딩 상쇄 → 헤더 밑에 풀폭 밀착. `sticky top-0`으로 스크롤해도 상단 고정. 마퀴는 기존 `.ticker-track` 재사용.

## 작업 2/2 — `components/home-v6/HomeClientV6.tsx` (스트립 상단 배치)

**찾기:**
```tsx
import HomeIndexBar from "./HomeIndexBar";
```
**바꾸기:**
```tsx
import HomeIndexBar from "./HomeIndexBar";
import HomeIndexStrip from "./HomeIndexStrip";
```

**찾기:**
```tsx
  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
```
**바꾸기:**
```tsx
  return (
    <div className="px-6 py-5">
      {/* 얇은 지수 티커 (헤더 밑 고정 — 지수 앵커) */}
      <HomeIndexStrip />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeIndexStrip.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 얇은 지수 티커 헤더 밑 고정(HomeIndexStrip) — 인기토론 홈 ① (STEP 195)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 **맨 위(헤더 밑)에 얇은 지수 티커** 풀폭으로 흐르는지, 스크롤해도 상단 고정되는지
- [ ] 색(상승 빨강·하락 파랑)·숫자가 큰 주요지수 박스와 동일한지
- [ ] 큰 주요지수 박스·하단 마퀴는 아직 그대로(이번엔 추가만)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 상단 마퀴가 계속 움직여 산만하면 → 정적 스트립으로 전환 가능(말해주면 변경).
- 헤더가 sticky가 아니라, 스크롤 시 헤더는 사라지고 스트립이 상단에 붙음(지수 앵커 역할).
- 다음 ②(STEP 196): 인기토론 2열 라이브 컴포넌트 · ③(STEP 197): 큰 박스→인기토론 교체 + 하단 마퀴 제거.

---
> STEP 195 = 인기토론 홈 ① 지수 스트립. 전제 STEP 194. 다음: ② 인기토론 2열. 문서 묶어 갱신.
