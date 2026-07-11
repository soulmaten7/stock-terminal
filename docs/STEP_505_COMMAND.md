<!-- 2026-07-02 -->
# STEP 505 — SEC EDGAR 정찰 (무료 深재무 데이터, F-Score 다년 검증용) · 구현 전

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_505_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
SEC EDGAR `companyfacts`(무료·공식·키 불필요·2009~)가 F-Score 9개 입력을 **연도별 10년+**로 주는지, us-gaap 태그가 무엇으로 잡히는지 **실측**. → 다년 백테스트(진짜 검증)의 기반.
- **구현 없음 · 커밋 없음.** 정찰 스크립트 실행 → 출력 공유. 그다음 STEP 506(어댑터)·507(백테스트).
- 종목: NVDA·JNJ·WMT·MU(다양 섹터·태그 편차 확인).
- ⚠️ SEC는 **User-Agent 필수**(없으면 403). 10 req/s 제한 → 종목 사이 딜레이.

## 1) 정찰 스크립트 — `scripts/probe_edgar.mjs`
```js
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// F-Score 필드 → us-gaap 태그 후보(회사·연도별 편차 대비 여러 개)
const CONCEPTS = {
  netIncome: ["NetIncomeLoss"],
  totalAssets: ["Assets"],
  operatingCashFlow: ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"],
  totalRevenue: ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"],
  costOfRevenue: ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold"],
  grossProfit: ["GrossProfit"],
  currentAssets: ["AssetsCurrent"],
  currentLiabilities: ["LiabilitiesCurrent"],
  longTermDebt: ["LongTermDebtNoncurrent", "LongTermDebt"],
  shares: ["CommonStockSharesOutstanding", "WeightedAverageNumberOfSharesOutstandingBasic"],
};

function annualByFY(facts, tags) {
  for (const tag of tags) {
    const node = (facts["us-gaap"] && facts["us-gaap"][tag]) || (facts["dei"] && facts["dei"][tag]);
    if (!node || !node.units) continue;
    const arr = node.units.USD || node.units.shares || Object.values(node.units)[0] || [];
    const byFy = {};
    for (const e of arr) {
      if (e.form && String(e.form).startsWith("10-K") && e.fp === "FY" && e.fy) {
        if (!byFy[e.fy] || String(e.filed) > String(byFy[e.fy].filed)) byFy[e.fy] = e;
      }
    }
    const keys = Object.keys(byFy);
    if (keys.length) return { tag, byVal: Object.fromEntries(keys.map((fy) => [fy, byFy[fy].val])) };
  }
  return null;
}

async function main() {
  // ticker → CIK
  const tj = await (await fetch("https://www.sec.gov/files/company_tickers.json", { headers: UA })).json();
  const cikBy = {};
  for (const k in tj) cikBy[String(tj[k].ticker).toUpperCase()] = String(tj[k].cik_str).padStart(10, "0");

  for (const s of ["NVDA", "JNJ", "WMT", "MU"]) {
    const cik = cikBy[s];
    if (!cik) { console.log(s, "→ CIK 없음"); continue; }
    try {
      const cf = await (await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: UA })).json();
      console.log("\n===== " + s + " (CIK " + cik + ")");
      const got = {};
      for (const field in CONCEPTS) {
        const r = annualByFY(cf.facts, CONCEPTS[field]);
        got[field] = r;
        console.log(` ${field}: ${r ? "tag=" + r.tag + " | years=" + Object.keys(r.byVal).map(Number).sort((a,b)=>a-b).join(",") : "MISSING"}`);
      }
      const years = [...new Set(Object.values(got).filter(Boolean).flatMap((r) => Object.keys(r.byVal)))].map(Number).filter((y) => y >= 2014).sort((a, b) => a - b);
      for (const y of years) {
        const v = (f) => (got[f] && got[f].byVal[y] != null ? got[f].byVal[y] : "·");
        console.log(`  FY${y}: ni=${v("netIncome")} assets=${v("totalAssets")} cfo=${v("operatingCashFlow")} rev=${v("totalRevenue")} gross=${v("grossProfit")} cor=${v("costOfRevenue")} curA=${v("currentAssets")} curL=${v("currentLiabilities")} ltd=${v("longTermDebt")} sh=${v("shares")}`);
      }
    } catch (e) {
      console.log(s, "ERROR", String(e));
    }
    await sleep(400); // rate limit 여유
  }
}
main();
```

## 2) 실행
```bash
cd ~/stock-terminal
node scripts/probe_edgar.mjs
```

## 3) 결과 공유 (Cowork에 붙여넣기/스샷)
- [ ] 각 필드가 어떤 **태그**로 잡히는지 + **몇 년치**(2014~ 몇 개년? 10년+ 나오는지).
- [ ] 연도별 값 표(FY201x~202x)에서 **MISSING(·)** 뜬 필드가 뭔지 — 특히 grossProfit/costOfRevenue(둘 중 하나로 매출총이익 계산 가능한지), currentAssets/currentLiabilities, shares.
- [ ] MU(반도체 사이클)·WMT(유통) 같이 섹터 다른 종목에서 태그 편차가 큰지.
- [ ] 403/429 등 접근 에러 없는지(User-Agent·rate).

> 결과 보면 STEP 506에서 EDGAR 어댑터(ticker→CIK, companyfacts→연도별 FRow[])를 실제 태그에 맞춰 작성 → STEP 507 다년 백테스트.

## ⚠️ 노트
- 값이 큰 숫자로 그대로 출력됨(정규화는 어댑터에서). 지금은 "필드·연도·태그가 잡히나"만 확인.
- 태그가 회사마다 다르면(예: 매출 태그 변경) 후보 리스트를 늘리면 됨 — 그래서 정찰이 먼저.
- 이 소스는 **미국 전용**. KR 검증은 이후 DART(무료·다년)로 동일 패턴.
