<!-- 2026-05-29 -->
# STEP 108 — 종목 상세 패널 4개 탭 실데이터화

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `ca1b4f2` (STEP 107 — anon client 교체)
- 빌드 클린, 채팅 실시간 정상 작동
- `lightweight-charts@4.2.3` 이미 설치돼 있음
- KIS API 4개 모두 검증 완료:
  - `/api/kis/chart?symbol=005930&period=D` → `{candles: [{time, open, high, low, close, volume}]}`
  - `/api/kis/orderbook?symbol=005930` → `{asks: [{price, volume}×10], bids: [{price, volume}×10]}`
  - `/api/kis/execution?symbol=005930` → `{executions: [{time, price, change, changeSign, volume, totalVolume}×30]}`
  - `/api/kis/price?symbol=005930` → `{name, price, change, changePercent, open, high, low, volume, high52w, low52w, per, pbr, marketCap, dividendYield}`

## 목표
`components/sidepanel/StockDetailPanel.tsx` 의 4개 탭 (ChartTab / OrderBookTab / TickTab / OverviewTab) 을 전부 실데이터로 교체.

각 탭은 `selectedSymbol.code` 를 받아 해당 종목의 실데이터를 가져옴.

미국 주식(`AAPL`, `TSLA` 등)은 KIS API 가 한국 주식만 지원하므로 fallback 메시지 표시.

## 작업 내용

### 1. `components/sidepanel/StockDetailPanel.tsx` 전면 수정

각 탭 컴포넌트에 `symbol: string` prop 전달. 4개 탭 각각 다음 패턴 적용:

```typescript
const [data, setData] = useState<XxxData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!symbol || !/^\d{6}$/.test(symbol)) {
    // 미국 주식 등 6자리 숫자 아닌 코드 → 메시지 표시
    setLoading(false);
    return;
  }
  let cancelled = false;
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/kis/{endpoint}?symbol=${symbol}`);
      if (!r.ok) throw new Error(`API ${r.status}`);
      const json = await r.json();
      if (cancelled) return;
      setData(json);
    } catch (err) {
      if (cancelled) return;
      setError(String(err));
    } finally {
      if (!cancelled) setLoading(false);
    }
  };
  load();
  // 폴링: orderbook/tick 만 10초마다 갱신
  const interval = /* ... */;
  return () => { cancelled = true; if (interval) clearInterval(interval); };
}, [symbol]);
```

### 2. ChartTab 구체 구현

`lightweight-charts` 는 SSR 에서 `window` 참조하므로 **dynamic import** + `useRef` 패턴 필수:

```typescript
"use client";
import { useEffect, useRef, useState } from "react";

type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };
type ChartData = { symbol: string; name: string; period: string; candles: Candle[]; count: number };

function ChartTab({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"D" | "W" | "M">("D");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !/^\d{6}$/.test(symbol)) {
      setLoading(false);
      return;
    }
    if (!containerRef.current) return;

    let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(`/api/kis/chart?symbol=${symbol}&period=${period}`).then((r) => {
            if (!r.ok) throw new Error(`API ${r.status}`);
            return r.json() as Promise<ChartData>;
          }),
        ]);

        if (cancelled || !containerRef.current) return;

        // 컨테이너 비우기 (이전 차트 제거)
        containerRef.current.innerHTML = "";

        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 300,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#475569",
            fontFamily: "inherit",
          },
          grid: {
            vertLines: { color: "#e2e8f0", style: LineStyle.Dotted },
            horzLines: { color: "#e2e8f0", style: LineStyle.Dotted },
          },
          rightPriceScale: { borderColor: "#cbd5e1" },
          timeScale: { borderColor: "#cbd5e1", timeVisible: false },
          handleScroll: true,
          handleScale: true,
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: "#0E7C7B",
          downColor: "#C73E3A",
          borderUpColor: "#0E7C7B",
          borderDownColor: "#C73E3A",
          wickUpColor: "#0E7C7B",
          wickDownColor: "#C73E3A",
        });

        candleSeries.setData(
          res.candles.map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );

        chart.timeScale().fitContent();

        // 리사이즈 핸들러
        const ro = new ResizeObserver(() => {
          if (chart && containerRef.current) {
            chart.applyOptions({ width: containerRef.current.clientWidth });
          }
        });
        ro.observe(containerRef.current);
        // cleanup 에서 ro 제거 → 클로저로 보관
        (chart as unknown as { _ro?: ResizeObserver })._ro = ro;
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (chart) {
        const ro = (chart as unknown as { _ro?: ResizeObserver })._ro;
        if (ro) ro.disconnect();
        chart.remove();
        chart = null;
      }
    };
  }, [symbol, period]);

  const isUsStock = symbol && /^[A-Z]+$/.test(symbol);

  if (isUsStock) {
    return (
      <div className="p-4 text-center text-xs text-unjong-muted italic">
        미국 주식 차트는 추후 Yahoo Finance / TradingView 위젯으로 추가 예정
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1 flex-wrap">
        {(["D", "W", "M"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`text-[10px] px-2 py-1 rounded ${
              period === p
                ? "bg-unjong-accent text-white font-semibold"
                : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
            }`}
          >
            {p === "D" ? "일봉" : p === "W" ? "주봉" : "월봉"}
          </button>
        ))}
      </div>

      <div className="w-full h-[300px] rounded border border-unjong-border bg-unjong-background relative">
        <div ref={containerRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-unjong-muted bg-unjong-background/80">
            ⏳ 차트 로딩 중...
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-unjong-danger px-4 text-center">
            ❌ 차트 로딩 실패: {error}
          </div>
        )}
      </div>

      <p className="text-[10px] text-unjong-muted italic text-center">
        Layer 1 — KIS chart API 연결됨 ✅
      </p>
    </div>
  );
}
```

### 3. OrderBookTab 구체 구현

```typescript
type OrderBookEntry = { price: number; volume: number };
type OrderBookData = {
  symbol: string;
  asks: OrderBookEntry[]; // 10개 (역순: 가장 높은 가격 위)
  bids: OrderBookEntry[]; // 10개
  totalAskVolume: number;
  totalBidVolume: number;
};

function OrderBookTab({ symbol }: { symbol: string }) {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!symbol || !/^\d{6}$/.test(symbol)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [obRes, pRes] = await Promise.all([
          fetch(`/api/kis/orderbook?symbol=${symbol}`).then((r) => r.json()),
          fetch(`/api/kis/price?symbol=${symbol}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (obRes.error) {
          setError(obRes.error);
        } else {
          setData(obRes);
          if (pRes.price) setCurrentPrice(pRes.price);
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000); // 10초 폴링
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  if (symbol && !/^\d{6}$/.test(symbol)) {
    return (
      <div className="p-4 text-center text-xs text-unjong-muted italic">
        미국 주식 호가창은 별도 데이터 소스 필요
      </div>
    );
  }

  if (loading && !data) {
    return <div className="p-4 text-center text-xs text-unjong-muted italic">⏳ 호가 로딩 중...</div>;
  }
  if (error || !data) {
    return <div className="p-4 text-center text-xs text-unjong-danger">❌ {error || "데이터 없음"}</div>;
  }

  return (
    <div className="p-3 space-y-1">
      <div className="space-y-0.5">
        {data.asks.filter((a) => a.price > 0).map((ask, i) => (
          <div key={i} className="flex items-center justify-between bg-emerald-50 rounded px-2 py-1 text-xs">
            <span className="text-unjong-muted tabular-nums">{ask.volume.toLocaleString()}</span>
            <span className="font-semibold text-unjong-success tabular-nums">{ask.price.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="border-y border-unjong-border my-1 py-1.5 text-center bg-unjong-background">
        <span className="text-sm font-bold text-unjong-accent">
          {currentPrice ? currentPrice.toLocaleString() : "—"}
        </span>
        <span className="text-[10px] text-unjong-muted ml-2">현재가</span>
      </div>

      <div className="space-y-0.5">
        {data.bids.filter((b) => b.price > 0).map((bid, i) => (
          <div key={i} className="flex items-center justify-between bg-red-50 rounded px-2 py-1 text-xs">
            <span className="font-semibold text-unjong-danger tabular-nums">{bid.price.toLocaleString()}</span>
            <span className="text-unjong-muted tabular-nums">{bid.volume.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-unjong-muted italic text-center mt-2">
        Layer 1 — KIS orderbook API · 10초 폴링 ✅
      </p>
    </div>
  );
}
```

### 4. TickTab 구체 구현

```typescript
type Execution = {
  time: string;       // HHMMSS
  price: number;
  change: number;
  changeSign: string; // 1=상한 2=상승 3=보합 4=하한 5=하락
  volume: number;
  totalVolume: number;
};

type TickData = { symbol: string; executions: Execution[] };

function TickTab({ symbol }: { symbol: string }) {
  const [data, setData] = useState<TickData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !/^\d{6}$/.test(symbol)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/execution?symbol=${symbol}`);
        const json = await r.json();
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000); // 5초 폴링
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  if (symbol && !/^\d{6}$/.test(symbol)) {
    return (
      <div className="p-4 text-center text-xs text-unjong-muted italic">
        미국 주식 체결은 별도 데이터 소스 필요
      </div>
    );
  }

  if (loading && !data) return <div className="p-4 text-center text-xs text-unjong-muted italic">⏳ 체결 로딩 중...</div>;
  if (error || !data) return <div className="p-4 text-center text-xs text-unjong-danger">❌ {error || "데이터 없음"}</div>;

  const formatTime = (hhmmss: string) => {
    if (!hhmmss || hhmmss.length < 6) return hhmmss;
    return `${hhmmss.slice(0, 2)}:${hhmmss.slice(2, 4)}:${hhmmss.slice(4, 6)}`;
  };

  return (
    <div className="p-3">
      <ul className="space-y-1 max-h-[400px] overflow-y-auto">
        {data.executions.slice(0, 30).map((tick, i) => {
          const isUp = tick.changeSign === "1" || tick.changeSign === "2";
          return (
            <li key={i} className="flex items-center justify-between text-xs px-2 py-1 hover:bg-unjong-background rounded">
              <span className="text-[10px] text-unjong-muted font-mono">{formatTime(tick.time)}</span>
              <span className={`font-semibold tabular-nums ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                {tick.price.toLocaleString()}
              </span>
              <span className="text-unjong-muted tabular-nums">{tick.volume.toLocaleString()}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] text-unjong-muted italic text-center mt-2">
        Layer 1 — KIS execution API · 5초 폴링 ✅
      </p>
    </div>
  );
}
```

### 5. OverviewTab 구체 구현

```typescript
type PriceData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  tradeAmount: number;
  high52w: number;
  low52w: number;
  per: number;
  pbr: number;
  marketCap: number;
  dividendYield: number | null;
};

function OverviewTab({ symbol }: { symbol: string }) {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !/^\d{6}$/.test(symbol)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/price?symbol=${symbol}`);
        const json = await r.json();
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000); // 30초 폴링 (재무는 자주 안 변함)
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  if (symbol && !/^\d{6}$/.test(symbol)) {
    return (
      <div className="p-4 text-center text-xs text-unjong-muted italic">
        미국 주식 종합 정보는 Yahoo Finance 모듈로 추후 추가
      </div>
    );
  }

  if (loading && !data) return <div className="p-4 text-center text-xs text-unjong-muted italic">⏳ 정보 로딩 중...</div>;
  if (error || !data) return <div className="p-4 text-center text-xs text-unjong-danger">❌ {error || "데이터 없음"}</div>;

  // 시총 단위 변환 (백만원 → 조)
  const marketCapStr = data.marketCap > 0 
    ? `${(data.marketCap / 100000000).toFixed(1)}조`
    : "—";

  return (
    <div className="p-3 space-y-3">
      <section>
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">가격</h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가" value={data.open ? data.open.toLocaleString() : "—"} />
          <Row label="고가" value={data.high ? data.high.toLocaleString() : "—"} />
          <Row label="저가" value={data.low ? data.low.toLocaleString() : "—"} />
          <Row label="거래량" value={data.volume ? data.volume.toLocaleString() : "—"} />
          <Row label="52주 최고" value={data.high52w ? data.high52w.toLocaleString() : "—"} />
          <Row label="52주 최저" value={data.low52w ? data.low52w.toLocaleString() : "—"} />
        </dl>
      </section>

      <section className="border-t border-unjong-border pt-3">
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">재무</h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가총액" value={marketCapStr} />
          <Row label="PER" value={data.per > 0 ? data.per.toFixed(1) : "—"} />
          <Row label="PBR" value={data.pbr > 0 ? data.pbr.toFixed(1) : "—"} />
          <Row label="배당수익률" value={data.dividendYield ? `${data.dividendYield.toFixed(2)}%` : "—"} />
        </dl>
      </section>

      <p className="text-[10px] text-unjong-muted italic text-center">
        Layer 1 — KIS price API · 30초 폴링 ✅
      </p>
    </div>
  );
}
```

### 6. 메인 컴포넌트 — 탭 컴포넌트에 symbol prop 전달

`StockDetailPanel` 의 양쪽 모드 (inline + 사이드패널) 모두 다음과 같이 변경:

기존:
```typescript
{activeTab === "chart" && <ChartTab />}
{activeTab === "orderbook" && <OrderBookTab />}
{activeTab === "tick" && <TickTab />}
{activeTab === "overview" && <OverviewTab />}
```

변경:
```typescript
{activeTab === "chart" && <ChartTab symbol={selectedSymbol.code} />}
{activeTab === "orderbook" && <OrderBookTab symbol={selectedSymbol.code} />}
{activeTab === "tick" && <TickTab symbol={selectedSymbol.code} />}
{activeTab === "overview" && <OverviewTab symbol={selectedSymbol.code} />}
```

### 7. 더미 상수 제거

파일 상단의 `DUMMY_ORDERBOOK`, `DUMMY_TICKS`, `DUMMY_OVERVIEW` 3개 상수 **전부 삭제**.

### 8. 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

특히 다음 잠재 이슈 체크:
- lightweight-charts SSR import 에러
- TypeScript any 타입 경고
- ResizeObserver 타입 에러

### 9. 커밋 + 푸시

```bash
git add components/sidepanel/StockDetailPanel.tsx
git commit -m "feat(detail-panel): 종목 상세 4개 탭 실데이터 (Layer 1-D)

- ChartTab: lightweight-charts dynamic import + /api/kis/chart 일/주/월봉
- OrderBookTab: /api/kis/orderbook + /api/kis/price 10초 폴링 (현재가 + 10단계 호가)
- TickTab: /api/kis/execution 5초 폴링 (최근 30건 체결)
- OverviewTab: /api/kis/price 30초 폴링 (시고저/거래량/52주/시총/PER/PBR/배당)
- 미국 주식 (AAPL 등) 은 KIS 미지원 → fallback 메시지
- DUMMY_ORDERBOOK / DUMMY_TICKS / DUMMY_OVERVIEW 상수 삭제
- 헤더 가격은 selectedSymbol.price (카드 클릭 시 전달됨) 그대로 사용

선행 작업: STEP 107 (chat 무한 로딩 해결) — Cowork이 Supabase MCP 로 직접 마이그레이션 적용 + plain @supabase/supabase-js 로 익명 클라이언트 교체"
git push
```

## 검증 (사용자 안내용)

푸시 후 사용자에게 안내:

1. `http://localhost:3333/scalper` 하드 리프레시 (Cmd+Shift+R)
2. 우측 관심종목에서 **삼성전자** (또는 다른 한국 종목) 클릭
3. 중앙 패널 4개 탭 각각 확인:
   - **📈 차트**: 실제 캔들 차트 (일봉) 그려져야 함, 일봉/주봉/월봉 버튼 동작
   - **📊 호가창**: 실제 가격대 10단계 (78,100 / 78,200 / ... 변동)
   - **⚡ 체결**: 실제 시간 (예: 10:23:45) + 가격 + 수량, 5초마다 갱신
   - **📋 종합**: 시가/고가/저가/거래량 + PER/PBR/시총 — 실제 KIS 가격
4. **Apple/Tesla/NVIDIA** 클릭 시 → "미국 주식은 별도 데이터 소스 필요" 메시지 (예상된 동작)

## 완료 후 보고

Claude Code 는 다음을 보고할 것:
- ✅/❌ 빌드 결과
- ✅/❌ 커밋 해시
- ✅/❌ 푸시 결과
- 4개 탭 별 console.error / 빌드 경고 여부

## 잠재 이슈 + 대응

| 이슈 | 대응 |
|------|------|
| lightweight-charts SSR `window is not defined` | `dynamic import` 패턴 적용했으므로 발생 안 함 |
| 차트 컨테이너 width 0 (초기 렌더 시) | useEffect 안에서 `clientWidth` 직접 측정 + ResizeObserver |
| KIS API rate limit (60ms) | 한 종목만 4개 API 동시 호출 → 240ms, 안전 |
| 미국 주식 클릭 시 KIS 호출하면 400 에러 | `/^\d{6}$/` regex 로 fetch 전 차단 |
| OverviewTab 거래대금 표시 누락 | tradeAmount 는 일단 미표시 (필요 시 추후 추가) |
