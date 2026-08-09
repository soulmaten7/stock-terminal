// STEP 964 — 잔여 계측 결함 정리 + 제출버전(vintage) 정책 재료.
// 🔴 조회 전용: DB에 쓰지 않는다. SEC 신규 호출도 없다(docs/probe_951_cache 재사용, 1,127종목 전량 캐시됨).
// §2 플래그 건수, §3 fiscal_year null 197건 분류, §4 vintage(제출버전) 중복 실측.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { annualMap, coalesceMap, NET_INCOME, EQUITY, PREFERRED, NCI, type Gaap } from "../lib/revdcf/drivers";

const CACHE_DIR = "docs/probe_951_cache";
const AS_OF = "2026-08-08";

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
function max(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.max(...nums);
}

// drivers.ts와 동일한 helper(비export) — 조회 스크립트라 복제, 원본 코드 무변경.
const isAnnual = (f?: string) => /^10-K/.test(String(f));
const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };

// §4 — annualMap과 동일 필터를 쓰되, 연도별로 "선택된 값 1개"가 아니라 "해당 연도의 모든 filed 값"을 모은다.
function rawGroupsByYear(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, { val: number; filed: string; accn?: string }[]> {
  const arr = g[tag]?.units?.[unit];
  const by: Record<number, { val: number; filed: string; accn?: string }[]> = {};
  if (!Array.isArray(arr)) return by;
  for (const e of arr as { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string; accn?: string }[]) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    const y = calYear(e.end);
    (by[y] ??= []).push({ val: e.val, filed: String(e.filed), accn: e.accn });
  }
  return by;
}

async function main() {
  const sb = createAdminClient();
  const fundRows = await fetchAllRows<{ symbol: string; fiscal_year: number | null; source_tags: Record<string, string> | null }>(
    () => sb.from("us_fundamentals").select("symbol, fiscal_year, source_tags"),
    [{ column: "symbol" }]
  );
  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const sectorBySym = new Map(sectorRows.map((r) => [r.symbol, r.sector]));
  console.log(`us_fundamentals ${fundRows.length}행 · us_sector_wide ${sectorRows.length}행`);

  // ── §2 — 플래그 건수(preferredStockUnknown · commonEquityNciNotSubtracted). 963 백필 스크립트는 flags를 저장 안 했으므로 재추출. ──
  let preferredStockUnknown = 0, commonEquityNciNotSubtracted = 0, evaluated = 0, noCache2 = 0;
  const flagBySector: Record<string, { n: number; prefUnknown: number; nciNotSub: number }> = {};
  for (const row of fundRows) {
    if (row.fiscal_year == null) continue;
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache2++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = (facts?.facts?.["us-gaap"] ?? {}) as Gaap;
    const ly = row.fiscal_year;
    evaluated++;

    const eqCo = coalesceMap(gaap, EQUITY, "stock");
    const prefCo = coalesceMap(gaap, PREFERRED, "stock");
    const nciCo = coalesceMap(gaap, NCI, "stock");
    const eqTag = eqCo.tagAt[ly] ?? null;
    const prefVal = prefCo.vals[ly] ?? null;
    const nciVal = nciCo.vals[ly] ?? null;

    const sec = sectorBySym.get(row.symbol) ?? "null";
    flagBySector[sec] ??= { n: 0, prefUnknown: 0, nciNotSub: 0 };
    flagBySector[sec].n++;

    if (prefVal == null) { preferredStockUnknown++; flagBySector[sec].prefUnknown++; }
    if (eqTag === "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest" && nciVal == null) {
      commonEquityNciNotSubtracted++; flagBySector[sec].nciNotSub++;
    }
  }
  console.log(`\n=== §2 플래그 건수(평가 ${evaluated}건, 캐시없음 ${noCache2}) ===`);
  console.log(`preferredStockUnknown=${preferredStockUnknown} (${(100 * preferredStockUnknown / evaluated).toFixed(1)}%)`);
  console.log(`commonEquityNciNotSubtracted=${commonEquityNciNotSubtracted} (${(100 * commonEquityNciNotSubtracted / evaluated).toFixed(1)}%)`);
  console.log("섹터별:", JSON.stringify(flagBySector, null, 1));

  // ── §3 — fiscal_year null 197건 분류(구조적 원인, 코드 미수정) ──
  const nullFy = fundRows.filter((r) => r.fiscal_year == null);
  const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
  let cat_ifrsNoRevTag = 0, cat_revTagNo10K = 0, cat_no10KFormAtAll = 0, cat_other = 0, noCache3 = 0;
  const sample: Record<string, string[]> = { ifrsNoRevTag: [], revTagNo10K: [], no10KFormAtAll: [], other: [] };
  for (const row of nullFy) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache3++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = (facts?.facts?.["us-gaap"] ?? {}) as Gaap;
    let anyRevTag = false, anyRevTag10K = false;
    const formsSeen = new Set<string>();
    for (const t of REV) {
      const arr = gaap[t]?.units?.USD;
      if (Array.isArray(arr) && arr.length) {
        anyRevTag = true;
        for (const e of arr as { form?: string }[]) { if (e.form) formsSeen.add(e.form); if (isAnnual(e.form)) anyRevTag10K = true; }
      }
    }
    // 전체 us-gaap 어디든 10-K 폼이 존재하는지(회사가 애초에 10-K 제출자인지 여부 확인용)
    let any10KAnywhere = false;
    for (const tag of Object.keys(gaap)) {
      const arr = gaap[tag]?.units?.USD;
      if (Array.isArray(arr)) { for (const e of arr as { form?: string }[]) { if (isAnnual(e.form)) { any10KAnywhere = true; break; } } }
      if (any10KAnywhere) break;
    }
    if (!anyRevTag) { cat_ifrsNoRevTag++; if (sample.ifrsNoRevTag.length < 8) sample.ifrsNoRevTag.push(row.symbol); }
    else if (anyRevTag && !anyRevTag10K && !any10KAnywhere) { cat_no10KFormAtAll++; if (sample.no10KFormAtAll.length < 8) sample.no10KFormAtAll.push(row.symbol); }
    else if (anyRevTag && !anyRevTag10K) { cat_revTagNo10K++; if (sample.revTagNo10K.length < 8) sample.revTagNo10K.push(row.symbol); }
    else { cat_other++; if (sample.other.length < 8) sample.other.push(row.symbol); }
  }
  console.log(`\n=== §3 fiscal_year null ${nullFy.length}건 분류(캐시없음 ${noCache3}) ===`);
  console.log(`A. us-gaap 매출태그 자체가 전무(IFRS/20-F 등 의심)=${cat_ifrsNoRevTag}`);
  console.log(`B. 매출태그는 있으나 10-K 폼이 아예 없음(6-K/8-K 전용 등)=${cat_no10KFormAtAll}`);
  console.log(`C. 매출태그 있고 10-K 폼도 다른 항목엔 있으나, 매출태그 자체는 10-K로 안 잡힘(은행형 등)=${cat_revTagNo10K}`);
  console.log(`D. 그 외(원인 미분류)=${cat_other}`);
  console.log("표본:", JSON.stringify(sample, null, 1));

  // ── §4 — vintage(제출버전) 중복 실측. 축별: netIncome(PER) · equity(PBR) · revenue(PSR) ──
  type VintageDiff = { symbol: string; year: number; tag: string; earliestVal: number; latestVal: number; absRelDiff: number };
  const vintageByAxis: Record<string, VintageDiff[]> = { netIncome: [], equity: [], revenue: [] };
  let dupYearsTotal = 0, symbolsChecked = 0, noCache4 = 0;
  const AXIS_TAGS: Record<string, string[]> = { netIncome: NET_INCOME, equity: EQUITY, revenue: REV };

  for (const row of fundRows) {
    if (row.fiscal_year == null) continue;
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache4++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = (facts?.facts?.["us-gaap"] ?? {}) as Gaap;
    symbolsChecked++;
    const ly = row.fiscal_year;

    for (const axis of ["netIncome", "equity", "revenue"] as const) {
      // 963에서 실제로 채택된 태그(source_tags)가 있으면 그것만, 없으면 우선순위 1번 태그로 근사.
      const chosenTag = row.source_tags?.[axis] ?? AXIS_TAGS[axis][0];
      const kind = axis === "equity" ? "stock" : "flow";
      const groups = rawGroupsByYear(gaap, chosenTag, kind);
      const g = groups[ly];
      if (!g || g.length < 2) continue;
      dupYearsTotal++;
      const sorted = [...g].sort((a, b) => a.filed.localeCompare(b.filed));
      const earliest = sorted[0], latest = sorted[sorted.length - 1];
      if (earliest.val === latest.val) continue; // filed만 다르고 값은 같은 경우(단순 재확인 제출) 제외
      const absRelDiff = earliest.val !== 0 ? Math.abs((latest.val - earliest.val) / earliest.val) : null;
      if (absRelDiff == null) continue;
      vintageByAxis[axis].push({ symbol: row.symbol, year: ly, tag: chosenTag, earliestVal: earliest.val, latestVal: latest.val, absRelDiff });
    }
  }
  console.log(`\n=== §4 vintage(제출버전 이중값) 실측(캐시 ${symbolsChecked}종목, 캐시없음 ${noCache4}) ===`);
  for (const axis of ["netIncome", "equity", "revenue"] as const) {
    const diffs = vintageByAxis[axis];
    const rels = diffs.map((d) => d.absRelDiff);
    console.log(`\n[${axis}] 값이 실제로 다른 이중값 종목수=${diffs.length} / 축평가종목 ${symbolsChecked}`);
    console.log(`  절대상대차 중앙값=${median(rels)} p90=${p90(rels)} max=${max(rels)}`);
    const top5 = [...diffs].sort((a, b) => b.absRelDiff - a.absRelDiff).slice(0, 5);
    console.log(`  최대 5건:`, JSON.stringify(top5, null, 1));
  }

  // Citigroup 개별(revenue 축, 962/958이 발견한 81,139M vs 80,722M 재현 확인)
  const citiRev = vintageByAxis.revenue.find((d) => d.symbol === "C");
  console.log("\nCitigroup(C) revenue vintage:", JSON.stringify(citiRev, null, 1));

  fs.writeFileSync(
    "docs/probe_964_residuals.json",
    JSON.stringify(
      {
        step2_flags: { evaluated, noCache: noCache2, preferredStockUnknown, commonEquityNciNotSubtracted, bySector: flagBySector },
        step3_fiscalYearNull: {
          total: nullFy.length, noCache: noCache3,
          cat_ifrsNoRevTag, cat_no10KFormAtAll, cat_revTagNo10K, cat_other, sample,
          symbols: nullFy.map((r) => r.symbol),
        },
        step4_vintage: {
          symbolsChecked, noCache: noCache4,
          axisSummary: Object.fromEntries((["netIncome", "equity", "revenue"] as const).map((axis) => {
            const diffs = vintageByAxis[axis]; const rels = diffs.map((d) => d.absRelDiff);
            return [axis, { dupNonequalCount: diffs.length, medianAbsRelDiff: median(rels), p90AbsRelDiff: p90(rels), maxAbsRelDiff: max(rels) }];
          })),
          netIncome: vintageByAxis.netIncome, equity: vintageByAxis.equity, revenue: vintageByAxis.revenue,
          citiRevenue: citiRev ?? null,
        },
      },
      null,
      1
    )
  );
  console.log("\n저장: docs/probe_964_residuals.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
