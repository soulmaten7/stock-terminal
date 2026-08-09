// STEP 963 §3 — before/after 영향 실측(메모리 계산만, DB 쓰기 0).
// 🔴 정정(1차 시도 결함): computeDrivers()를 그대로 부르면 resolveYearWindow가 "오늘 기준 최신 연도"를 다시 골라
//   us_fundamentals에 저장된 옛 창(fiscal_year)과 다른 연도를 비교하게 된다(옛 창 vs 새 창 혼입, VALUATION_SPEC.md
//   미해결0번과 같은 함정). 그래서 annualMap/coalesceMap을 직접 재사용해 저장된 fiscal_year에 "고정"해서 재추출한다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { annualMap, coalesceMap, NET_INCOME, EQUITY, PREFERRED, NCI, type Gaap } from "../lib/revdcf/drivers";
import { computeValuation } from "../lib/valuation";

const CACHE_DIR = "docs/probe_951_cache";

type OldRow = { symbol: string; per: number | null; pbr: number | null; market_cap: number | null };
type FundRow = { symbol: string; fiscal_year: number | null };
type SectorRow = { symbol: string; sector: string | null };

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function p90(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))];
}

async function main() {
  const sb = createAdminClient();
  const oldRows = await fetchAllRows<OldRow>(
    () => sb.from("us_valuation").select("symbol, per, pbr, market_cap").eq("as_of", "2026-08-08"),
    [{ column: "symbol" }]
  );
  const fundRows = await fetchAllRows<FundRow>(
    () => sb.from("us_fundamentals").select("symbol, fiscal_year"),
    [{ column: "symbol" }]
  );
  const fyBySym = new Map(fundRows.map((r) => [r.symbol, r.fiscal_year]));
  const sectorRows = await fetchAllRows<SectorRow>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", "2026-08-08"),
    [{ column: "symbol" }]
  );
  const sectorBySym = new Map(sectorRows.map((r) => [r.symbol, r.sector]));
  console.log(`us_valuation ${oldRows.length}행 · us_fundamentals(fiscal_year) ${fundRows.length}행 · us_sector_wide ${sectorRows.length}행`);

  type Cmp = {
    symbol: string; sector: string | null; fiscalYear: number | null;
    oldPer: number | null; newPer: number | null;
    oldPbr: number | null; newPbr: number | null;
    newCommonEquity: number | null; newEquity: number | null; newPreferred: number | null; newNci: number | null; eqTag: string | null;
    oldPerAvail: boolean; newPerAvail: boolean;
    oldPbrAvail: boolean; newPbrAvail: boolean;
  };
  const results: Cmp[] = [];
  let noCache = 0, loadErr = 0, noFiscalYear = 0;

  for (const old of oldRows) {
    const ly = fyBySym.get(old.symbol);
    if (ly == null) { noFiscalYear++; continue; }
    const path = `${CACHE_DIR}/${old.symbol}.json`;
    if (!fs.existsSync(path)) { noCache++; continue; }
    let facts: unknown;
    try { facts = JSON.parse(fs.readFileSync(path, "utf-8")); } catch { loadErr++; continue; }
    const gaap = ((facts as { facts?: { "us-gaap"?: Gaap } })?.facts?.["us-gaap"] ?? {}) as Gaap;

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
        ? (nciVal != null ? eqVal - nciVal : eqVal)
        : eqVal;
      commonEquity = commonEquity - (prefVal ?? 0);
    }

    const marketCap = old.market_cap;
    const v = computeValuation({ marketCap, netIncome: newNetIncome, equity: commonEquity, revenue: null, operatingIncome: null, dna: null, debt: null, nonOperatingAssets: null });

    results.push({
      symbol: old.symbol, sector: sectorBySym.get(old.symbol) ?? null, fiscalYear: ly,
      oldPer: old.per, newPer: v.per, oldPbr: old.pbr, newPbr: v.pbr,
      newCommonEquity: commonEquity, newEquity: eqVal, newPreferred: prefVal, newNci: nciVal, eqTag,
      oldPerAvail: old.per != null, newPerAvail: v.per != null,
      oldPbrAvail: old.pbr != null, newPbrAvail: v.pbr != null,
    });
  }
  console.log(`계산완료 ${results.length}건, 캐시없음 ${noCache}건, 로드오류 ${loadErr}건, fiscal_year없음 ${noFiscalYear}건`);

  function axisSummary(label: string, oldKey: "oldPer" | "oldPbr", newKey: "newPer" | "newPbr", oldAvailKey: "oldPerAvail" | "oldPbrAvail", newAvailKey: "newPerAvail" | "newPbrAvail") {
    let changed = 0, newlyUnavailable = 0, newlyAvailable = 0;
    const absRelDiffs: number[] = [];
    for (const r of results) {
      const o = r[oldKey], n = r[newKey];
      const oAvail = r[oldAvailKey], nAvail = r[newAvailKey];
      if (oAvail && !nAvail) newlyUnavailable++;
      if (!oAvail && nAvail) newlyAvailable++;
      if (o != null && n != null) {
        if (Math.abs(o - n) > 1e-9) changed++;
        if (o !== 0) absRelDiffs.push(Math.abs((n - o) / o));
      }
    }
    console.log(`\n=== ${label} ===`);
    console.log(`값비교가능 ${absRelDiffs.length}건 중 변화 ${changed}건`);
    console.log(`절대상대차 중앙값=${median(absRelDiffs)} p90=${p90(absRelDiffs)}`);
    console.log(`새로 unavailable(커버리지손실)=${newlyUnavailable}건, 새로 available=${newlyAvailable}건`);
    return { comparable: absRelDiffs.length, changed, medianAbsRelDiff: median(absRelDiffs), p90AbsRelDiff: p90(absRelDiffs), newlyUnavailable, newlyAvailable };
  }

  const perSummary = axisSummary("PER", "oldPer", "newPer", "oldPerAvail", "newPerAvail");
  const pbrSummary = axisSummary("PBR", "oldPbr", "newPbr", "oldPbrAvail", "newPbrAvail");

  const sectors = Array.from(new Set(results.map((r) => r.sector ?? "null")));
  const bySector: Record<string, unknown> = {};
  for (const sec of sectors) {
    const subset = results.filter((r) => (r.sector ?? "null") === sec);
    const pbrDiffs: number[] = [];
    let pbrChanged = 0, pbrNewlyUnavail = 0;
    for (const r of subset) {
      if (r.oldPbrAvail && !r.newPbrAvail) pbrNewlyUnavail++;
      if (r.oldPbr != null && r.newPbr != null) {
        if (Math.abs(r.oldPbr - r.newPbr) > 1e-9) pbrChanged++;
        if (r.oldPbr !== 0) pbrDiffs.push(Math.abs((r.newPbr - r.oldPbr) / r.oldPbr));
      }
    }
    bySector[sec] = { n: subset.length, pbrChanged, pbrMedianAbsRelDiff: median(pbrDiffs), pbrP90AbsRelDiff: p90(pbrDiffs), pbrNewlyUnavail };
  }
  console.log("\n=== 섹터별 PBR 영향(Financials 확인) ===");
  console.log(JSON.stringify(bySector["Financials"], null, 1));
  console.log("\n=== 전 섹터 요약 ===");
  console.log(JSON.stringify(bySector, null, 1));

  const citi = results.find((r) => r.symbol === "C");
  console.log("\n=== Citigroup(C) ===");
  console.log(JSON.stringify(citi, null, 1));

  // 새로 unavailable이 된 PBR·PER 종목 목록(§3-4 커버리지 손실 확인용)
  const perNewlyUnavailList = results.filter((r) => r.oldPerAvail && !r.newPerAvail).map((r) => r.symbol);
  const pbrNewlyUnavailList = results.filter((r) => r.oldPbrAvail && !r.newPbrAvail).map((r) => r.symbol);
  console.log(`\nPER 새로 unavailable(${perNewlyUnavailList.length}):`, perNewlyUnavailList.slice(0, 30));
  console.log(`PBR 새로 unavailable(${pbrNewlyUnavailList.length}):`, pbrNewlyUnavailList.slice(0, 30));

  fs.writeFileSync("/tmp/step963_impact_full.json", JSON.stringify({ results, perSummary, pbrSummary, bySector, citi, noCache, loadErr, noFiscalYear, perNewlyUnavailList, pbrNewlyUnavailList }, null, 1));
  console.log("\n저장: /tmp/step963_impact_full.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
