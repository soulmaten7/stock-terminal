<!-- 2026-06-18 -->
# STEP 280 — 1일·1주일 분봉 적용 (토스처럼 빽빽한 차트)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_280_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 279 결과 커밋(`cb8b564`). 빌드 ✓.
- **결과 커밋 예정**: STEP 280.

---

## 🎯 목표

1일·1주일이 일봉 3~5개라 듬성듬성했음. **Yahoo가 국내 종목도 분봉을 줘서**(실측: 삼성전자 5분봉 386개/5일), 분봉을 써서 빽빽하게.

- **1일** → 5분봉(하루 ~78개)
- **1주일** → 30분봉(5일 ~65개)
- **1개월·3개월·6개월·1년** → 일봉(기존 그대로)

ETN은 차트 없음(noChart) — 영향 없음.

---

## 📄 파일 1 — `app/api/yahoo/chart/route.ts` (interval 옵션 추가)

### (1-A) interval 파라미터 + 캐시 키
**찾기:**
```ts
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ candles: [] });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
    return NextResponse.json({ candles: hit.candles });
  }
```
**바꾸기:**
```ts
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ candles: [] });

  const intervalRaw = req.nextUrl.searchParams.get("interval") || "1d";
  const interval = (["5m", "30m", "1d"].includes(intervalRaw) ? intervalRaw : "1d") as "5m" | "30m" | "1d";
  const intraday = interval !== "1d";
  const key = `${symbol}|${interval}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
    return NextResponse.json({ candles: hit.candles });
  }
```

### (1-B) interval별 조회 기간(period1)
**찾기:**
```ts
  const tickers = isKr ? [`${symbol}.KS`, `${symbol}.KQ`] : [symbol];
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
```
**바꾸기:**
```ts
  const tickers = isKr ? [`${symbol}.KS`, `${symbol}.KQ`] : [symbol];
  const lookbackDays = interval === "1d" ? 400 : interval === "30m" ? 14 : 8;
  const period1 = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
```

### (1-C) yahoo chart에 interval 전달
**찾기:** `      const ch = await yf.chart(t, { period1, interval: "1d" });`
**바꾸기:** `      const ch = await yf.chart(t, { period1, interval });`

### (1-D) 분봉이면 time에 시:분까지 포함
**찾기:** `            time: d.toISOString().slice(0, 10),`
**바꾸기:** `            time: intraday ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10),`

### (1-E) 캐시 저장 키
**찾기:** `        cache.set(symbol, { at: Date.now(), candles });`
**바꾸기:** `        cache.set(key, { at: Date.now(), candles });`

---

## 📄 파일 2 — `components/home-v6/HomeStockDetail.tsx`

### (2-A) CandleChart — count·intraday prop으로 변경
**찾기:**
```tsx
function CandleChart({ candles, days }: { candles: Candle[]; days: number }) {
  const data = candles.slice(-days);
```
**바꾸기:**
```tsx
function CandleChart({ candles, count, intraday }: { candles: Candle[]; count: number; intraday: boolean }) {
  const data = candles.slice(-count);
```

### (2-B) CandleChart 라벨 — 분봉=일단위(M.D) / 일봉=월단위(YY.M)
**찾기:**
```tsx
  const labels: { x: number; text: string }[] = [];
  let prevMonth = "";
  data.forEach((c, i) => {
    const ym = c.time.slice(0, 7);
    if (ym !== prevMonth) {
      prevMonth = ym;
      const x = i * cw + cw / 2;
      if (labels.length === 0 || x - labels[labels.length - 1].x > 34) {
        labels.push({ x, text: `${c.time.slice(2, 4)}.${parseInt(c.time.slice(5, 7), 10)}` });
      }
    }
  });
```
**바꾸기:**
```tsx
  const labels: { x: number; text: string }[] = [];
  let prevKey = "";
  data.forEach((c, i) => {
    const k = intraday ? c.time.slice(0, 10) : c.time.slice(0, 7);
    if (k !== prevKey) {
      prevKey = k;
      const x = i * cw + cw / 2;
      if (labels.length === 0 || x - labels[labels.length - 1].x > 34) {
        const text = intraday
          ? `${parseInt(c.time.slice(5, 7), 10)}.${parseInt(c.time.slice(8, 10), 10)}`
          : `${c.time.slice(2, 4)}.${parseInt(c.time.slice(5, 7), 10)}`;
        labels.push({ x, text });
      }
    }
  });
```

### (2-C) range 설정 — interval·count 매핑으로 교체
**찾기:**
```tsx
  const range = useChartRange((s) => s.range);
  const RANGE_DAYS: Record<string, number> = { "1d": 3, "1w": 5, "1m": 22, "3m": 66, "6m": 132, "1y": 252 };
  const RANGE_LABEL: Record<string, string> = { "1d": "1일", "1w": "1주일", "1m": "1개월", "3m": "3개월", "6m": "6개월", "1y": "1년" };
  const chartDays = RANGE_DAYS[range] ?? 66;
```
**바꾸기:**
```tsx
  const range = useChartRange((s) => s.range);
  // 1일·1주일 = 분봉(빽빽), 1개월~ = 일봉. interval=yahoo 봉간격, count=표시 봉 개수
  const RANGE_CFG: Record<string, { interval: "5m" | "30m" | "1d"; count: number; label: string }> = {
    "1d": { interval: "5m", count: 78, label: "1일" },
    "1w": { interval: "30m", count: 65, label: "1주일" },
    "1m": { interval: "1d", count: 22, label: "1개월" },
    "3m": { interval: "1d", count: 66, label: "3개월" },
    "6m": { interval: "1d", count: 132, label: "6개월" },
    "1y": { interval: "1d", count: 252, label: "1년" },
  };
  const cfg = RANGE_CFG[range] ?? RANGE_CFG["3m"];
  const chartInterval = cfg.interval;
  const chartCount = cfg.count;
  const chartIntraday = chartInterval !== "1d";
```

### (2-D) 차트 fetch — interval 전달 + interval 바뀌면 재조회 (분봉은 KIS 폴백 제외)
**찾기:**
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
**바꾸기:**
```tsx
  // 차트: yahoo (1개월~=일봉 / 1일·1주일=분봉). 일봉만 KIS 폴백. interval 바뀌면 재조회. debounce.
  useEffect(() => {
    if (!stock || noChart) { setCandles([]); return; }
    const code = stock.symbol;
    const isKr = isKrxCode(code);
    let cancelled = false;
    const t = setTimeout(async () => {
      let cs: Candle[] = [];
      try {
        const j = await (await fetch(`/api/yahoo/chart?symbol=${encodeURIComponent(code)}&interval=${chartInterval}`)).json();
        cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
      } catch {
        cs = [];
      }
      if (cs.length < 2 && isKr && chartInterval === "1d") {
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
  }, [stock?.symbol, noChart, chartInterval]);
```

### (2-E) 렌더 — count·intraday 전달 + 라벨(분봉/일봉)
**찾기:**
```tsx
                <p className="px-2 pb-1 text-xs text-unjong-muted">일봉 · {RANGE_LABEL[range] ?? "3개월"}</p>
                <CandleChart candles={candles} days={chartDays} />
```
**바꾸기:**
```tsx
                <p className="px-2 pb-1 text-xs text-unjong-muted">{chartIntraday ? "분봉" : "일봉"} · {cfg.label}</p>
                <CandleChart candles={candles} count={chartCount} intraday={chartIntraday} />
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 종목 클릭 → **1일** 누르면 차트가 **5분봉으로 빽빽**하게(라벨 "분봉 · 1일"). **1주일**도 30분봉으로 빽빽.
2. **1개월~1년**은 기존처럼 일봉(라벨 "일봉 · OO").
3. 칩 사이 전환 잘 되고(분봉↔일봉 전환 시 잠깐 로딩), 미리보기 유지되는지.
4. 주식·ETF·리츠 다 되는지. (ETN은 차트 없음)

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat: 1일·1주일 분봉 적용 — yahoo interval(5m/30m), 빽빽한 미리보기 차트 (STEP 280)" && git push
```

---

> **한 줄 요약**: Yahoo가 국내 분봉을 줘서, yahoo/chart에 interval 추가 → 1일=5분봉·1주일=30분봉으로 빽빽하게, 1개월~는 일봉 유지.
