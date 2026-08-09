// STEP 951 보강② — 미비교 12종목(skipped 7 + DB없음 5) 확인 + 30종목 통합 상태 전이표.
// 🔴 SEC 호출 없음(docs/probe_951_cache/ 30종목 전용 재사용). DB는 읽기만(damodaran_*·us_market_cap·us_cik_map·revdcf_results).
// 🔴 코드 무변경·DB 쓰기 0·push 없음. route.ts와 동일한 파이프라인(assembleWacc·creditSpreadFor·computeGapWithSensitivity·fetchSectorMap)을
//    그대로 재사용해 "오늘 다시 돈다면" 어떻게 될지 참고값을 낸다 — 실제 DB에는 쓰지 않는다.
// 실행: npx tsx scripts/probe_951c_verify.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "../lib/revdcf/compute";
import type { RevDcfDrivers, RevDcfMarket } from "../lib/revdcf/engine";
import { fetchSectorMap } from "../lib/sector";
import { REVDCF_DEFAULT_MAX_YEARS } from "../app/api/cron/revdcf/constants";

type Gaap = Parameters<typeof computeDrivers>[0];
const CACHE_DIR = "docs/probe_951_cache";
const MCAP_TTL_DAYS = 7;

const SAMPLE30 = [
  "A", "AA", "AAL", "AAPL", "ABBV", "ABNB", "ABT", "ACM", "ACN", "ADBE", "ADI", "ADM", "ADP", "ADSK",
  "AEE", "AEIS", "AEP", "AES", "AIT", "AKAM", "NVDA", "MSFT", "AMCR", "AMST", "BR", "ANF", "AVAH", "BBY", "ACRS", "ACT",
];
const SKIPPED7 = { STALE_MARKETCAP: ["ACM", "ADI", "AIT", "BBY"], NO_MARGINAL_CAPEX: ["ABNB", "ADP", "AEP"] };
const DB_ABSENT5 = ["AMST", "ANF", "AVAH", "ACRS", "ACT"];

async function main() {
  const sb = createAdminClient();

  // ── 참조 데이터(route.ts와 동일, 읽기 전용) ──
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rf = +gi.riskfree_rate, erp = +gi.erp, inflation = +gi.expected_inflation;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[]).map((b) => [b.industry, b]));
  const { byTicker: indByT } = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
  const mcapRows = (await sb.from("us_market_cap").select("symbol, market_cap, as_of").in("symbol", [...SKIPPED7.STALE_MARKETCAP, ...SKIPPED7.NO_MARGINAL_CAPEX, ...DB_ABSENT5])).data as { symbol: string; market_cap: number; as_of: string }[];
  const mcapBy = new Map((mcapRows ?? []).map((r) => [r.symbol.toUpperCase(), r]));
  const mcapCutoff = new Date(Date.now() - MCAP_TTL_DAYS * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const cikRows = (await sb.from("us_cik_map").select("symbol, cik").in("symbol", [...SKIPPED7.STALE_MARKETCAP, ...SKIPPED7.NO_MARGINAL_CAPEX, ...DB_ABSENT5])).data as { symbol: string; cik: number }[];
  const cikBy = new Map((cikRows ?? []).map((r) => [r.symbol, r.cik]));

  // route.ts와 동일한 게이트 순서를 그대로 재현 — "오늘 다시 돈다면" 참고값(DB 미기록).
  function replicateRoute(symbol: string, gaap: Gaap): Record<string, unknown> {
    const dr = computeDrivers(gaap, {});
    const yearWindow = (dr.flags as Record<string, unknown>).yearWindow ?? null;
    const windowReason = (dr.flags as Record<string, unknown>).windowReason ?? null;
    if (!dr.ok) return { symbol, stage: "DRIVER_SKIP", skipReason: dr.skipReason, yearWindow, windowReason };
    const ind = indByT.get(symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    if (!ind || !beta) return { symbol, stage: "NO_INDUSTRY", yearWindow, fixedCapitalRateMarginal: dr.drivers.fixedCapitalRateMarginal };
    const mcapRow = mcapBy.get(symbol.toUpperCase());
    if (!mcapRow || !(mcapRow.market_cap > 0)) return { symbol, stage: "NO_MARKETCAP", yearWindow, fixedCapitalRateMarginal: dr.drivers.fixedCapitalRateMarginal };
    if (mcapRow.as_of < mcapCutoff) {
      const ageDays = Math.round((Date.now() - Date.parse(mcapRow.as_of)) / 86_400_000);
      return { symbol, stage: "STALE_MARKETCAP", yearWindow, marketCapAsOf: mcapRow.as_of, marketCapAgeDays: ageDays, fixedCapitalRateMarginal: dr.drivers.fixedCapitalRateMarginal };
    }
    const mcap = mcapRow.market_cap;
    const deRatio = dr.market.debt / mcap;
    const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
    const sharePrice = mcap / dr.market.shares;
    const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
    if (dr.drivers.fixedCapitalRateMarginal == null) return { symbol, stage: "NO_MARGINAL_CAPEX", yearWindow, invYearsInfo: "invYears 중 capex 또는 dna 결측 — fixedCapitalRateMarginal null" };
    const drv: RevDcfDrivers = { ...dr.drivers, taxRate: usTax, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal };
    const sens = computeGapWithSensitivity(drv, market, { maxYears: REVDCF_DEFAULT_MAX_YEARS });
    return {
      symbol, stage: "COMPUTED", yearWindow,
      verdict: sens.base.kind, gapYears: sens.base.kind === "years" ? sens.base.gap : null,
      fixedCapitalRateMarginal: dr.drivers.fixedCapitalRateMarginal, wacc: w.wacc,
    };
  }

  // ── 1단계: skipped 7건 ──
  const step1: Record<string, unknown>[] = [];
  for (const symbol of [...SKIPPED7.STALE_MARKETCAP, ...SKIPPED7.NO_MARGINAL_CAPEX]) {
    const cacheFile = path.join(CACHE_DIR, `${symbol}.json`);
    if (!fs.existsSync(cacheFile)) { step1.push({ symbol, status: "NO_CACHE" }); continue; }
    const raw = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as { facts?: { "us-gaap"?: Gaap } };
    const gaap = raw.facts?.["us-gaap"];
    if (!gaap) { step1.push({ symbol, status: "NO_GAAP" }); continue; }
    const dr = computeDrivers(gaap, {});
    const oldInvYears = [2021, 2022, 2023, 2024]; // YS.slice(1), 옛 고정창[2020..2024]
    const newYearWindow = (dr.flags as Record<string, unknown>).yearWindow as number[] | null | undefined;
    const newInvYears = newYearWindow ? newYearWindow.slice(1) : null;
    const replicated = replicateRoute(symbol, gaap);
    step1.push({
      symbol,
      dbSkipReason: SKIPPED7.STALE_MARKETCAP.includes(symbol) ? "STALE_MARKETCAP" : "NO_MARGINAL_CAPEX",
      driverOk: dr.ok, driverSkipReason: dr.ok ? null : dr.skipReason,
      oldInvYears, newInvYears,
      fixedCapitalRateMarginal_new: dr.ok ? dr.drivers.fixedCapitalRateMarginal : null,
      replicated,
    });
  }

  // ── 2단계: DB 없음 5건 ──
  const step2: Record<string, unknown>[] = [];
  for (const symbol of DB_ABSENT5) {
    const cik = cikBy.get(symbol) ?? null;
    const cacheFile = path.join(CACHE_DIR, `${symbol}.json`);
    let ref: Record<string, unknown> | null = null;
    if (fs.existsSync(cacheFile)) {
      const raw = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as { facts?: { "us-gaap"?: Gaap } };
      const gaap = raw.facts?.["us-gaap"];
      if (gaap) ref = replicateRoute(symbol, gaap);
    }
    step2.push({ symbol, cik, inRevdcfResultsEver: false, note: "revdcf_results 전체 기간(2026-08-01~08-08) 어떤 as_of에도 존재하지 않음 — Supabase 직접 조회 확인", referenceComputation: ref ?? { status: "NO_CACHE" } });
  }

  const out = { measuredAt: "2026-08-08", step1_skipped7: step1, step2_dbAbsent5: step2, mcapCutoffUsed: mcapCutoff };
  fs.writeFileSync("docs/probe_951c_verify.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  console.log("\n저장 완료 — docs/probe_951c_verify.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
