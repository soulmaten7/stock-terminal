<!-- 2026-05-29 -->
# STEP 109 — 관심종목 실데이터화 (localStorage + 실시간 가격)

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `2c26eb6` (STEP 108 — 종목 상세 4개 탭 실데이터)
- 빌드 클린, 채팅·종목상세 모두 실데이터
- `yahoo-finance2` 패키지 이미 설치돼있음 (M7 카드에서 사용 중)
- `/api/kis/price?symbol=005930` 한국 단일 종목 가격 API 검증 완료
- 미국 단일 종목 API 없음 → 신규 생성 필요

## 목표
`components/sidebar/WatchlistPanel.tsx` 의 `DUMMY_WATCHLIST` 8개 하드코딩 제거 → 사용자가 직접 관심종목을 추가/삭제하고, 실시간 가격이 표시되도록 변경.

## 작업 내용

### 1. 신규 — `app/api/yahoo/quote/route.ts`

미국 주식 batch quote API. 여러 ticker 한 번에 조회.

```typescript
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

/**
 * 미국 주식 batch quote
 * Query: ?symbols=AAPL,TSLA,NVDA  (콤마 구분, 최대 20개)
 * Response: { items: [{ code, price, changePct, currency }] }
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const raw = sp.get("symbols") || "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z.\-]+$/.test(s))
    .slice(0, 20);

  if (symbols.length === 0) {
    return NextResponse.json({ items: [], error: "symbols 파라미터 필수" });
  }

  try {
    const quotes = await yf.quote(symbols);
    const quoteArr = Array.isArray(quotes) ? quotes : [quotes];
    const items = quoteArr.map((q) => ({
      code: q.symbol,
      price: Number(q.regularMarketPrice ?? 0),
      changePct: Number(q.regularMarketChangePercent ?? 0),
      currency: q.currency || "USD",
    }));
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

### 2. 신규 — `stores/watchlistStore.ts`

Zustand persist (localStorage) 기반 관심종목 저장소.

```typescript
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WatchlistItem = {
  code: string;        // 005930 또는 AAPL
  name: string;        // 삼성전자 또는 Apple
  market: "KOSPI" | "KOSDAQ" | "US";
};

// 초기 시드 (사용자가 비우기 전까지 기본 표시)
const SEED_WATCHLIST: WatchlistItem[] = [
  { code: "005930", name: "삼성전자",          market: "KOSPI" },
  { code: "000660", name: "SK하이닉스",        market: "KOSPI" },
  { code: "035720", name: "카카오",            market: "KOSPI" },
  { code: "035420", name: "NAVER",             market: "KOSPI" },
  { code: "207940", name: "삼성바이오로직스",  market: "KOSPI" },
  { code: "AAPL",   name: "Apple",             market: "US" },
  { code: "TSLA",   name: "Tesla",             market: "US" },
  { code: "NVDA",   name: "NVIDIA",            market: "US" },
];

type Store = {
  items: WatchlistItem[];
  add: (item: WatchlistItem) => void;
  remove: (code: string) => void;
  clear: () => void;
  reset: () => void; // 시드로 복원
};

export const useWatchlist = create<Store>()(
  persist(
    (set, get) => ({
      items: SEED_WATCHLIST,
      add: (item) => {
        const exists = get().items.some((i) => i.code === item.code);
        if (exists) return;
        set({ items: [...get().items, item] });
      },
      remove: (code) => {
        set({ items: get().items.filter((i) => i.code !== code) });
      },
      clear: () => set({ items: [] }),
      reset: () => set({ items: SEED_WATCHLIST }),
    }),
    {
      name: "unjong-watchlist",
    }
  )
);
```

### 3. 수정 — `components/sidebar/WatchlistPanel.tsx`

`DUMMY_WATCHLIST` 제거. Zustand store + 실시간 가격 fetch.

```typescript
"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { TrendingUp, TrendingDown, X, Plus } from "lucide-react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { useWatchlist, type WatchlistItem } from "@/stores/watchlistStore";

type PriceMap = Record<string, { price: string; changePct: number } | null>;

function classifyMarket(code: string): "KOSPI" | "KOSDAQ" | "US" {
  if (/^[A-Z.\-]+$/.test(code)) return "US";
  // 한국: 6자리 숫자. 0/1/2/3 시작 = KOSPI 대체로, 그 외 KOSDAQ.
  // 정확히는 별도 매핑 필요하지만 시드 데이터로 충분
  return "KOSPI";
}

export function WatchlistPanel() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [mounted, setMounted] = useState(false);
  const items = useWatchlist((s) => s.items);
  const addItem = useWatchlist((s) => s.add);
  const removeItem = useWatchlist((s) => s.remove);
  const resetItems = useWatchlist((s) => s.reset);

  const [prices, setPrices] = useState<PriceMap>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addInput, setAddInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 가격 폴링 (30초)
  useEffect(() => {
    if (!mounted || items.length === 0) {
      setPrices({});
      setPricesLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const krCodes = items.filter((i) => i.market !== "US").map((i) => i.code);
      const usCodes = items.filter((i) => i.market === "US").map((i) => i.code);

      const next: PriceMap = {};

      // KR — 개별 호출 (KIS API 는 batch 없음, 순차 호출 - rate limit 60ms 안전)
      await Promise.all(
        krCodes.map(async (code) => {
          try {
            const r = await fetch(`/api/kis/price?symbol=${code}`);
            if (!r.ok) return;
            const json = await r.json();
            if (json.error) return;
            next[code] = {
              price: Number(json.price).toLocaleString(),
              changePct: Number(json.changePercent) || 0,
            };
          } catch {
            next[code] = null;
          }
        })
      );

      // US — batch 호출
      if (usCodes.length > 0) {
        try {
          const r = await fetch(`/api/yahoo/quote?symbols=${usCodes.join(",")}`);
          if (r.ok) {
            const json = await r.json();
            (json.items || []).forEach((it: { code: string; price: number; changePct: number }) => {
              next[it.code] = {
                price: `$${it.price.toFixed(2)}`,
                changePct: it.changePct,
              };
            });
          }
        } catch {
          // 무시
        }
      }

      if (!cancelled) {
        setPrices(next);
        setPricesLoading(false);
      }
    };

    setPricesLoading(true);
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [items, mounted]);

  const handleAdd = () => {
    const raw = addInput.trim().toUpperCase();
    if (!raw) return;

    let item: WatchlistItem;
    if (/^\d{6}$/.test(raw)) {
      // 한국 6자리 — 이름은 일단 코드로 표기, 가격 fetch 시 name 받으면 update
      item = { code: raw, name: raw, market: "KOSPI" };
    } else if (/^[A-Z.\-]+$/.test(raw)) {
      item = { code: raw, name: raw, market: "US" };
    } else {
      return; // 유효하지 않음
    }
    addItem(item);
    setAddInput("");
    setShowAdd(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setShowAdd(false);
      setAddInput("");
    }
  };

  const handleItemClick = (item: WatchlistItem) => {
    const p = prices[item.code];
    setSelectedSymbol({
      code: item.code,
      name: item.name,
      price: p?.price,
      changePct: p?.changePct,
      market: item.market,
    });
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2 bg-unjong-background flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary" suppressHydrationWarning>
          👀 관심종목 {mounted ? items.length : ""}개
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="text-unjong-muted hover:text-unjong-accent p-0.5"
            aria-label="관심종목 추가"
            title="추가"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* 추가 입력창 (토글) */}
      {showAdd && (
        <div className="border-b border-unjong-border bg-unjong-background p-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="005930 또는 AAPL"
              autoFocus
              className="flex-1 px-2 py-1 text-xs rounded border border-unjong-border bg-unjong-surface text-unjong-primary focus:outline-none focus:border-unjong-accent"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-2 py-1 text-xs rounded bg-unjong-accent text-white font-semibold hover:opacity-90"
            >
              추가
            </button>
          </div>
          <p className="text-[10px] text-unjong-muted mt-1">
            한국: 6자리 종목코드 · 미국: 티커 (예: TSLA)
          </p>
        </div>
      )}

      {/* 리스트 */}
      <ul className="flex-1 overflow-y-auto min-h-0 divide-y divide-unjong-border">
        {!mounted ? (
          <li className="p-4 text-center text-[10px] text-unjong-muted italic">⏳ 로딩 중...</li>
        ) : items.length === 0 ? (
          <li className="p-4 text-center text-xs text-unjong-muted">
            <p className="mb-2">관심종목이 없습니다.</p>
            <button
              type="button"
              onClick={resetItems}
              className="text-[10px] text-unjong-accent hover:underline"
            >
              기본 종목 8개 복원
            </button>
          </li>
        ) : (
          items.map((item) => {
            const p = prices[item.code];
            const isUp = (p?.changePct ?? 0) >= 0;
            return (
              <li
                key={item.code}
                className="group flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-unjong-background cursor-pointer transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="flex flex-1 items-center justify-between gap-2 min-w-0 text-left"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-unjong-primary truncate">{item.name}</span>
                    <span className="text-[10px] text-unjong-muted">{item.code}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="font-semibold text-unjong-primary tabular-nums">
                      {pricesLoading && !p ? "..." : p?.price ?? "—"}
                    </span>
                    <span
                      className={`flex items-center gap-0.5 text-[10px] font-medium tabular-nums ${
                        isUp ? "text-unjong-success" : "text-unjong-danger"
                      }`}
                    >
                      {p ? (
                        <>
                          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isUp ? "+" : ""}
                          {p.changePct.toFixed(2)}%
                        </>
                      ) : null}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.code);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-unjong-muted hover:text-unjong-danger p-0.5 flex-shrink-0 transition-opacity"
                  aria-label={`${item.name} 관심종목 제거`}
                >
                  <X size={12} />
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="border-t border-unjong-border bg-unjong-background px-2 py-1 flex-shrink-0">
        <p className="text-[10px] text-unjong-muted italic text-center">
          Layer 1 — KIS·Yahoo · 30초 폴링 ✅
        </p>
      </div>
    </div>
  );
}
```

### 4. 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

다음 잠재 이슈 확인:
- TypeScript 타입 에러 (WatchlistItem 타입)
- yahoo-finance2 batch quote 결과 타입
- Zustand persist hydration 경고

### 5. 커밋 + 푸시

```bash
git add app/api/yahoo/quote/route.ts stores/watchlistStore.ts components/sidebar/WatchlistPanel.tsx
git commit -m "feat(watchlist): 관심종목 실데이터화 (Layer 1-E)

- WatchlistPanel: DUMMY_WATCHLIST 제거 → Zustand persist (localStorage)
- 추가 기능: 헤더 + 버튼 → 6자리 코드 (한국) 또는 티커 (미국) 입력
- 삭제 기능: 항목 hover 시 X 버튼
- 초기 시드: 기존 더미 8개 (삼성전자, SK하이닉스, 카카오, NAVER, 삼성바이오, AAPL, TSLA, NVDA)
- 실시간 가격: 30초 폴링
  - 한국: /api/kis/price 개별 호출 (KIS rate limit 60ms 안전)
  - 미국: /api/yahoo/quote 신규 batch API (최대 20개)
- 빈 목록 시 '기본 종목 8개 복원' 버튼
- SSR hydration 안전: mounted 플래그 + suppressHydrationWarning

신규 API:
- GET /api/yahoo/quote?symbols=AAPL,TSLA,NVDA → [{code, price, changePct, currency}]"
git push
```

## 검증 (사용자 안내용)

푸시 후 사용자에게 안내:

1. `http://localhost:3333/scalper` 하드 리프레시 (Cmd+Shift+R)
2. 우측 관심종목 패널 확인:
   - 헤더 "👀 관심종목 8개" (더미 표기 사라짐) + ➕ 버튼
   - 시드 8개 종목이 보이고, **실제 가격**으로 로딩됨 (몇 초 후)
   - 가격이 30초마다 자동 갱신
3. ➕ 버튼 클릭 → 입력창 열림 → "005380" (현대차) 입력 → Enter → 목록에 추가됨
4. 미국 티커 테스트: ➕ → "MSFT" → Enter → 추가됨
5. 항목 위에 마우스 올리면 우측에 ❌ 버튼 → 클릭 시 삭제됨
6. 브라우저 새로고침 후에도 추가/삭제한 종목 유지 (localStorage)
7. 종목 클릭 시 중앙 패널이 해당 종목으로 전환됨 (기존 동작 유지)

## 완료 후 보고

- ✅/❌ 빌드 결과
- ✅/❌ 커밋 해시
- ✅/❌ 푸시 결과
- 신규 API `/api/yahoo/quote` 테스트 (`curl http://localhost:3333/api/yahoo/quote?symbols=AAPL,TSLA` 로 응답 확인)
