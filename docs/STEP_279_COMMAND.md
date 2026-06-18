<!-- 2026-06-18 -->
# STEP 279 — 기간칩(1일~1년) 누르면 미리보기 차트 기간이 바뀌게

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_279_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 278 결과 커밋. 빌드 ✓.
- **결과 커밋 예정**: STEP 279.

---

## 🎯 목표

상단 **기간칩(1일/1주일/1개월/3개월/6개월/1년)**을 누르면, 미리보기 차트가 그 기간만큼 보이게. (표 정렬은 기존대로 유지 — 칩이 둘 다 제어)

설계:
- 칩은 탭마다(주식=MarketClient, ETF·리츠=HomePerfRanking) 따로 있으니, 선택값을 **작은 공용 store**(`chartRangeStore`)에 흘려보냄.
- 미리보기(`HomeStockDetail`)는 store를 읽어 **차트를 그 기간만큼 잘라** 보여줌.
- 차트 데이터는 **Yahoo 우선(약 270거래일)** 으로 받아 1년까지 커버(KIS는 100일이라 부족 → 국내도 Yahoo `.KS`로). 비면 KIS 폴백.
- 기간 바꿔도 **미리보기 유지**(지금은 기간 바꾸면 미리보기가 사라짐 → 그 동작 제거).

> 1일은 장중 분봉이 없어 **최근 3거래일 일봉**으로 대체(진짜 1일 분봉은 추후 실시간과). 1주일~1년이 핵심.

---

## 📄 파일 1 (신규) — `stores/chartRangeStore.ts`

아래 내용으로 새 파일 생성:
```ts
import { create } from "zustand";

export type ChartRange = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

interface ChartRangeState {
  range: ChartRange;
  setRange: (r: ChartRange) => void;
}

export const useChartRange = create<ChartRangeState>((set) => ({
  range: "1d",
  setRange: (range) => set({ range }),
}));
```

---

## 📄 파일 2 — `components/home-v6/HomePerfRanking.tsx`

### (2-A) import 추가
**찾기:**
```tsx
import { type HoverStock } from "@/components/market/MarketClient";
```
**바꾸기:**
```tsx
import { type HoverStock } from "@/components/market/MarketClient";
import { useChartRange } from "@/stores/chartRangeStore";
```

### (2-B) "기간 바꾸면 미리보기 초기화" → "기간을 차트 store에 sync"로 교체
**찾기:**
```tsx
  useEffect(() => { setHovered(null); }, [period]);
```
**바꾸기:**
```tsx
  useEffect(() => { useChartRange.getState().setRange(period); }, [period]);
```

---

## 📄 파일 3 — `components/market/MarketClient.tsx`

### (3-A) import 추가
**찾기:**
```tsx
import { useWatchlist } from "@/stores/watchlistStore";
```
**바꾸기:**
```tsx
import { useWatchlist } from "@/stores/watchlistStore";
import { useChartRange } from "@/stores/chartRangeStore";
```

### (3-B) period를 차트 store에 sync (상태 선언 직후 삽입)
**찾기:**
```tsx
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
```
**바꾸기:**
```tsx
  const [loading, setLoading] = useState(true);

  useEffect(() => { useChartRange.getState().setRange(period); }, [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
```

---

## 📄 파일 4 — `components/home-v6/HomeStockDetail.tsx`

### (4-A) import 추가
**찾기:**
```tsx
import { useAuthStore } from "@/stores/authStore";
```
**바꾸기:**
```tsx
import { useAuthStore } from "@/stores/authStore";
import { useChartRange } from "@/stores/chartRangeStore";
```

### (4-B) CandleChart — 보여줄 일수(days)를 prop으로 받아 슬라이스
**찾기:**
```tsx
function CandleChart({ candles }: { candles: Candle[] }) {
  if (candles.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const data = candles.slice(-60);
```
**바꾸기:**
```tsx
function CandleChart({ candles, days }: { candles: Candle[]; days: number }) {
  const data = candles.slice(-days);
  if (data.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
```

### (4-C) 컴포넌트에서 store 읽어 일수·라벨 계산 (상태 선언 직후 삽입)
**찾기:**
```tsx
  const [submitting, setSubmitting] = useState(false);
```
**바꾸기:**
```tsx
  const [submitting, setSubmitting] = useState(false);
  const range = useChartRange((s) => s.range);
  const RANGE_DAYS: Record<string, number> = { "1d": 3, "1w": 5, "1m": 22, "3m": 66, "6m": 132, "1y": 252 };
  const RANGE_LABEL: Record<string, string> = { "1d": "1일", "1w": "1주일", "1m": "1개월", "3m": "3개월", "6m": "6개월", "1y": "1년" };
  const chartDays = RANGE_DAYS[range] ?? 66;
```

### (4-D) 차트 fetch — Yahoo 우선(270거래일) → KIS 폴백
**찾기:**
```tsx
  // 차트: 국내(6자리)=KIS 먼저→비면 yahoo 폴백 / 미국 등=yahoo. debounce.
  useEffect(() => {
    if (!stock || noChart) { setCandles([]); return; }
    const code = stock.symbol;
    const isKr = isKrxCode(code);
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
  }, [stock?.symbol, noChart]);
```
**바꾸기:**
```tsx
  // 차트: yahoo 우선(약 270거래일 — 기간선택용 충분) → 비면 KIS(국내) 폴백. debounce.
  useEffect(() => {
    if (!stock || noChart) { setCandles([]); return; }
    const code = stock.symbol;
    const isKr = isKrxCode(code);
    let cancelled = false;
    const t = setTimeout(async () => {
      let cs: Candle[] = [];
      try {
        const j = await (await fetch(`/api/yahoo/chart?symbol=${encodeURIComponent(code)}`)).json();
        cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
      } catch {
        cs = [];
      }
      if (cs.length < 2 && isKr) {
        try {
          const j = await (await fetch(`/api/kis/chart?symbol=${code}&period=D`)).json();
          cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
        } catch {
          /* cs 유지 */
        }
      }
      if (!cancelled) setCandles(cs);
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol, noChart]);
```

### (4-E) 차트 렌더 — days 전달 + 라벨에 기간 표시
**찾기:**
```tsx
              <div className="border-b border-unjong-border px-2 py-3">
                <p className="px-2 pb-1 text-xs text-unjong-muted">일봉</p>
                <CandleChart candles={candles} />
              </div>
```
**바꾸기:**
```tsx
              <div className="border-b border-unjong-border px-2 py-3">
                <p className="px-2 pb-1 text-xs text-unjong-muted">일봉 · {RANGE_LABEL[range] ?? "3개월"}</p>
                <CandleChart candles={candles} days={chartDays} />
              </div>
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 종목 클릭 → 미리보기 차트 표시.
2. 상단 **1주일/1개월/3개월/6개월/1년** 칩을 누르면 → 차트가 그 기간으로 바뀌고, 차트 위 라벨도 "일봉 · OO"로 바뀌는지. **미리보기가 사라지지 않고 유지**되는지.
3. 1일 → 짧게(최근 3일) 나옴(분봉 없어 일봉 대체 — 정상).
4. 주식·ETF·리츠 탭 모두 동작하는지(ETN은 차트 없음).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat: 기간칩(1일~1년)으로 미리보기 차트 기간 변경 (chartRangeStore 연동, yahoo 270거래일) (STEP 279)" && git push
```

---

> **한 줄 요약**: 기간칩 선택을 공용 store로 미리보기 차트에 연결, 차트는 yahoo로 1년치 받아 칩만큼 슬라이스. 기간 바꿔도 미리보기 유지.
