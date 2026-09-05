<!-- 2026-07-02 -->
# STEP 501 — fundamentalsTimeSeries 정찰 (F-Score 필드 확정) · 구현 전 단계

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_501_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 500 결과: 야후 구 재무모듈은 2024-11 이후 사망 → **`fundamentalsTimeSeries`**로 전환. 이 API가 F-Score 9개 기준 입력을 **연도별 2년+로 실제 주는지** 확인. 특히 **연도별 주식수(7번)**가 되는지가 관건.
- **구현 없음 · 커밋 없음.** 정찰 스크립트 실행 → 필드·값 출력 → Cowork에 공유. 그다음 STEP 502에서 엔진 작성.
- 종목: NVDA·JNJ·JPM.

## 1) 정찰 스크립트 — `scripts/probe_fts.mjs`
```js
import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const syms = ["NVDA", "JNJ", "JPM"];
const p1 = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
const p2 = new Date();

// F-Score 9개 기준에 필요한 후보 필드(정규화 키 — 실제 이름은 keys 덤프로 확인)
const CAND = [
  "totalRevenue", "costOfRevenue", "grossProfit", "netIncome",
  "totalAssets", "currentAssets", "currentLiabilities", "longTermDebt", "totalDebt",
  "operatingCashFlow", "cashFlowFromContinuingOperatingActivities",
  "shareIssued", "ordinarySharesNumber", "basicAverageShares",
];

for (const s of syms) {
  try {
    const r = await yf.fundamentalsTimeSeries(s, { period1: p1, period2: p2, type: "annual", module: "all" });
    const rows = Array.isArray(r) ? r : [];
    console.log("\n===== " + s + " | rows:", rows.length);
    if (rows.length) {
      console.log("dates:", rows.map((x) => (x.date instanceof Date ? x.date.toISOString().slice(0, 10) : x.date)).join(" "));
      // 최신 행의 전체 키(실제 필드명 확인용)
      console.log("ALL KEYS:", Object.keys(rows[rows.length - 1]).join(","));
      // 최근 2년 F-Score 후보 필드 값
      for (const row of rows.slice(-2)) {
        const d = row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date;
        console.log(" [" + d + "] " + CAND.map((k) => k + "=" + (row[k] != null ? row[k] : "·")).join(" "));
      }
    }
  } catch (e) {
    console.log(s, "ERROR", String(e));
  }
}
```

## 2) 실행
```bash
cd ~/stock-terminal
node scripts/probe_fts.mjs        # 모듈 에러 시: npx tsx scripts/probe_fts.mjs
```

## 3) 결과 공유 (Cowork에 붙여넣기/스샷)
- [ ] 각 종목 **rows 수**(2년+ 있는지) + dates.
- [ ] **ALL KEYS** — 실제 필드명 전체(이게 제일 중요, 후보 이름과 다를 수 있음).
- [ ] 9개 기준 필드 매핑 확인:
  - 수익성: netIncome, operatingCashFlow(또는 cashFlowFromContinuingOperatingActivities), totalAssets(ROA용)
  - 레버리지/유동: longTermDebt(또는 totalDebt), currentAssets, currentLiabilities, **주식수(shareIssued/ordinarySharesNumber/basicAverageShares 중 뭐가 오는지)**
  - 효율: totalRevenue, grossProfit(없으면 totalRevenue−costOfRevenue)
- [ ] JPM(은행): longTermDebt·currentAssets 등이 은행 특성상 비는지(엣지 판단).

> **정찰만.** 결과 보면 Cowork이 STEP 502에서 F-Score 엔진을 실제 필드명에 맞춰 정확히 작성.

## ⚠️ 노트 / 폴백
- `fundamentalsTimeSeries` 호출 시그니처가 라이브러리 버전따라 다를 수 있음(`module: "all"` 대신 `"financials"|"balance-sheet"|"cash-flow"` 분리 필요할 수도) — 에러 나면 그 에러 그대로 보고.
- 여기서도 주식수/일부 필드가 안 나오면 폴백: US 재무 전용 무료 소스(FMP 무료 250req/일·5종목 등) 검토. 우선 fundamentalsTimeSeries 확인.
