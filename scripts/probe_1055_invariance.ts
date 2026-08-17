// STEP 1055 §2-4 — 불변 검증. 죽은 태그 4개 제거(⓪-4 전제①)·새 필드 7개 추가(⓪-4 전제②)가
//   기존 revdcf_results 604건의 판정·GAP·driver 수치를 하나도 바꾸지 않는지 전수 대조.
// 방법 = 977과 동일(git show로 구코드 스냅샷 추출 → 동적 import → 같은 캐시로 각각 실행 → 비교).
//   구코드 = scripts/_step1055_tmp/drivers_before.ts(STEP1055 이전 drivers.ts 그대로).
// 🔴 SEC 신규 호출 0(docs/probe_951_cache 로컬 캐시만 사용) · DB 쓰기 0.
// 🔴 market/wacc 조건(wacc·tax_rate·debt·non_operating_assets·shares·share_price)은 저장된 revdcf_results
//   행 값을 그대로 고정 재사용한다(route.ts처럼 damodaran_*·us_market_cap을 다시 조립하지 않음) — 목적이
//   "driver 배열 변경의 효과만" 격리하는 것이라, 시장 조건까지 오늘 값으로 다시 뽑으면 잡음이 섞인다
//   (probe_951_verify.ts §STEP951과 동일 원칙).
// 실행: npx tsx scripts/probe_1055_invariance.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeDrivers as computeDriversNew } from "../lib/revdcf/drivers";
import { computeDrivers as computeDriversOld } from "./_step1055_tmp/drivers_before";
import { computeGapWithSensitivity } from "../lib/revdcf/compute";
import type { RevDcfDrivers, RevDcfMarket, RevDcfVerdict } from "../lib/revdcf/engine";
import { REVDCF_DEFAULT_MAX_YEARS } from "../app/api/cron/revdcf/constants";

const CACHE_DIR = process.env.PROBE_CACHE_DIR || "docs/probe_951_cache";

type RdRow = {
  symbol: string; cik: number; verdict: string; skip_reason: string | null;
  gap_years: number | null; gap_wacc_minus1: number | null; gap_wacc_plus1: number | null;
  sales_growth: number | null; operating_margin: number | null; fixed_capital_rate_marginal: number | null;
  wacc: number | null; tax_rate: number | null; debt: number | null; non_operating_assets: number | null;
  shares: number | null; share_price: number | null;
};

const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : v.kind === "below_one" ? 0 : v.kind === "over_cap" ? 100 : null);

// 🔴 구코드·신코드 DriverResult가 구조적으로 같은 drivers 번들 모양을 공유하므로(fundamentals 필드 유무만 다름),
//   여기선 gap 계산에 필요한 최소 모양만 받는다 — 캐스팅 없이 양쪽 다 그대로 전달 가능.
type DriverResultLike =
  | { ok: true; drivers: { startingSales: number; salesGrowth: number; operatingMargin: number; startingMargin: number; workingCapitalRate: number; fixedCapitalRateMarginal: number | null } }
  | { ok: false };

function computeGapBundle(dr: DriverResultLike, rd: RdRow) {
  if (!dr.ok || dr.drivers.fixedCapitalRateMarginal == null || rd.wacc == null || rd.tax_rate == null || rd.share_price == null || rd.shares == null || rd.debt == null || rd.non_operating_assets == null) {
    return { verdict: null as string | null, gapYears: null as number | null, gapWaccMinus1: null as number | null, gapWaccPlus1: null as number | null };
  }
  const drv: RevDcfDrivers = { ...dr.drivers, taxRate: rd.tax_rate, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal };
  const market: RevDcfMarket = { wacc: rd.wacc, inflation: 0.025, sharePrice: rd.share_price, sharesOutstanding: rd.shares, debt: rd.debt, nonOperatingAssets: rd.non_operating_assets };
  const sens = computeGapWithSensitivity(drv, market, { maxYears: REVDCF_DEFAULT_MAX_YEARS });
  return {
    verdict: sens.base.kind,
    gapYears: sens.base.kind === "years" ? sens.base.gap : null,
    gapWaccMinus1: gnum(sens.waccMinus1),
    gapWaccPlus1: gnum(sens.waccPlus1),
  };
}

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!latest) throw new Error("revdcf_results 비어있음");
  const asOf = latest.as_of;
  const rows = await fetchAllRows<RdRow>(
    () => sb.from("revdcf_results").select("symbol,cik,verdict,skip_reason,gap_years,gap_wacc_minus1,gap_wacc_plus1,sales_growth,operating_margin,fixed_capital_rate_marginal,wacc,tax_rate,debt,non_operating_assets,shares,share_price").eq("as_of", asOf),
    [{ column: "symbol" }]
  );
  console.log(`대상: revdcf_results as_of=${asOf}, ${rows.length}건`);

  let checked = 0, missingCache = 0;
  const mismatches: { symbol: string; field: string; before: unknown; after: unknown }[] = [];
  const FIELDS = ["verdict", "gapYears", "gapWaccMinus1", "gapWaccPlus1", "salesGrowth", "operatingMargin", "fixedCapitalRateMarginal", "wacc"] as const;

  for (const rd of rows) {
    if (!rd.symbol) continue;
    const p = `${CACHE_DIR}/${rd.symbol}.json`;
    if (!fs.existsSync(p)) { missingCache++; continue; }
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const gaap = raw.facts?.["us-gaap"] ?? {};
    const dei = raw.facts?.["dei"] ?? {};

    const drOld = computeDriversOld(gaap, dei);
    const drNew = computeDriversNew(gaap, dei);
    checked++;

    // wacc는 두 경로 다 동일하게 저장된 rd.wacc를 그대로 쓴다(시장 조립 재현 범위 밖 — driver 변경과 무관해야
    //   함을 확인하는 게 목적이므로 애초에 상수로 고정) — 여기선 오직 driver 값에서 파생되는 넷만 재계산한다.
    const gapOld = computeGapBundle(drOld, rd);
    const gapNew = computeGapBundle(drNew, rd);

    const before: Record<string, unknown> = {
      verdict: gapOld.verdict, gapYears: gapOld.gapYears, gapWaccMinus1: gapOld.gapWaccMinus1, gapWaccPlus1: gapOld.gapWaccPlus1,
      salesGrowth: drOld.ok ? drOld.drivers.salesGrowth : null, operatingMargin: drOld.ok ? drOld.drivers.operatingMargin : null,
      fixedCapitalRateMarginal: drOld.ok ? drOld.drivers.fixedCapitalRateMarginal : null, wacc: rd.wacc,
    };
    const after: Record<string, unknown> = {
      verdict: gapNew.verdict, gapYears: gapNew.gapYears, gapWaccMinus1: gapNew.gapWaccMinus1, gapWaccPlus1: gapNew.gapWaccPlus1,
      salesGrowth: drNew.ok ? drNew.drivers.salesGrowth : null, operatingMargin: drNew.ok ? drNew.drivers.operatingMargin : null,
      fixedCapitalRateMarginal: drNew.ok ? drNew.drivers.fixedCapitalRateMarginal : null, wacc: rd.wacc,
    };

    for (const f of FIELDS) {
      if (JSON.stringify(before[f]) !== JSON.stringify(after[f])) mismatches.push({ symbol: rd.symbol, field: f, before: before[f], after: after[f] });
    }
  }

  console.log(`검사: ${checked}건, 캐시 없음: ${missingCache}, 불일치: ${mismatches.length}`);
  const out = { asOf, totalRows: rows.length, checked, missingCache, mismatchCount: mismatches.length, mismatches };
  fs.writeFileSync("docs/probe_1055_invariance.json", JSON.stringify(out, null, 2));
  if (mismatches.length > 0) {
    console.log("🔴 불일치 발견 — 상위 10건:");
    console.log(JSON.stringify(mismatches.slice(0, 10), null, 2));
  } else {
    console.log("✅ 불일치 0건 — 전제①·② 성립.");
  }
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
