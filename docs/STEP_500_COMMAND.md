<!-- 2026-07-02 -->
# STEP 500 — F-Score 데이터 정찰 (야후 재무 필드 실측, US) · 구현 전 단계

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_500_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
피오트로스키 F-Score(9개 기준)를 **정확히 구현하기 전에**, 야후가 US 종목에 필요한 재무 필드를 실제로 주는지 **눈으로 확인**한다. 추측 매핑 금지 — 데이터부터 본다.
- **구현 없음.** 정찰 스크립트 실행 → 필드·값 출력 → 그 결과를 Cowork에 공유(스샷/붙여넣기).
- 종목: **NVDA**(성장주), **JNJ**(안정주), **JPM**(은행 — 엣지케이스 확인용).

## 1) 정찰 스크립트 생성 — `scripts/probe_fscore.mjs`
```js
import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const syms = ["NVDA", "JNJ", "JPM"];
const val = (o, k) =>
  o && o[k] != null ? (typeof o[k] === "object" && o[k].raw != null ? o[k].raw : o[k]) : "MISSING";

for (const s of syms) {
  try {
    const r = await yf.quoteSummary(s, {
      modules: ["assetProfile", "incomeStatementHistory", "balanceSheetHistory", "cashflowStatementHistory", "defaultKeyStatistics"],
    });
    const inc = r.incomeStatementHistory?.incomeStatementHistory ?? [];
    const bal = r.balanceSheetHistory?.balanceSheetStatements ?? [];
    const cf = r.cashflowStatementHistory?.cashflowStatements ?? [];
    console.log("\n===== " + s + " | sector: " + (r.assetProfile?.sector) + " | industry: " + (r.assetProfile?.industry));
    console.log("years — income:", inc.length, "balance:", bal.length, "cashflow:", cf.length);
    console.log("income keys :", Object.keys(inc[0] || {}).join(","));
    console.log("balance keys :", Object.keys(bal[0] || {}).join(","));
    console.log("cashflow keys:", Object.keys(cf[0] || {}).join(","));
    for (let y = 0; y < 2; y++) {
      console.log(
        ` [Y${y}] rev=${val(inc[y], "totalRevenue")} gross=${val(inc[y], "grossProfit")} cor=${val(inc[y], "costOfRevenue")} ni=${val(inc[y], "netIncome")}` +
        ` | assets=${val(bal[y], "totalAssets")} curA=${val(bal[y], "totalCurrentAssets")} curL=${val(bal[y], "totalCurrentLiabilities")} ltd=${val(bal[y], "longTermDebt")}` +
        ` | cfo=${val(cf[y], "totalCashFromOperatingActivities")}`
      );
    }
    console.log("sharesOutstanding(now):", r.defaultKeyStatistics?.sharesOutstanding, "| endDates:", inc.map((x) => x.endDate?.fmt || x.endDate).join(" "));
  } catch (e) {
    console.log(s, "ERROR", String(e));
  }
}
```

## 2) 실행
```bash
cd ~/stock-terminal
node scripts/probe_fscore.mjs        # 모듈 에러 시: npx tsx scripts/probe_fscore.mjs
```

## 3) 결과 확인 + 공유
출력에서 아래를 **Cowork에 그대로 붙여넣기/스샷**:
- [ ] 각 종목의 income/balance/cashflow **연도 수**(2년 이상 있는지 — Δ 계산 필요).
- [ ] 9개 기준에 필요한 필드 값: rev·gross·cor·ni / assets·curA·curL·ltd / cfo — **MISSING 뜬 게 뭔지.**
- [ ] `grossProfit`이 없으면 `totalRevenue - costOfRevenue`로 대체 가능한지.
- [ ] 주식수(신주발행 기준 7번)를 연도별로 구할 수 있는지 — 안 되면 대안 필요.
- [ ] JPM(은행)에서 필드가 어떻게 다른지(엣지케이스 판단용).

> **이 STEP은 커밋 없음**(정찰 스크립트만). 결과 보고 → Cowork이 STEP 501(F-Score 계산 엔진)을 실제 필드에 맞춰 정확히 작성.

## ⚠️ 노트
- 야후 quoteSummary 재무 모듈은 버전에 따라 필드가 다르거나 일부 deprecated일 수 있음 → 그래서 실측이 먼저.
- 필드가 많이 비면 대안: `fundamentalsTimeSeries` 모듈 또는 (정확도 위해) 나중에 US=재무 전용 소스 검토. 우선 quoteSummary로 어디까지 되는지 확인.
