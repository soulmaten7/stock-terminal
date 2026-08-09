// STEP 963 §4 — 백필(스크립트, 크론 아님). as_of='2026-08-08' 고정 창에 새 정의(보통주 기준)를 적용한다.
// 🔴 pinned-year 방식(§3에서 검증한 것과 동일 로직) — computeDrivers()를 그대로 부르면 "오늘 기준 최신 연도"로
//   재해석돼 옛 창과 섞인다(§3 1차 시도 결함과 동일 함정). annualMap/coalesceMap을 저장된 fiscal_year에 고정해 재사용.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { annualMap, coalesceMap, NET_INCOME, EQUITY, PREFERRED, NCI, type Gaap } from "../lib/revdcf/drivers";
import { computeValuation, VALUATION_SPEC } from "../lib/valuation";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const CACHE_DIR = "docs/probe_951_cache";
const AS_OF = "2026-08-08";

type FundRow = {
  symbol: string; cik: number; fiscal_year: number | null;
  net_income: number | null; equity: number | null; revenue: number | null; operating_income: number | null; dna: number | null;
  debt: number | null; non_operating_assets: number | null; shares: number | null;
  source_tags: Record<string, string> | null; unavailable_reason: string | null; fetched_at: string | null;
};
type ValRow = { symbol: string; price: number | null; market_cap: number | null; fundamentals_fiscal_year: number | null; fundamentals_age_days: number | null };

async function main() {
  const sb = createAdminClient();

  // §4-3 — 적재 전 스냅샷(구 컬럼만, 새 컬럼은 아직 전부 null이라 찍을 게 없음).
  console.log("§4-3 스냅샷...");
  const before = await fetchAllRows<FundRow>(
    () => sb.from("us_fundamentals").select("symbol,cik,fiscal_year,net_income,equity,revenue,operating_income,dna,debt,non_operating_assets,shares,source_tags,unavailable_reason,fetched_at"),
    [{ column: "symbol" }]
  );
  console.log(`us_fundamentals 현재 ${before.length}행`);
  const snapRows = before.map((r) => ({ ...r, snapshot_tag: "pre_step963" }));
  let snapSaved = 0;
  for (let i = 0; i < snapRows.length; i += 1000) { const batch = snapRows.slice(i, i + 1000); const { error } = await sb.from("us_fundamentals_snapshot").insert(batch); if (error) { console.error("🔴 스냅샷 실패", error); process.exit(1); } snapSaved += batch.length; }
  console.log(`스냅샷 저장 ${snapSaved}행(tag=pre_step963)`);

  // §4-1 — 새 정의 재계산(메모리).
  console.log("\n재계산...");
  const updates: { symbol: string; net_income: number | null; common_equity: number | null; preferred_stock: number | null; minority_interest: number | null; source_tags: Record<string, string> }[] = [];
  let skippedNoFy = 0, skippedNoCache = 0;
  for (const row of before) {
    if (row.fiscal_year == null) { skippedNoFy++; continue; }
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { skippedNoCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = (facts?.facts?.["us-gaap"] ?? {}) as Gaap;
    const ly = row.fiscal_year;

    const niCo = coalesceMap(gaap, NET_INCOME, "flow");
    const eqCo = coalesceMap(gaap, EQUITY, "stock");
    const prefCo = coalesceMap(gaap, PREFERRED, "stock");
    const nciCo = coalesceMap(gaap, NCI, "stock");

    const newNetIncome = niCo.vals[ly] ?? null;
    const newNiTag = niCo.tagAt[ly] ?? null;
    const eqVal = eqCo.vals[ly] ?? null;
    const eqTag = eqCo.tagAt[ly] ?? null;
    const prefVal = prefCo.vals[ly] ?? null;
    const prefTag = prefCo.tagAt[ly] ?? null;
    const nciVal = nciCo.vals[ly] ?? null;
    const nciTag = nciCo.tagAt[ly] ?? null;

    let commonEquity: number | null = null;
    if (eqVal != null) {
      commonEquity = eqTag === "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"
        ? (nciVal != null ? eqVal - nciVal : eqVal)
        : eqVal;
      commonEquity = commonEquity - (prefVal ?? 0);
    }

    const sourceTags = { ...(row.source_tags ?? {}) };
    if (newNiTag) sourceTags.netIncome = newNiTag; else delete sourceTags.netIncome;
    if (prefTag) sourceTags.preferredStock = prefTag;
    if (nciTag) sourceTags.minorityInterest = nciTag;

    updates.push({ symbol: row.symbol, net_income: newNetIncome, common_equity: commonEquity, preferred_stock: prefVal, minority_interest: nciVal, source_tags: sourceTags });
  }
  console.log(`재계산 완료 ${updates.length}행, fiscal_year없음 스킵 ${skippedNoFy}, 캐시없음 스킵 ${skippedNoCache}`);

  // §4-1 계속 — us_fundamentals UPDATE(symbol PK upsert, 다른 컬럼은 안 건드리게 병합).
  console.log("\nus_fundamentals 갱신...");
  const beforeBySym = new Map(before.map((r) => [r.symbol, r]));
  const fundUpsertRows = updates.map((u) => {
    const b = beforeBySym.get(u.symbol)!;
    return {
      symbol: b.symbol, cik: b.cik, fiscal_year: b.fiscal_year,
      net_income: u.net_income, equity: b.equity, revenue: b.revenue, operating_income: b.operating_income, dna: b.dna,
      debt: b.debt, non_operating_assets: b.non_operating_assets, shares: b.shares,
      common_equity: u.common_equity, preferred_stock: u.preferred_stock, minority_interest: u.minority_interest,
      source_tags: u.source_tags, unavailable_reason: b.unavailable_reason, fetched_at: b.fetched_at,
    };
  });
  let fundSaved = 0;
  for (let i = 0; i < fundUpsertRows.length; i += 500) { const batch = fundUpsertRows.slice(i, i + 500); const { error } = await sb.from("us_fundamentals").upsert(batch, { onConflict: "symbol" }); if (error) { console.error("🔴 us_fundamentals 갱신 실패", error); process.exit(1); } fundSaved += batch.length; }
  console.log(`us_fundamentals 갱신 ${fundSaved}행`);

  // §4-1 계속 — us_valuation 재계산(같은 as_of, price·market_cap은 기존 값 그대로 — 시점 오염 방지).
  console.log("\nus_valuation 재계산...");
  const valRows = await fetchAllRows<ValRow>(
    () => sb.from("us_valuation").select("symbol, price, market_cap, fundamentals_fiscal_year, fundamentals_age_days").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const valBySym = new Map(valRows.map((r) => [r.symbol, r]));
  const fundBySym = new Map(fundUpsertRows.map((r) => [r.symbol, r]));
  const newValRows: Record<string, unknown>[] = [];
  for (const v of valRows) {
    const f = fundBySym.get(v.symbol);
    if (!f) continue; // 새 정의 재계산 대상이 아닌 행(fiscal_year 없음 등) — 기존 us_valuation 행 그대로 둔다(터치 안 함)
    const cv = computeValuation({ marketCap: v.market_cap, netIncome: f.net_income, equity: f.common_equity, revenue: f.revenue, operatingIncome: f.operating_income, dna: f.dna, debt: f.debt, nonOperatingAssets: f.non_operating_assets });
    newValRows.push({
      as_of: AS_OF, symbol: v.symbol, price: v.price, market_cap: v.market_cap,
      per: cv.per, pbr: cv.pbr, psr: cv.psr, ev_ebitda: cv.evEbitda, ev: cv.ev, ebitda: cv.ebitda,
      per_basis: VALUATION_SPEC.per.basis, fundamentals_fiscal_year: v.fundamentals_fiscal_year, fundamentals_age_days: v.fundamentals_age_days,
      unavailable: cv.unavailable,
    });
  }
  let valSaved = 0;
  for (let i = 0; i < newValRows.length; i += 1000) { const batch = newValRows.slice(i, i + 1000); const { error } = await sb.from("us_valuation").upsert(batch, { onConflict: "as_of,symbol" }); if (error) { console.error("🔴 us_valuation 갱신 실패", error); process.exit(1); } valSaved += batch.length; }
  console.log(`us_valuation 갱신 ${valSaved}행(대상 없던 ${valRows.length - newValRows.length}행은 무접촉)`);

  // §4-2 — us_sector_relative 재계산(순수 함수 재사용, 로직 복제 없음).
  console.log("\nus_sector_relative 재계산...");
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

  console.log("\n완료.");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
