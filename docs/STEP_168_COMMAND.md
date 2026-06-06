<!-- 2026-06-06 -->
# STEP 168 — 하단 티커 디테일 (금액 + 실제 이동 + 투자유의사항 라벨)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_168_COMMAND.md 파일 내용대로 실행해줘`

## 목표
하단 티커를 토스 수준으로:
1. **전일대비 금액 표시** — `코스피 8,160.59 -478.82 (-5.54%)` (지금은 % 만)
2. **마퀴 실제로 흐르게** — `.ticker-track`가 `flex`라 박스폭이 100%로 잡혀 `-50%` 이동이 어긋남 → **`width: max-content`** 추가
3. **왼쪽 끝 고정 "투자유의사항" 라벨** (스크롤 안 함)

## 전제 상태
- HEAD: `237bd43`(STEP 167) 이상
- 변경: `app/globals.css`(1줄) · `components/home-v6/HomeStickyTicker.tsx`(전체 교체)

---

## 작업 1/2 — `app/globals.css` (마퀴 이동 버그 수정)

**찾기:**
```css
.ticker-track {
  animation: ticker 40s linear infinite;
  will-change: transform;
}
```
**바꾸기:**
```css
.ticker-track {
  width: max-content;
  animation: ticker 40s linear infinite;
  will-change: transform;
}
```
> 핵심: `width: max-content` 가 있어야 트랙 박스 폭 = 콘텐츠 전체폭. 그래야 `translateX(-50%)`가 정확히 "한 세트(2배 복제의 절반)"만큼 이동 → 끊김 없이 실제로 흐름.

---

## 작업 2/2 — `components/home-v6/HomeStickyTicker.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState, type RefObject } from "react";

type Item = {
  name: string;
  value: string;
  changeText?: string;
  changePct: number;
  isUp: boolean;
};

export default function HomeStickyTicker({ observeRef }: { observeRef: RefObject<HTMLElement | null> }) {
  const [items, setItems] = useState<Item[]>([]);
  const [show, setShow] = useState(false);

  // 데이터: 주요지수 그리드와 동일 소스
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const j = await (await fetch("/api/yahoo/indices")).json();
        if (!cancelled) setItems(j.items || []);
      } catch { /* 무시 */ }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // 주요지수 그리드가 화면 밖으로 나가면 표시
  useEffect(() => {
    const el = observeRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [observeRef]);

  if (items.length === 0) return null;

  const loop = [...items, ...items]; // 끊김 없는 루프용 2배 복제

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 flex h-9 border-t border-unjong-border bg-unjong-surface/95 backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      {/* 왼쪽 고정 라벨 (스크롤 안 함) */}
      <div className="flex shrink-0 items-center gap-1 border-r border-unjong-border bg-unjong-background px-3 text-[11px] font-semibold text-unjong-muted">
        ⚠ 투자유의사항
      </div>

      {/* 스크롤 트랙 */}
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex h-full items-center whitespace-nowrap">
          {loop.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs">
              <span className="text-unjong-muted">{it.name}</span>
              <span className="font-semibold text-unjong-primary tabular-nums">{it.value}</span>
              <span className={`tabular-nums ${it.isUp ? "text-[#1AC267]" : "text-[#F04452]"}`}>
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

> 변경점: ① 각 항목에 `changeText`(전일대비 금액) 추가 → `코스피 8,160.59 -478.82 (-5.54%)` ② 왼쪽 `⚠ 투자유의사항` 고정 라벨 + 나머지는 스크롤 트랙으로 분리 ③ (globals.css와 함께) 실제로 흐름.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/globals.css components/home-v6/HomeStickyTicker.tsx && git commit -m "fix(ticker): 하단 티커 — 전일대비 금액 + 마퀴 실제 이동(width max-content) + 투자유의사항 라벨 (STEP 168)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 하단 티커가 **실제로 좌측으로 흐르는지**(움직임). 마우스 올리면 멈춤.
- [ ] 각 항목에 **금액 표시**: `코스피 8,160.59 -478.82 (-5.54%)` 형태
- [ ] 왼쪽 끝에 **⚠ 투자유의사항** 고정 라벨 (스크롤 안 함)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작 (CSS 변경이라 특히 캐시 클리어 필요)

## 주의·예상 이슈
- 안 움직이면 globals.css 의 `width: max-content` 가 안 들어갔거나 CSS 캐시 → `.next` 삭제 후 재시작.
- 속도 조절: `globals.css` `.ticker-track` 의 `40s` 숫자.
- (옵션) 토스처럼 항목 더 넣고 싶으면(달러인덱스 등) `/api/yahoo/indices` 심볼 추가 — 단 그리드에도 같이 늘어남. 원하면 별도로.

---
> STEP 168 = 하단 티커 디테일(금액·이동·라벨). 전제 `237bd43`. 다음: 랭킹 토스화 / 종목상세 3단. 문서 묶어 갱신.
