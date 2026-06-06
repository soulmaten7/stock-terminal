<!-- 2026-06-06 -->
# STEP 167 — 하단 고정 티커(토스식) + 상단 티커 제거

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_167_COMMAND.md 파일 내용대로 실행해줘`

## 목표
토스처럼: **상단 TradingView 티커 제거** → 홈에서 **주요지수 그리드가 스크롤로 화면 밖에 나가면 하단에 얇은 마퀴 티커 등장**. 데이터는 그리드와 **같은 소스(`/api/yahoo/indices`)** → 숫자 불일치 해결.
- 인덱스 라우트에 **30초 서버 캐시** 추가(그리드+티커가 같이 호출 → Yahoo 부하 절감)
- 하단 티커는 **홈 전용**(HomeClientV6). 상단 티커는 전역 제거.

## 전제 상태
- HEAD: `84320d0`(STEP 166) 이상
- 변경 파일: `app/api/yahoo/indices/route.ts`(캐시) · `app/globals.css`(키프레임) · `app/layout.tsx`(상단 티커 제거) · `components/home-v6/HomeClientV6.tsx`(교체) · 신규 `components/home-v6/HomeStickyTicker.tsx`

---

## 작업 1/5 — `app/api/yahoo/indices/route.ts` (30초 캐시, 3곳)

### ① 캐시 변수 추가
**찾기:**
```ts
const yf = new YahooFinance();
```
**바꾸기:**
```ts
const yf = new YahooFinance();

// 30초 서버 캐시 — 그리드 + 하단 티커가 같은 데이터 공유, Yahoo 호출 절감
let _cache: { data: unknown; at: number } | null = null;
const _TTL = 30_000;
```

### ② GET 진입 시 캐시 확인
**찾기:**
```ts
export async function GET() {
  try {
```
**바꾸기:**
```ts
export async function GET() {
  if (_cache && Date.now() - _cache.at < _TTL) {
    return NextResponse.json(_cache.data);
  }
  try {
```

### ③ 응답 직전 캐시 저장
**찾기:**
```ts
    return NextResponse.json({ items: items.filter((x) => x.value !== "0") });
```
**바꾸기:**
```ts
    const payload = { items: items.filter((x) => x.value !== "0") };
    _cache = { data: payload, at: Date.now() };
    return NextResponse.json(payload);
```

---

## 작업 2/5 — `app/globals.css` (파일 맨 끝에 추가)

```css

/* 하단 마퀴 티커 — 항목 2배 복제 + -50% 이동으로 끊김 없는 루프 */
@keyframes ticker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.ticker-track {
  animation: ticker 40s linear infinite;
  will-change: transform;
}
.ticker-track:hover {
  animation-play-state: paused;
}
```

---

## 작업 3/5 — `app/layout.tsx` (상단 티커 제거, 2곳)

### ① import 삭제
아래 줄을 **삭제**:
```tsx
import TickerBar from '@/components/layout/TickerBar';
```

### ② 렌더 제거
**찾기:**
```tsx
            <Header />
            <TickerBar />
            <MainNav />
```
**바꾸기:**
```tsx
            <Header />
            <MainNav />
```
> `components/layout/TickerBar.tsx` 파일은 삭제하지 말 것(나중 재사용 가능, 빌드 무영향).

---

## 작업 4/5 — 신규 파일 `components/home-v6/HomeStickyTicker.tsx`

```tsx
"use client";

import { useEffect, useState, type RefObject } from "react";

type Item = {
  name: string;
  value: string;
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
      className={`fixed bottom-0 left-0 right-0 z-40 h-9 overflow-hidden border-t border-unjong-border bg-unjong-surface/95 backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="ticker-track flex h-full items-center whitespace-nowrap">
        {loop.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs">
            <span className="text-unjong-muted">{it.name}</span>
            <span className="font-semibold text-unjong-primary tabular-nums">{it.value}</span>
            <span className={`tabular-nums ${it.isUp ? "text-[#1AC267]" : "text-[#F04452]"}`}>
              {it.isUp ? "+" : ""}{it.changePct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

## 작업 5/5 — `components/home-v6/HomeClientV6.tsx` (파일 전체 교체)

```tsx
"use client";

import { useRef } from "react";
import HomeIndexBar from "./HomeIndexBar";
import HomeRightRail from "./HomeRightRail";
import HomeStickyTicker from "./HomeStickyTicker";
import MarketClient from "@/components/market/MarketClient";

export default function HomeClientV6() {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-6 py-5">
      {/* 시장 상태바 (토스식) */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-unjong-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
          국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
          해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
        </span>
      </div>

      {/* 지수 그리드 (이 영역이 화면 밖으로 나가면 하단 티커 등장) */}
      <div ref={gridRef}>
        <HomeIndexBar />
      </div>

      {/* 메인(실시간 랭킹) + 우측 관심 레일 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-5">
        <main className="min-w-0">
          <MarketClient embedded />
        </main>
        <HomeRightRail />
      </div>

      {/* 하단 고정 얇은 티커 (그리드와 동일 데이터, 스크롤 시 등장) */}
      <HomeStickyTicker observeRef={gridRef} />
    </div>
  );
}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/indices/route.ts app/globals.css app/layout.tsx components/home-v6/HomeStickyTicker.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 하단 고정 티커(토스식) — 그리드 동일 데이터, 스크롤 시 등장 + 상단 TradingView 티커 제거 + 인덱스 30s 캐시 (STEP 167)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **상단** TradingView 티커가 사라졌는지 (헤더 바로 아래 깔끔)
- [ ] 홈에서 **아래로 스크롤** → 주요지수 그리드가 화면 밖에 나가면 **하단에 얇은 티커 등장**, 다시 위로 올리면 사라지는지
- [ ] 하단 티커 숫자가 **주요지수 그리드와 동일**한지 (S&P·코스피 등)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작
- (참고) 하단 티커가 푸터 맨 아래 글자를 살짝 가리면 알려주세요 — 여백 추가로 잡을게요.

## 주의·예상 이슈
- 하단 티커는 **홈 전용**(다른 페이지엔 없음 — 상단 티커도 제거됨). 전역 적용은 추후.
- 마퀴 속도 바꾸려면 `globals.css` `.ticker-track` 의 `40s` 숫자만 수정. 마우스 올리면 일시정지.
- 30초 캐시라 값은 최대 30초 지연(지수엔 충분).

---
> STEP 167 = 하단 토스식 티커 + 상단 제거. 전제 `84320d0`. 다음: 랭킹 토스화 / 종목상세 3단. 문서 묶어 갱신.
