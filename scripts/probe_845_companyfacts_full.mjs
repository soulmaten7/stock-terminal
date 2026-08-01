/**
 * STEP 845b — `companyfacts` 전수 커버리지 실측 (우리 유니버스 604 발행사)
 *
 * 845(표본 60)의 미측정 2건을 없앤다:
 *  ① 표본 60(10%) → **604 전수**
 *  ② 내 companyfacts 판정이 frames보다 적게 잡던 원인 = **회계연도 정렬 누락**
 *     → SEC frames와 같이 비달력 결산을 달력연도에 배정(종료월 1~5월이면 전년)
 *     → form 필터도 10-K 계열 전체(10-K, 10-K/A, 10-KT)로 확대
 *
 * 🔴 재실행 안전(resumable) + 진행 가시화:
 *   - 100개 단위 배치마다 부분 결과를 즉시 저장 → 중간에 죽어도 이어서 실행
 *   - 진행 상황을 /tmp/845_progress.txt 에 매 종목 기록(stdout 버퍼링 회피)
 *   - 이전 실행이 604 전수를 한 번에 돌다 무음으로 죽어 20분을 낭비함 → 이 구조로 교체
 *
 * 출력: docs/probe_845_output.json
 * 실행: node scripts/probe_845_companyfacts_full.mjs [배치크기]
 */

import fs from "node:fs";
import path from "node:path";

const UA = process.env.SEC_USER_AGENT || "StockTerminal soulmaten7@gmail.com";
const BATCH = Number(process.argv[2] || 100);
const OUT = path.join(process.cwd(), "docs", "probe_845_output.json");
const PROG = "/tmp/845_progress.txt";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GROUPS = {
  rev: [
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "Revenues",
    "RevenueFromContractWithCustomerIncludingAssessedTax",
    "SalesRevenueNet",
  ],
  oi: ["OperatingIncomeLoss"],
  oiFallback: [
    "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
  ],
  ac: ["AssetsCurrent"],
  lc: ["LiabilitiesCurrent"],
  cash: [
    "CashAndCashEquivalentsAtCarryingValue",
    "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
    "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsIncludingDisposalGroupAndDiscontinuedOperations",
  ],
  ppe: [
    "PropertyPlantAndEquipmentNet",
    "PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization",
    "PropertyPlantAndEquipmentOtherNet",
    "PublicUtilitiesPropertyPlantAndEquipmentNet",
  ],
};

const YS = [2020, 2021, 2022, 2023, 2024];

/** 🔑 SEC frames와 동일한 달력연도 배정: 종료월 1~5월이면 전년도 프레임 */
const calendarYear = (end) => {
  const y = Number(String(end).slice(0, 4));
  const m = Number(String(end).slice(5, 7));
  return m <= 5 ? y - 1 : y;
};
const isAnnual = (f) => /^10-K/.test(String(f));

const surv = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "docs", "probe_survivors.json"), "utf8")
);
const names = JSON.parse(fs.readFileSync("/tmp/ct.json", "utf8"));
const nameByCik = {};
for (const v of Object.values(names)) nameByCik[String(v.cik_str)] = v.title;
const PARTNERSHIP = /\b(LP|L\.P\.|PARTNERS|PARTNERSHIP)\b/i;

const ciks = [
  ...new Set(
    surv.filter((s) => !PARTNERSHIP.test(nameByCik[String(s.cik)] || "")).map((s) => s.cik)
  ),
].sort((a, b) => a - b);

// 이어서 실행
let store = { perIssuer: {} };
if (fs.existsSync(OUT)) {
  try {
    store = JSON.parse(fs.readFileSync(OUT, "utf8"));
    store.perIssuer = store.perIssuer || {};
  } catch {}
}
const todo = ciks.filter((c) => !store.perIssuer[c]);
fs.writeFileSync(PROG, `시작 ${new Date().toISOString()} · 남은 ${todo.length}/${ciks.length}\n`);

const save = () => {
  const ok = Object.entries(store.perIssuer).filter(([, v]) => !v._err);
  const cnt = (k) => ok.filter(([, v]) => v[k]).length;
  store.measuredAt = new Date().toISOString();
  store.issuers = ciks.length;
  store.fetched = ok.length;
  store.errors = Object.values(store.perIssuer).filter((v) => v._err).length;
  store.byField = Object.fromEntries(Object.keys(GROUPS).map((k) => [k, cnt(k)]));
  store.all6strict = ok.filter(
    ([, v]) => v.rev && v.oi && v.ac && v.lc && v.cash && v.ppe
  ).length;
  store.all6withOiFallback = ok.filter(
    ([, v]) => v.rev && (v.oi || v.oiFallback) && v.ac && v.lc && v.cash && v.ppe
  ).length;
  store.note = "10-K 계열 + 회계연도→달력연도 배정(종료월 1~5월은 전년)";
  fs.writeFileSync(OUT, JSON.stringify(store));
};

let n = 0;
for (const cik of todo.slice(0, BATCH)) {
  const p = String(cik).padStart(10, "0");
  try {
    // 🔴 타임아웃은 fetch뿐 아니라 **본문 파싱까지** 감싸야 한다.
    //    AbortSignal은 헤더 수신 후의 json() 파싱을 막지 못해 배치가 통째로 멈췄다(실측).
    const wall = (pms, ms) =>
      Promise.race([pms, new Promise((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);
    const r = await wall(
      fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${p}.json`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(25000),
      }),
      30000
    );
    await sleep(120);
    if (!r.ok) {
      store.perIssuer[cik] = { _err: r.status };
    } else {
      const j = await wall(r.json(), 30000);
      const g = j.facts?.["us-gaap"] || {};
      const o = {};
      for (const [k, tags] of Object.entries(GROUPS)) {
        const yrs = new Set();
        for (const t of tags)
          for (const d of g[t]?.units?.USD || [])
            if (isAnnual(d.form)) yrs.add(calendarYear(d.end));
        o[k] = YS.every((y) => yrs.has(y));
      }
      store.perIssuer[cik] = o;
    }
  } catch {
    store.perIssuer[cik] = { _err: "EX" };
  }
  n++;
  fs.appendFileSync(PROG, `${n}/${Math.min(BATCH, todo.length)} cik=${cik}\n`);
  if (n % 20 === 0) save();
}
save();
fs.appendFileSync(PROG, `배치완료 ${n}건 · 누적 ${Object.keys(store.perIssuer).length}/${ciks.length}\n`);
console.log("batch done", n, "total", Object.keys(store.perIssuer).length, "/", ciks.length);
