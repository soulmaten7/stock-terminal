<!-- 2026-06-15 -->
# STEP 251 — 미리보기 차트 폴백 (미국·ETF/리츠도 차트 뜨게, yahoo)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_251_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (버그 수정)
미리보기(`HomeStockDetail`) 차트가 **미국 종목·일부 ETF/리츠에서 안 뜸**.
- 원인①: 차트 로직이 `/^\d{6}$/`(6자리)만 허용 → **미국(AAPL 등)은 아예 fetch 안 함**.
- 원인②: 소스가 **KIS(국내 전용)** → KIS 미커버 종목은 빈 차트.
- 해결: **`/api/yahoo/chart` 신규**(yahoo 일봉, 국내 `.KS/.KQ`·미국 바로) + `HomeStockDetail`이 **국내=KIS 먼저→비면 yahoo, 미국=yahoo** 폴백. → 주식·ETF·리츠·미국 전부 차트.

## 전제 상태
- 현재 HEAD: STEP 250 적용 후
- 변경 **2파일**:
  - `app/api/yahoo/chart/route.ts` (**신규**)
  - `components/home-v6/HomeStockDetail.tsx` (차트 useEffect 교체)
- 검증: yahoo는 005930.KS·247540.KQ·AAPL 등 일봉 정상(앞 STEP들에서 확인).

---

## 작업 1/2 — `app/api/yahoo/chart/route.ts` (신규)

```ts
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };
const cache = new Map<string, { at: number; candles: Candle[] }>();

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ candles: [] });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
    return NextResponse.json({ candles: hit.candles });
  }

  // 국내 6자리는 .KS→.KQ 순으로 시도, 그 외(미국 등)는 티커 그대로
  const isKr = /^\d{6}$/.test(symbol);
  const tickers = isKr ? [`${symbol}.KS`, `${symbol}.KQ`] : [symbol];
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  for (const t of tickers) {
    try {
      const ch = await yf.chart(t, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{
        date?: Date | string;
        open: number | null;
        high: number | null;
        low: number | null;
        close: number | null;
        volume: number | null;
      }>;
      const candles: Candle[] = quotes
        .filter((q) => q && q.close != null && q.open != null)
        .map((q) => {
          const d = q.date instanceof Date ? q.date : new Date(String(q.date));
          return {
            time: d.toISOString().slice(0, 10),
            open: Number(q.open),
            high: Number(q.high ?? q.close),
            low: Number(q.low ?? q.close),
            close: Number(q.close),
            volume: Number(q.volume ?? 0),
          };
        });
      if (candles.length >= 2) {
        cache.set(symbol, { at: Date.now(), candles });
        return NextResponse.json({ candles });
      }
    } catch {
      /* 다음 티커 시도 */
    }
  }
  return NextResponse.json({ candles: [] });
}
```

> `yf.chart` 일봉 → `{time,open,high,low,close,volume}` 캔들로 변환. 국내는 `.KS` 실패 시 `.KQ` 재시도(self-clean). 10분 메모리 캐시(hover 반복 호출 절감).

---

## 작업 2/2 — `components/home-v6/HomeStockDetail.tsx` (차트 useEffect 교체)

**찾기:**
```tsx
  // 차트 (국내 6자리, debounce)
  useEffect(() => {
    if (!stock || !/^\d{6}$/.test(stock.symbol)) {
      setCandles([]);
      return;
    }
    const code = stock.symbol;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const j = await (await fetch(`/api/kis/chart?symbol=${code}&period=D`)).json();
        const cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
        if (!cancelled) setCandles(cs);
      } catch {
        if (!cancelled) setCandles([]);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol]);
```
**바꾸기:**
```tsx
  // 차트: 국내(6자리)=KIS 먼저→비면 yahoo 폴백 / 미국 등=yahoo. debounce.
  useEffect(() => {
    if (!stock) { setCandles([]); return; }
    const code = stock.symbol;
    const isKr = /^\d{6}$/.test(code);
    let cancelled = false;
    const t = setTimeout(async () => {
      let cs: Candle[] = [];
      if (isKr) {
        try {
          const j = await (await fetch(`/api/kis/chart?symbol=${code}&period=D`)).json();
          cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
        } catch {
          cs = [];
        }
      }
      if (cs.length < 2) {
        try {
          const j = await (await fetch(`/api/yahoo/chart?symbol=${encodeURIComponent(code)}`)).json();
          cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
        } catch {
          /* cs 유지 */
        }
      }
      if (!cancelled) setCandles(cs);
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol]);
```

> 미국(6자리 아님)은 KIS 건너뛰고 바로 yahoo. 국내는 KIS 우선, 비면(또는 ETF/리츠 미커버) yahoo. `Candle` 타입·`CandleChart`는 그대로(필드 동일).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/chart/route.ts components/home-v6/HomeStockDetail.tsx && git commit -m "fix(v7): 미리보기 차트 yahoo 폴백 — 미국·ETF/리츠도 차트 표시 (STEP 251)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 주식 탭 **미국**(AAPL 등) hover → 미리보기 **차트 뜸**(전엔 "데이터 없음")
- [ ] ETF·리츠 hover → 차트 뜸 (KIS 미커버여도 yahoo로)
- [ ] 국내 주식은 기존대로 정상(KIS 먼저)
- ⚠️ 하드 새로고침. 첫 hover 시 yahoo 조회로 잠깐 늦을 수 있음(10분 캐시).

## 주의·예상 이슈
- yahoo 일봉은 장 마감 기준(실시간 아님) — 미리보기 썸네일용이라 충분.
- 국내 KIS가 정상인 종목은 yahoo 호출 안 함(폴백은 비었을 때만).
- **문서 TODO**(다음 갱신): STEP 248~251.

---
> STEP 251 = 미리보기 차트 yahoo 폴백(미국·ETF/리츠). 전제 STEP 250.
