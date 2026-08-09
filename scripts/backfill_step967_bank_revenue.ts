// STEP 967 §4-3 — 은행형 매출 폴백 백필(스크립트 1회, 크론 아님). as_of='2026-08-08' 고정 창.
// 🔴 대상 = fiscal_year가 null이었고 이번에 flags.revenuePath==='bank'로 fundamentals가 채워진 종목만(§4-2 실측 19건).
//   그 외 930행은 §4-1 불변확인(불일치 0건)으로 무접촉이 보장됨 — 이 스크립트는 그 930행을 다시 계산하지 않는다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeDrivers } from "../lib/revdcf/drivers";
import { computeValuation, VALUATION_SPEC } from "../lib/valuation";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const CACHE_DIR = "docs/probe_951_cache";
const AS_OF = "2026-08-08";

type FundRow = {
  symbol: string; cik: number; fiscal_year: number | null;
  net_income: number | null; equity: number | null; common_equity: number | null; preferred_stock: number | null; minority_interest: number | null;
  revenue: number | null; operating_income: number | null; dna: number | null;
  debt: number | null; non_operating_assets: number | null; shares: number | null;
  source_tags: Record<string, string> | null; unavailable_reason: string | null; fetched_at: string | null;
};

async function main() {
  const sb = createAdminClient();

  console.log("§4-3 스냅샷...");
  const before = await fetchAllRows<FundRow>(
    () => sb.from("us_fundamentals").select("symbol,cik,fiscal_year,net_income,equity,common_equity,preferred_stock,minority_interest,revenue,operating_income,dna,debt,non_operating_assets,shares,source_tags,unavailable_reason,fetched_at"),
    [{ column: "symbol" }]
  );
  console.log(`us_fundamentals 현재 ${before.length}행`);
  // 🔴 us_fundamentals_snapshot 테이블은 common_equity·preferred_stock·minority_interest 컬럼이 없다
  //   (STEP963의 pre_step963 스냅샷도 그 세 컬럼 없이 저장됨 — 그 컬럼들이 생기기 전 시점의 스냅샷이라 동일 관행).
  const snapRows = before.map(({ common_equity: _ce, preferred_stock: _ps, minority_interest: _mi, ...rest }) => ({ ...rest, snapshot_tag: "pre_step967" }));
  let snapSaved = 0;
  for (let i = 0; i < snapRows.length; i += 1000) { const batch = snapRows.slice(i, i + 1000); const { error } = await sb.from("us_fundamentals_snapshot").insert(batch); if (error) { console.error("🔴 스냅샷 실패", error); process.exit(1); } snapSaved += batch.length; }
  console.log(`스냅샷 저장 ${snapSaved}행(tag=pre_step967)`);

  const targets = before.filter((r) => r.fiscal_year == null);
  console.log(`\n대상(fiscal_year null) ${targets.length}행 재계산...`);
  const updates: { symbol: string; fund: FundRow; computed: ReturnType<typeof computeDrivers> }[] = [];
  let skippedNoCache = 0, skippedNotBank = 0;

  for (const row of targets) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { skippedNoCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};
    const dei = facts?.facts?.["dei"] ?? {};
    const r = computeDrivers(gaap, dei);
    if (r.flags.revenuePath !== "bank" || r.fundamentals.fiscalYear == null) { skippedNotBank++; continue; }
    updates.push({ symbol: row.symbol, fund: row, computed: r });
  }
  console.log(`은행형 폴백으로 fundamentals 확보 ${updates.length}행(캐시없음 ${skippedNoCache}, 은행경로아님/미확보 ${skippedNotBank})`);

  console.log("\nus_fundamentals 갱신...");
  const fundUpsertRows = updates.map(({ symbol, fund: b, computed: r }) => ({
    symbol: b.symbol, cik: b.cik, fiscal_year: r.fundamentals.fiscalYear,
    net_income: r.fundamentals.netIncome, equity: r.fundamentals.equity, revenue: r.fundamentals.revenue,
    operating_income: r.fundamentals.operatingIncome, dna: r.fundamentals.dna,
    debt: b.debt, non_operating_assets: b.non_operating_assets, shares: b.shares, // 967은 revenue 게이트만 다룬다 — driver5 게이트(NOT_APPLICABLE_SECTOR)는 여전히 실패이므로 market 부분은 원래대로 미확보(null) 유지
    common_equity: r.fundamentals.commonEquity, preferred_stock: r.fundamentals.preferredStock, minority_interest: r.fundamentals.minorityInterest,
    source_tags: r.fundamentals.sourceTags, unavailable_reason: (r as { skipReason?: string }).skipReason ?? b.unavailable_reason,
    fetched_at: b.fetched_at,
  }));
  let fundSaved = 0;
  for (let i = 0; i < fundUpsertRows.length; i += 500) { const batch = fundUpsertRows.slice(i, i + 500); const { error } = await sb.from("us_fundamentals").upsert(batch, { onConflict: "symbol" }); if (error) { console.error("🔴 us_fundamentals 갱신 실패", error); process.exit(1); } fundSaved += batch.length; }
  console.log(`us_fundamentals 갱신 ${fundSaved}행`);

  console.log("\nus_valuation 재계산...");
  const valRows = await fetchAllRows<{ symbol: string; price: number | null; market_cap: number | null; fundamentals_age_days: number | null }>(
    () => sb.from("us_valuation").select("symbol, price, market_cap, fundamentals_age_days").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const valBySym = new Map(valRows.map((r) => [r.symbol, r]));
  const newValRows: Record<string, unknown>[] = [];
  for (const { symbol, computed: r } of updates) {
    const v = valBySym.get(symbol);
    if (!v) continue; // us_valuation 행 자체가 없으면(197건 전부 있어야 하나 방어적으로) 손대지 않는다
    const cv = computeValuation({
      marketCap: v.market_cap, netIncome: r.fundamentals.netIncome, equity: r.fundamentals.commonEquity,
      revenue: r.fundamentals.revenue, operatingIncome: r.fundamentals.operatingIncome, dna: r.fundamentals.dna,
      debt: null, nonOperatingAssets: null, // driver5 게이트 실패라 debt·비영업자산 미확보(963 route.ts와 동일 조건 — MISSING_MARKET_DATA로 EV/EBITDA만 자연히 unavailable)
    });
    newValRows.push({
      as_of: AS_OF, symbol, price: v.price, market_cap: v.market_cap,
      per: cv.per, pbr: cv.pbr, psr: cv.psr, ev_ebitda: cv.evEbitda, ev: cv.ev, ebitda: cv.ebitda,
      per_basis: VALUATION_SPEC.per.basis, fundamentals_fiscal_year: r.fundamentals.fiscalYear, fundamentals_age_days: v.fundamentals_age_days,
      unavailable: cv.unavailable,
    });
  }
  let valSaved = 0;
  for (let i = 0; i < newValRows.length; i += 1000) { const batch = newValRows.slice(i, i + 1000); const { error } = await sb.from("us_valuation").upsert(batch, { onConflict: "as_of,symbol" }); if (error) { console.error("🔴 us_valuation 갱신 실패", error); process.exit(1); } valSaved += batch.length; }
  console.log(`us_valuation 갱신 ${valSaved}행`);

  console.log("\nus_sector_relative 재계산(전체 1,127, 순수함수 재사용)...");
  const freshVal = await fetchAllRows<{ symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }>(
    () => sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const valuations: ValuationInput[] = freshVal.map((r) => ({ symbol: r.symbol, per: r.per, pbr: r.pbr, psr: r.psr, evEbitda: r.ev_ebitda }));
  const sectors: SectorInput[] = sectorRows.map((r) => ({ symbol: r.symbol, sector: r.sector }));
  const relResults = computeSectorRelativeBatch(valuations, sectors, SECTOR_RELATIVE_SPEC.minSample);
  const relRows = relResults.map((r) => ({
    as_of: AS_OF, symbol: r.symbol, sector: r.sector,
    per_pct: r.perPct, pbr_pct: r.pbrPct, psr_pct: r.psrPct, ev_ebitda_pct: r.evEbitdaPct,
    per_n: r.perN, pbr_n: r.pbrN, psr_n: r.psrN, ev_ebitda_n: r.evEbitdaN,
    unavailable: r.unavailable, min_sample: r.minSample, updated_at: new Date().toISOString(),
  }));
  let relSaved = 0;
  for (let i = 0; i < relRows.length; i += 1000) { const batch = relRows.slice(i, i + 1000); const { error } = await sb.from("us_sector_relative").upsert(batch, { onConflict: "as_of,symbol" }); if (error) { console.error("🔴 us_sector_relative 갱신 실패", error); process.exit(1); } relSaved += batch.length; }
  console.log(`us_sector_relative 갱신 ${relSaved}행`);

  fs.writeFileSync("docs/probe_967_backfill_result.json", JSON.stringify({ snapSaved, targetsTotal: targets.length, skippedNoCache, skippedNotBank, recoveredCount: updates.length, recoveredSymbols: updates.map((u) => u.symbol), fundSaved, valSaved, relSaved }, null, 1));
  console.log("\n완료. 저장: docs/probe_967_backfill_result.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
