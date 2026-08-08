// STEP 951 보강 — §2 옳은 비교. 951 §5의 before(재계산·재현 실패)를 버리고 DB 저장값을 그대로 읽는다.
// before = revdcf_results as_of=2026-08-08 의 verdict·gap_years 저장값 그대로(재계산 없음).
// after  = 새 코드(resolveYearWindow 적용)로 계산한 driver를 쓰되, wacc·tax_rate·debt·non_operating_assets·
//          shares·share_price는 DB 행 그대로 재사용한다 — 창 이외의 입력을 고정해 "창의 효과"만 분리한다.
// 🔴 SEC 호출 없음(docs/probe_951_cache/ 전용 재사용). 캐시 없는 심볼은 스킵하고 그 사실을 보고한다.
// 실행: npx tsx scripts/probe_951b_verify.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers } from "../lib/revdcf/drivers";
import type { RevDcfDrivers, RevDcfMarket } from "../lib/revdcf/engine";
import { computeGapWithSensitivity } from "../lib/revdcf/compute";

type Gaap = Parameters<typeof computeDrivers>[0];

const CACHE_DIR = "docs/probe_951_cache";
const MAX_YEARS = 25;
const INFLATION = 0.025;

const SAMPLE30 = [
  "A", "AA", "AAL", "AAPL", "ABBV", "ABNB", "ABT", "ACM", "ACN", "ADBE", "ADI", "ADM", "ADP", "ADSK",
  "AEE", "AEIS", "AEP", "AES", "AIT", "AKAM", "NVDA", "MSFT", "AMCR", "AMST", "BR", "ANF", "AVAH", "BBY", "ACRS", "ACT",
];

type RdRow = {
  symbol: string; verdict: string; gap_years: number | null; wacc: string | null; tax_rate: string | null;
  debt: string | null; non_operating_assets: string | null; shares: string | null; share_price: string | null;
};

async function main() {
  // 🔴 캐시 전수 확인 — 없으면 새로 받지 않고 보고만 하고 그 심볼은 제외.
  const missing: string[] = [];
  for (const s of SAMPLE30) if (!fs.existsSync(path.join(CACHE_DIR, `${s}.json`))) missing.push(s);
  if (missing.length) console.log(`🔴 캐시 없음(제외): ${missing.join(",")}`);
  const covered = SAMPLE30.filter((s) => !missing.includes(s));

  const sb = createAdminClient();
  const { data: rdRows } = await sb
    .from("revdcf_results")
    .select("symbol,verdict,gap_years,wacc,tax_rate,debt,non_operating_assets,shares,share_price")
    .eq("as_of", "2026-08-08")
    .in("symbol", covered);
  const rdBySym = new Map(((rdRows ?? []) as RdRow[]).map((r) => [r.symbol, r]));

  const results: Record<string, unknown>[] = [];
  let comparable = 0;
  const changed: Record<string, unknown>[] = [];
  const unchangedSymbols: string[] = [];
  const gapOnlyChanged: Record<string, unknown>[] = [];
  const directionCounts: Record<string, number> = {};
  let noDbRow = 0, dbSkipped = 0, afterNotOk = 0;

  for (const symbol of covered) {
    const raw = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, `${symbol}.json`), "utf8")) as { facts?: { "us-gaap"?: Gaap } };
    const gaap = raw.facts?.["us-gaap"];
    if (!gaap) { results.push({ symbol, status: "NO_GAAP_IN_CACHE" }); continue; }

    const after = computeDrivers(gaap, {});
    const rd = rdBySym.get(symbol);

    if (!rd) { noDbRow++; results.push({ symbol, status: "NO_DB_ROW", afterOk: after.ok }); continue; }
    if (rd.verdict === "skipped" || rd.wacc == null) { dbSkipped++; results.push({ symbol, status: "DB_SKIPPED_NOT_COMPARABLE", beforeVerdict: rd.verdict }); continue; }
    if (!after.ok) { afterNotOk++; results.push({ symbol, status: "AFTER_NOT_OK", afterSkipReason: after.skipReason, beforeVerdict: rd.verdict }); continue; }

    // 🔑 창 이외 입력은 DB 그대로(격리) — wacc·tax_rate·debt·non_operating_assets·shares·share_price.
    const market: RevDcfMarket = {
      wacc: Number(rd.wacc), inflation: INFLATION, sharePrice: Number(rd.share_price), sharesOutstanding: Number(rd.shares),
      debt: Number(rd.debt), nonOperatingAssets: Number(rd.non_operating_assets),
    };
    const drvAfter: RevDcfDrivers = {
      startingSales: after.drivers.startingSales, salesGrowth: after.drivers.salesGrowth, operatingMargin: after.drivers.operatingMargin,
      startingMargin: after.drivers.startingMargin, taxRate: Number(rd.tax_rate),
      fixedCapitalRate: after.drivers.fixedCapitalRateMarginal ?? after.drivers.fixedCapitalRateLevel, workingCapitalRate: after.drivers.workingCapitalRate,
    };
    const sensAfter = computeGapWithSensitivity(drvAfter, market, { maxYears: MAX_YEARS });
    const verdictAfter = sensAfter.base.kind;
    const gapAfter = sensAfter.base.kind === "years" ? sensAfter.base.gap : null;

    comparable++;
    const verdictBefore = rd.verdict;
    const gapBefore = rd.gap_years;
    const entry = {
      symbol, verdictBefore, gapBefore, verdictAfter, gapAfter,
      yearWindow: (after.flags as Record<string, unknown>).yearWindow ?? null,
    };
    results.push({ status: "OK", ...entry });

    if (verdictBefore !== verdictAfter) {
      changed.push(entry);
      const dir = `${verdictBefore}→${verdictAfter}`;
      directionCounts[dir] = (directionCounts[dir] ?? 0) + 1;
    } else {
      unchangedSymbols.push(symbol);
      if (gapBefore !== gapAfter) gapOnlyChanged.push(entry);
    }
  }

  const summary = {
    measuredAt: "2026-08-08",
    sampleTotal: SAMPLE30.length,
    cacheMissing: missing,
    cacheCovered: covered.length,
    noDbRow, dbSkipped, afterNotOk,
    comparable_n: comparable,
    verdictChanged_n: changed.length,
    verdictChanged_ratio: comparable > 0 ? changed.length / comparable : null,
    verdictChanged: changed,
    verdictUnchanged_symbols: unchangedSymbols,
    directionCounts,
    gapYearsOnlyChanged_n: gapOnlyChanged.length,
    gapYearsOnlyChanged: gapOnlyChanged,
    sampleLimitationNote: "🔴 캐시 30종목은 STEP950 §3의 사전순 20종목 + STEP951 §5가 추가한 10종목이다. revdcf_results 604종목 전수가 아니며 사전순 편향이 있다(A로 시작하는 종목 다수).",
  };

  console.log(JSON.stringify(summary, null, 2));
  fs.writeFileSync("docs/probe_951b_verify.json", JSON.stringify({ measuredAt: "2026-08-08", sample: SAMPLE30, results, summary }, null, 2));
  console.log("\n저장 완료 — docs/probe_951b_verify.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
