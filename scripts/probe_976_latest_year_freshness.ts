// STEP 976 §1~3 — latestYear() 값 신선도 전수 스캔. 측정 전용, DB 쓰기 없음.
// 🔴 lib/revdcf/drivers.ts를 고치지 않는다. annualMap·coalesceMap은 그대로 import(export됨).
//   sumMaps·hasAll·latestYear·SHARES_DIL·SHARES_MORE는 export 안 돼 있어 여기 복제한다(원본 무변경, 동작 100% 동일 — 원본과 줄 단위 대조).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import {
  annualMap, coalesceMap, type Gaap,
  DEBT_LT, DEBT_CUR, FIN_LEASE, DEBT_TOTAL_SINGLE,
} from "../lib/revdcf/drivers";

// ── 복제(원본 drivers.ts와 동일, export 안 돼 있어 재사용 불가) ──
const SHARES_DIL = ["WeightedAverageNumberOfDilutedSharesOutstanding"];
const SHARES_MORE = ["WeightedAverageNumberOfSharesOutstandingBasic", "CommonStockSharesOutstanding"];
const CASH_NONOP = ["CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "CashAndCashEquivalentsAtCarryingValue"];
const SECURITIES = ["ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesCurrent", "OtherShortTermInvestments"];
const sumMaps = (years: number[], ...ms: Record<number, number>[]): Record<number, number> => {
  const o: Record<number, number> = {};
  for (const y of years) { let s: number | null = null; for (const m of ms) if (m[y] != null) s = (s ?? 0) + m[y]; if (s != null) o[y] = s; }
  return o;
};
const hasAll = (years: number[], m: Record<number, number>) => years.every((y) => m[y] != null);
const latestYear = (years: number[], m: Record<number, number>): number | null => {
  for (let i = years.length - 1; i >= 0; i--) if (m[years[i]] != null) return years[i];
  return null;
};

const CACHE_DIR = "docs/probe_951_cache";

type Row = { symbol: string; verdict: string; gapYears: number | null; yearWindow: number[] | null; debtBasisStored: string | null };

async function fetchRevdcfUniverse(sb: ReturnType<typeof createAdminClient>): Promise<Row[]> {
  const asOfRow = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!asOfRow) throw new Error("revdcf_results 비어있음");
  const rows = await fetchAllRows<{ symbol: string; verdict: string; gap_years: number | null; flags: { yearWindow?: number[]; debtBasis?: string } | null }>(
    () => sb.from("revdcf_results").select("symbol, verdict, gap_years, flags").eq("as_of", asOfRow.as_of),
    [{ column: "symbol" }]
  );
  return rows.map((r) => ({ symbol: r.symbol, verdict: r.verdict, gapYears: r.gap_years, yearWindow: r.flags?.yearWindow ?? null, debtBasisStored: r.flags?.debtBasis ?? null }));
}

function loadGaap(symbol: string): { gaap: Gaap; dei: Gaap } | null {
  const p = `${CACHE_DIR}/${symbol}.json`;
  if (!fs.existsSync(p)) return null;
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  return { gaap: d.facts?.["us-gaap"] ?? {}, dei: d.facts?.["dei"] ?? {} };
}

type FieldResult = { symbol: string; targetYear: number; returnedYear: number | null; lag: number | null; value: number | null; tierOrTag: string | null };

async function main() {
  const sb = createAdminClient();
  const universe = await fetchRevdcfUniverse(sb);
  console.log(`revdcf 유니버스: ${universe.length}종목`);

  const missingCache: string[] = [];
  const missingWindow: string[] = [];
  const shares: FieldResult[] = [];
  const debt: FieldResult[] = [];
  const interestExpense: FieldResult[] = [];
  const nonOperatingAssets: FieldResult[] = [];
  const debtStoredTaggedButNoLagData: string[] = [];
  const debtNullSymbols: string[] = [];

  for (const row of universe) {
    if (!row.yearWindow || row.yearWindow.length === 0) { missingWindow.push(row.symbol); continue; }
    const years = row.yearWindow;
    const lastY = years[years.length - 1];
    const loaded = loadGaap(row.symbol);
    if (!loaded) { missingCache.push(row.symbol); continue; }
    const { gaap, dei } = loaded;

    // ── shares (drivers.ts :354-359 그대로) ──
    const sharesDil = annualMap(gaap, SHARES_DIL[0], "flow", "shares");
    let sTier = "sharesDil(1순위)";
    let sYear = latestYear(years, sharesDil);
    let sVal: number | null = sYear != null ? sharesDil[sYear] : null;
    if (sVal == null) {
      for (const t of SHARES_MORE) {
        const m = annualMap(gaap, t, t.startsWith("Weighted") ? "flow" : "stock", "shares");
        const y = latestYear(years, m);
        if (y != null && m[y] != null) { sVal = m[y]; sYear = y; sTier = `SHARES_MORE:${t}`; break; }
      }
    }
    if (sVal == null) {
      const deiSh = annualMap(dei, "EntityCommonStockSharesOutstanding", "stock", "shares");
      const y = latestYear(years, deiSh);
      if (y != null) { sVal = deiSh[y]; sYear = y; sTier = "dei"; }
    }
    if (sVal != null && sYear != null) {
      shares.push({ symbol: row.symbol, targetYear: lastY, returnedYear: sYear, lag: lastY - sYear, value: sVal, tierOrTag: sTier });
    }

    // ── debt (drivers.ts :374-403 그대로, tagged 케이스만 lag 대상) ──
    const singleCo = coalesceMap(gaap, DEBT_TOTAL_SINGLE, "stock");
    const debtMap = hasAll(years, singleCo.vals) || singleCo.vals[lastY] != null
      ? singleCo.vals
      : sumMaps(years, coalesceMap(gaap, DEBT_LT, "stock").vals, coalesceMap(gaap, DEBT_CUR, "stock").vals, sumMaps(years, annualMap(gaap, FIN_LEASE[0], "stock"), annualMap(gaap, FIN_LEASE[1], "stock")));
    const debtLy = latestYear(years, debtMap);
    if (debtLy != null) {
      debt.push({ symbol: row.symbol, targetYear: lastY, returnedYear: debtLy, lag: lastY - debtLy, value: debtMap[debtLy], tierOrTag: hasAll(years, singleCo.vals) || singleCo.vals[lastY] != null ? "single" : "combined(LT+CUR+lease)" });
    } else if (row.debtBasisStored === "tagged") {
      debtStoredTaggedButNoLagData.push(row.symbol);
    }
    if (debtLy == null) debtNullSymbols.push(row.symbol);

    // ── InterestExpense (drivers.ts :381 그대로) ──
    const iMap = annualMap(gaap, "InterestExpense", "flow");
    const iLy = latestYear(years, iMap);
    if (iLy != null) interestExpense.push({ symbol: row.symbol, targetYear: lastY, returnedYear: iLy, lag: lastY - iLy, value: iMap[iLy], tierOrTag: null });

    // ── nonOperatingAssets (drivers.ts :405-408 그대로) ──
    const nonOpCash = coalesceMap(gaap, CASH_NONOP, "stock").vals, sec = coalesceMap(gaap, SECURITIES, "stock").vals;
    const nonOpMap = sumMaps(years, nonOpCash, sec);
    const nonOpLy = latestYear(years, nonOpMap);
    if (nonOpLy != null) nonOperatingAssets.push({ symbol: row.symbol, targetYear: lastY, returnedYear: nonOpLy, lag: lastY - nonOpLy, value: nonOpMap[nonOpLy], tierOrTag: null });
  }

  function summarize(field: FieldResult[]) {
    const dist: Record<string, number> = { "0": 0, "1": 0, "2": 0, "3+": 0 };
    for (const r of field) { const k = r.lag == null ? "?" : r.lag >= 3 ? "3+" : String(r.lag); dist[k] = (dist[k] ?? 0) + 1; }
    return { total: field.length, dist, pct: Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, +((v / field.length) * 100).toFixed(2)])) };
  }

  const sharesSummary = summarize(shares);
  const debtSummary = summarize(debt);
  const ieSummary = summarize(interestExpense);
  const nonOpSummary = summarize(nonOperatingAssets);

  const sharesTierBreakdown: Record<string, number> = {};
  for (const r of shares.filter((r) => (r.lag ?? 0) >= 1)) sharesTierBreakdown[r.tierOrTag ?? "?"] = (sharesTierBreakdown[r.tierOrTag ?? "?"] ?? 0) + 1;

  const lagGte1 = {
    shares: shares.filter((r) => (r.lag ?? 0) >= 1).sort((a, b) => (b.lag ?? 0) - (a.lag ?? 0)),
    debt: debt.filter((r) => (r.lag ?? 0) >= 1).sort((a, b) => (b.lag ?? 0) - (a.lag ?? 0)),
    interestExpense: interestExpense.filter((r) => (r.lag ?? 0) >= 1).sort((a, b) => (b.lag ?? 0) - (a.lag ?? 0)),
    nonOperatingAssets: nonOperatingAssets.filter((r) => (r.lag ?? 0) >= 1).sort((a, b) => (b.lag ?? 0) - (a.lag ?? 0)),
  };
  const lagGte2 = {
    shares: shares.filter((r) => (r.lag ?? 0) >= 2),
    debt: debt.filter((r) => (r.lag ?? 0) >= 2),
    interestExpense: interestExpense.filter((r) => (r.lag ?? 0) >= 2),
    nonOperatingAssets: nonOperatingAssets.filter((r) => (r.lag ?? 0) >= 2),
  };

  // ── 2단계: debt lag>=1인 종목(=debtLy!=null, "tagged" 등가 — revdcf_results.flags.debtBasis는
  //   전량 null로 저장 안 됨을 실측 확인, 아래 stage2_note 참조)의 verdict 분포 ──
  //   🔴 stored debtBasis는 신뢰 불가라 debtLy!=null(=lagGte1.debt에 포함됨 자체)을 "tagged"의 등가로 쓴다.
  const debtLagByVerdict: Record<string, number> = {};
  const debtLagSymbolsTagged: { symbol: string; lag: number; verdict: string; gapYears: number | null }[] = [];
  for (const r of lagGte1.debt) {
    const uv = universe.find((u) => u.symbol === r.symbol);
    if (uv) {
      debtLagByVerdict[uv.verdict] = (debtLagByVerdict[uv.verdict] ?? 0) + 1;
      debtLagSymbolsTagged.push({ symbol: r.symbol, lag: r.lag!, verdict: uv.verdict, gapYears: uv.gapYears });
    }
  }
  const debtBasisStoredAlwaysNull = universe.every((u) => u.debtBasisStored == null);

  // ── InterestExpense의 실질적 영향 범위 — line 381은 debtLy==null일 때만 debtStatus 분기에 쓰인다.
  //   debtLy!=null(538건)에서는 IE 값이 계산에 아무 영향이 없다 — 그 부분집합만 별도로 요약한다.
  const ieForDebtNull = interestExpense.filter((r) => debtNullSymbols.includes(r.symbol));
  const ieForDebtNullSummary = summarize(ieForDebtNull);

  const out = {
    step: 976,
    universeSize: universe.length,
    missingCache, missingWindow,
    field_shares: { summary: sharesSummary, tierBreakdown_lagGte1: sharesTierBreakdown },
    field_debt: { summary: debtSummary, storedTaggedButNoLagData_count: debtStoredTaggedButNoLagData.length, storedTaggedButNoLagData: debtStoredTaggedButNoLagData },
    field_interestExpense: { summary: ieSummary },
    field_nonOperatingAssets: { summary: nonOpSummary },
    lagGte1_top50: {
      shares: lagGte1.shares.slice(0, 50),
      debt: lagGte1.debt.slice(0, 50),
      interestExpense: lagGte1.interestExpense.slice(0, 50),
      nonOperatingAssets: lagGte1.nonOperatingAssets.slice(0, 50),
    },
    lagGte1_fullCounts: { shares: lagGte1.shares.length, debt: lagGte1.debt.length, interestExpense: lagGte1.interestExpense.length, nonOperatingAssets: lagGte1.nonOperatingAssets.length },
    lagGte2_full: lagGte2,
    stage2_debtTaggedLag: { count: debtLagSymbolsTagged.length, byVerdict: debtLagByVerdict, symbols: debtLagSymbolsTagged, note: "revdcf_results.flags.debtBasis 실측 결과 전량 null 저장 — debtLy!=null(=이 배열 포함 자체)을 tagged 등가로 씀" },
    debtBasisStoredAlwaysNull,
    debtNullSymbolsCount: debtNullSymbols.length,
    ieForDebtNullOnly: { count: ieForDebtNull.length, summary: ieForDebtNullSummary, note: "InterestExpense(:381)는 debtLy==null일 때만 debtStatus 분기에 실사용된다 — 이 부분집합만 계산에 실질 영향" },
  };
  fs.writeFileSync("docs/probe_976_stage1_2_raw.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ sharesSummary, debtSummary, ieSummary, nonOpSummary, missingCacheCount: missingCache.length, missingWindowCount: missingWindow.length, debtBasisStoredAlwaysNull, stage2Count: debtLagSymbolsTagged.length, stage2ByVerdict: debtLagByVerdict, debtNullSymbolsCount: debtNullSymbols.length, ieForDebtNullOnly: { count: ieForDebtNull.length, summary: ieForDebtNullSummary } }, null, 2));
}

main();
