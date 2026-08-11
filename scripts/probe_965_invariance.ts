// STEP 965 §3 — 값 불변 확인. 계산 로직(annualMap 선택 규칙)을 바꾸지 않았다는 주장을 실측으로 증명한다.
// 🔴 DB에 쓰지 않는다. 메모리 비교만. SEC 신규 호출 없음(docs/probe_951_cache 재사용).
// 방법: HEAD(965 이전, a532b31)의 drivers.ts를 그대로 불러와 "구코드"로, 지금 작업본을 "신코드"로 삼아
//   같은 캐시 파일 1,127개에 대해 computeDrivers()를 각각 돌리고 DriverBundle·market·fundamentals를 대조한다.
//   (구코드 파일은 이 스크립트 실행 직전에 `git show HEAD:lib/revdcf/drivers.ts > /tmp/step965_old/drivers_old.ts`로 추출)
// 추가로 신코드 결과를 us_fundamentals DB 저장값과도 대조한다(캐시-DB 정합성 재확인).
// 🔴 STEP 990: 아래 /tmp import가 Vercel 빌드 환경엔 없어 977~989 전체 배포가 깨졌었다(빌드시점 타입체크 실패).
//   tsconfig.json exclude에 이 파일을 추가해 빌드 대상에서 뺐다 — 실행하려면 §3-1 재현 절차(같은 git show 추출)부터 다시 할 것.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeDrivers as computeDriversNew, coalesceMap, NET_INCOME, EQUITY, PREFERRED, NCI } from "../lib/revdcf/drivers";
// 구코드는 /tmp/step965_old/drivers_old.ts에서 동적 import(같은 파일 시스템, tsx가 처리)
import { computeDrivers as computeDriversOld } from "/tmp/step965_old/drivers_old";

const CACHE_DIR = "docs/probe_951_cache";

type FundRow = {
  symbol: string; fiscal_year: number | null;
  net_income: number | null; equity: number | null; common_equity: number | null;
  preferred_stock: number | null; minority_interest: number | null;
  revenue: number | null; operating_income: number | null; dna: number | null;
};

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  const sb = createAdminClient();
  const fundRows = await fetchAllRows<FundRow>(
    () => sb.from("us_fundamentals").select("symbol, fiscal_year, net_income, equity, common_equity, preferred_stock, minority_interest, revenue, operating_income, dna"),
    [{ column: "symbol" }]
  );
  console.log(`us_fundamentals ${fundRows.length}행`);

  const maxYear = new Date().getFullYear();
  let checked = 0, noCache = 0;
  const oldVsNewMismatches: { symbol: string; field: string; old: unknown; new: unknown }[] = [];
  const newVsDbMismatches: { symbol: string; field: string; db: unknown; recomputed: unknown }[] = [];
  let okOldCount = 0, okNewCount = 0, skipMismatch = 0;

  for (const row of fundRows) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};
    const dei = facts?.facts?.["dei"] ?? {};
    checked++;

    // ── 구코드 vs 신코드 — DriverBundle·market·ok·skipReason·fundamentals(값 필드) 전수 대조 ──
    const rOld = computeDriversOld(gaap, dei); // maxYear는 함수 내부에서 유도(오늘 날짜, 같은 세션 내 실행이라 old/new 동일)
    const rNew = computeDriversNew(gaap, dei);
    if (rOld.ok) okOldCount++;
    if (rNew.ok) okNewCount++;
    if (rOld.ok !== rNew.ok) { skipMismatch++; oldVsNewMismatches.push({ symbol: row.symbol, field: "ok", old: rOld.ok, new: rNew.ok }); }
    if (!rOld.ok && !rNew.ok && rOld.skipReason !== rNew.skipReason) {
      oldVsNewMismatches.push({ symbol: row.symbol, field: "skipReason", old: rOld.skipReason, new: rNew.skipReason });
    }
    if (rOld.ok && rNew.ok) {
      if (!deepEqual(rOld.drivers, rNew.drivers)) oldVsNewMismatches.push({ symbol: row.symbol, field: "drivers", old: rOld.drivers, new: rNew.drivers });
      if (!deepEqual(rOld.market, rNew.market)) oldVsNewMismatches.push({ symbol: row.symbol, field: "market", old: rOld.market, new: rNew.market });
    }
    const fFields: (keyof typeof rOld.fundamentals)[] = ["netIncome", "equity", "commonEquity", "preferredStock", "minorityInterest", "revenue", "operatingIncome", "dna", "fiscalYear"];
    for (const f of fFields) {
      if (!deepEqual(rOld.fundamentals[f], rNew.fundamentals[f])) {
        oldVsNewMismatches.push({ symbol: row.symbol, field: `fundamentals.${f}`, old: rOld.fundamentals[f], new: rNew.fundamentals[f] });
      }
    }

    // ── 신코드 vs DB 저장값 — 🔴 pinned-year 방식(STEP963과 동일 방법론). computeDrivers()를 그대로 불러
    //    DB와 대조하면 resolveYearWindow가 "오늘 기준 최신연도"로 재해석해 옛 창과 섞인다(963 §3 1차시도결함과
    //    동일 함정 — 최초 시도에서 실제로 재현됨, 아래 참조). row.fiscal_year에 고정 추출해 963의 백필 방법론
    //    그대로 재현되는지만 확인한다(net_income·common_equity·preferred_stock·minority_interest — 963이 실제로
    //    쓴 필드). revenue·operating_income·dna·fiscal_year는 963이 손대지 않은 필드라 이 STEP의 pinned 방법론이
    //    적용된 적이 없다 — 대조 대상에서 제외(VALUATION_SPEC 미해결0번, STEP965와 무관한 기존 이슈).
    if (row.fiscal_year != null) {
      const ly = row.fiscal_year;
      const niCo = coalesceMap(gaap, NET_INCOME, "flow");
      const eqCo = coalesceMap(gaap, EQUITY, "stock");
      const prefCo = coalesceMap(gaap, PREFERRED, "stock");
      const nciCo = coalesceMap(gaap, NCI, "stock");
      const newNetIncome = niCo.vals[ly] ?? null;
      const eqVal = eqCo.vals[ly] ?? null;
      const eqTag = eqCo.tagAt[ly] ?? null;
      const prefVal = prefCo.vals[ly] ?? null;
      const nciVal = nciCo.vals[ly] ?? null;
      let commonEquity: number | null = null;
      if (eqVal != null) {
        commonEquity = eqTag === "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"
          ? (nciVal != null ? eqVal - nciVal : eqVal) : eqVal;
        commonEquity = commonEquity - (prefVal ?? 0);
      }
      const pinned: [keyof FundRow, number | null][] = [
        ["net_income", newNetIncome], ["common_equity", commonEquity],
        ["preferred_stock", prefVal], ["minority_interest", nciVal],
      ];
      for (const [dbKey, recomputed] of pinned) {
        if (!deepEqual(row[dbKey], recomputed)) {
          newVsDbMismatches.push({ symbol: row.symbol, field: dbKey, db: row[dbKey], recomputed });
        }
      }
    }
  }

  console.log(`\n검사 ${checked}건(캐시없음 ${noCache}), maxYear=${maxYear}`);
  console.log(`ok건수 — 구코드 ${okOldCount} / 신코드 ${okNewCount} (ok/skip 불일치 ${skipMismatch}건)`);
  console.log(`\n=== 구코드 vs 신코드 불일치(DriverBundle·market·ok·skipReason·fundamentals값) ===`);
  console.log(`총 ${oldVsNewMismatches.length}건`);
  if (oldVsNewMismatches.length) console.log(JSON.stringify(oldVsNewMismatches.slice(0, 20), null, 1));

  console.log(`\n=== 신코드 vs DB 저장값 불일치(us_fundamentals) ===`);
  console.log(`총 ${newVsDbMismatches.length}건`);
  if (newVsDbMismatches.length) console.log(JSON.stringify(newVsDbMismatches.slice(0, 20), null, 1));

  fs.writeFileSync(
    "docs/probe_965_invariance.json",
    JSON.stringify({ checked, noCache, okOldCount, okNewCount, skipMismatch, oldVsNewMismatches, newVsDbMismatches }, null, 1)
  );
  console.log("\n저장: docs/probe_965_invariance.json");
  if (oldVsNewMismatches.length > 0 || newVsDbMismatches.length > 0) {
    console.log("\n🔴🔴🔴 불일치 발견 — STEP 지시대로 여기서 멈춘다 🔴🔴🔴");
    process.exit(1);
  } else {
    console.log("\n✅ 전수 일치 — 값 불변 확인됨.");
  }
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
