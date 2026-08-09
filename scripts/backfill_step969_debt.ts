// STEP 969 §5 — 부채 태그 확장 백필(스크립트 1회, 크론 아님). as_of='2026-08-08' 고정 창.
// 🔴 pinned-year 방식(963/967과 동일 방법론) — 저장된 fiscal_year에 고정 재추출한다. computeDrivers()를
//   그대로 부르면 오늘 기준 최신연도로 재해석돼(예: GM 2024→2025) 969와 무관한 window drift가 섞인다(963 §3
//   1차시도결함과 동일 함정 — 이번엔 사전에 §4 impact 스크립트에서 겪고 나서 백필은 처음부터 pinned로 설계).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import {
  coalesceMap, annualMap,
  DEBT_LT, DEBT_CUR, FIN_LEASE, DEBT_TOTAL_SINGLE, DEBT_KNOWN_TAGS, DEBT_KEYWORD_RE, DEBT_NOISE_RE,
  type Gaap,
} from "../lib/revdcf/drivers";
import { computeValuation, VALUATION_SPEC } from "../lib/valuation";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const CACHE_DIR = "docs/probe_951_cache";
const AS_OF = "2026-08-08";

// sumMaps는 drivers.ts에서 export 안 됨(모듈 내부용) — 969는 단일 연도(스칼라)만 다루므로 그 자리에서 직접 합산(로직 동일, 재구현 아님).
function sumAt(y: number, ...ms: Record<number, number>[]): number | null {
  let s: number | null = null;
  for (const m of ms) if (m[y] != null) s = (s ?? 0) + m[y];
  return s;
}

type FundRow = {
  symbol: string; cik: number; fiscal_year: number | null; debt: number | null; unavailable_reason: string | null;
  net_income: number | null; equity: number | null; common_equity: number | null; preferred_stock: number | null; minority_interest: number | null;
  revenue: number | null; operating_income: number | null; dna: number | null;
  non_operating_assets: number | null; shares: number | null; source_tags: Record<string, string> | null; fetched_at: string | null;
};

function pinnedDebt(gaap: Gaap, ly: number): { debt: number | null; debtBasis: "tagged" | "none" | "unresolved"; tag: string | null; unresolvedTags: string[] } {
  // drivers.ts의 debtMap 로직(코알레스 우선 단일태그 → 없으면 LT+CUR+금융리스 부분합)을 단일 연도(ly)에 그대로 재현.
  //   sumMaps와 동일 의미: 셋 중 하나라도 그 해 값이 있으면 있는 것만 더한다(전부 없을 때만 결측).
  const singleCo = coalesceMap(gaap, DEBT_TOTAL_SINGLE, "stock");
  const ltCo = coalesceMap(gaap, DEBT_LT, "stock");
  const curCo = coalesceMap(gaap, DEBT_CUR, "stock");
  const finLeaseCo = sumAt(ly, annualMap(gaap, FIN_LEASE[0], "stock"), annualMap(gaap, FIN_LEASE[1], "stock"));
  const finLeaseMap = finLeaseCo != null ? { [ly]: finLeaseCo } : {};
  const summed = sumAt(ly, ltCo.vals, curCo.vals, finLeaseMap);
  const value = singleCo.vals[ly] ?? summed;
  if (value != null) {
    const tag = singleCo.vals[ly] != null ? (singleCo.tagAt[ly] ?? "single") : "combined(LT+CUR+lease)";
    return { debt: value, debtBasis: "tagged", tag, unresolvedTags: [] };
  }
  const unresolvedTags: string[] = [];
  for (const tag of Object.keys(gaap)) {
    if (DEBT_KNOWN_TAGS.has(tag) || !DEBT_KEYWORD_RE.test(tag) || DEBT_NOISE_RE.test(tag)) continue;
    const m = annualMap(gaap, tag, "stock");
    if (m[ly] != null) unresolvedTags.push(tag);
  }
  if (unresolvedTags.length > 0) return { debt: null, debtBasis: "unresolved", tag: null, unresolvedTags };
  return { debt: 0, debtBasis: "none", tag: null, unresolvedTags: [] };
}

async function main() {
  const sb = createAdminClient();

  console.log("§5-2 스냅샷...");
  const before = await fetchAllRows<FundRow>(
    () => sb.from("us_fundamentals").select("symbol,cik,fiscal_year,debt,unavailable_reason,net_income,equity,common_equity,preferred_stock,minority_interest,revenue,operating_income,dna,non_operating_assets,shares,source_tags,fetched_at"),
    [{ column: "symbol" }]
  );
  console.log(`us_fundamentals 현재 ${before.length}행`);
  const snapRows = before.map(({ common_equity: _ce, preferred_stock: _ps, minority_interest: _mi, ...rest }) => ({ ...rest, snapshot_tag: "pre_step969" }));
  let snapSaved = 0;
  for (let i = 0; i < snapRows.length; i += 1000) { const batch = snapRows.slice(i, i + 1000); const { error } = await sb.from("us_fundamentals_snapshot").insert(batch); if (error) { console.error("🔴 스냅샷 실패", error); process.exit(1); } snapSaved += batch.length; }
  console.log(`스냅샷 저장 ${snapSaved}행(tag=pre_step969)`);

  const targets = before.filter((r) => r.fiscal_year != null);
  console.log(`\n대상(fiscal_year 확보) ${targets.length}행 재계산(pinned-year)...`);
  const updates: { symbol: string; before: FundRow; debt: number | null; debtBasis: string; tag: string | null; unresolvedTags: string[] }[] = [];
  let skippedNoCache = 0, unchanged = 0;

  for (const row of targets) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { skippedNoCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = (facts?.facts?.["us-gaap"] ?? {}) as Gaap;
    const ly = row.fiscal_year as number;
    const r = pinnedDebt(gaap, ly);
    if (r.debt === row.debt) { unchanged++; continue; } // 값이 같으면(대부분) 건드리지 않음
    updates.push({ symbol: row.symbol, before: row, debt: r.debt, debtBasis: r.debtBasis, tag: r.tag, unresolvedTags: r.unresolvedTags });
  }
  console.log(`값 변화 ${updates.length}행(캐시없음 ${skippedNoCache}, 변화없음 ${unchanged})`);
  const toValue = updates.filter((u) => u.debt != null && u.debt > 0);
  const toUnresolved = updates.filter((u) => u.debtBasis === "unresolved");
  console.log(`  0→값 ${toValue.length}건 · 0→모름(UNRESOLVED_DEBT) ${toUnresolved.length}건`);

  console.log("\nus_fundamentals 갱신...");
  const fundUpsertRows = updates.map((u) => {
    const b = u.before;
    const sourceTags = { ...(b.source_tags ?? {}) };
    if (u.tag) sourceTags.debt = u.tag; else delete sourceTags.debt;
    return {
      symbol: b.symbol, cik: b.cik, fiscal_year: b.fiscal_year,
      net_income: b.net_income, equity: b.equity, common_equity: b.common_equity, preferred_stock: b.preferred_stock, minority_interest: b.minority_interest,
      revenue: b.revenue, operating_income: b.operating_income, dna: b.dna,
      debt: u.debt, non_operating_assets: b.non_operating_assets, shares: b.shares,
      source_tags: sourceTags,
      unavailable_reason: u.debtBasis === "unresolved" ? "UNRESOLVED_DEBT" : b.unavailable_reason,
      fetched_at: b.fetched_at,
    };
  });
  let fundSaved = 0;
  for (let i = 0; i < fundUpsertRows.length; i += 500) { const batch = fundUpsertRows.slice(i, i + 500); const { error } = await sb.from("us_fundamentals").upsert(batch, { onConflict: "symbol" }); if (error) { console.error("🔴 us_fundamentals 갱신 실패", error); process.exit(1); } fundSaved += batch.length; }
  console.log(`us_fundamentals 갱신 ${fundSaved}행`);

  console.log("\nus_valuation ev_ebitda 재계산(debt 바뀐 종목만)...");
  const valRows = await fetchAllRows<{ symbol: string; price: number | null; market_cap: number | null; per: number | null; pbr: number | null; psr: number | null; fundamentals_fiscal_year: number | null; fundamentals_age_days: number | null }>(
    () => sb.from("us_valuation").select("symbol, price, market_cap, per, pbr, psr, fundamentals_fiscal_year, fundamentals_age_days").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const valBySym = new Map(valRows.map((r) => [r.symbol, r]));
  const newValRows: Record<string, unknown>[] = [];
  for (const u of updates) {
    const v = valBySym.get(u.symbol);
    if (!v) continue;
    const b = u.before;
    const cv = computeValuation({ marketCap: v.market_cap, netIncome: b.net_income, equity: b.common_equity, revenue: b.revenue, operatingIncome: b.operating_income, dna: b.dna, debt: u.debt, nonOperatingAssets: b.non_operating_assets });
    newValRows.push({
      as_of: AS_OF, symbol: u.symbol, price: v.price, market_cap: v.market_cap,
      per: v.per, pbr: v.pbr, psr: v.psr, ev_ebitda: cv.evEbitda, ev: cv.ev, ebitda: cv.ebitda, // per·pbr·psr은 debt와 무관 — 저장값 그대로 재사용
      per_basis: VALUATION_SPEC.per.basis, fundamentals_fiscal_year: v.fundamentals_fiscal_year, fundamentals_age_days: v.fundamentals_age_days,
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

  fs.writeFileSync("docs/probe_969_backfill_result.json", JSON.stringify({ snapSaved, targetsTotal: targets.length, skippedNoCache, unchanged, updatesCount: updates.length, toValueCount: toValue.length, toUnresolvedCount: toUnresolved.length, updates, fundSaved, valSaved, relSaved }, null, 1));
  console.log("\n완료. 저장: docs/probe_969_backfill_result.json");
  console.log("\n🔴 revdcf_results는 건드리지 않았다 — 08-08 행은 옛 debt 기준으로 남는다(다음 정규 크론이 새 코드로 다시 씀).");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
