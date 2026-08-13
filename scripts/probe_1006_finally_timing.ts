// STEP 1006 P2 — revdcf route.ts의 finally 블록(valuation + sectorRelative) 구간별 계측.
// 🔴 읽기만 재현한다. upsert는 절대 호출하지 않는다. us_valuation·us_sector_relative·us_sector_wide 쓰기 0.
// 🔴 로컬 실행 — Vercel 실측 아님, 상대적 병목 위치 파악용.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { computeValuation, VALUATION_SPEC } from "../lib/valuation";
import { fetchAllRows } from "../lib/supabasePaging";
import { resolveSector } from "../lib/sector";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

function now() { return Date.now(); }

async function main() {
  const sb = createAdminClient();
  const timings: Record<string, number> = {};
  const t0 = now();

  // ── 구간1: valuation 재료 3종 전량 read ──────────────────────────────────
  const s1 = now();
  const fundRows: { symbol: string; cik: number; fiscal_year: number | null; net_income: number | null; equity: number | null; common_equity: number | null; revenue: number | null; operating_income: number | null; dna: number | null; debt: number | null; non_operating_assets: number | null; fetched_at: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_fundamentals").select("symbol,cik,fiscal_year,net_income,equity,common_equity,revenue,operating_income,dna,debt,non_operating_assets,fetched_at").range(f, f + 999); const c = (data ?? []) as typeof fundRows; fundRows.push(...c); if (c.length < 1000) break; }

  const mcapLatest = (await sb.from("us_market_cap").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const mcapRows: { symbol: string; market_cap: number }[] = [];
  if (mcapLatest) { for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").eq("as_of", mcapLatest.as_of).range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; } }
  const mcapBySym = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), r.market_cap]));

  const priceRows: { symbol: string; price: number | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_stock_perf").select("symbol, price").range(f, f + 999); const c = (data ?? []) as typeof priceRows; priceRows.push(...c); if (c.length < 1000) break; }
  const priceBySym = new Map(priceRows.map((r) => [r.symbol.toUpperCase(), r.price]));
  timings["1_valuation재료_3종_read"] = now() - s1;
  console.log(`[1] us_fundamentals=${fundRows.length}행 · us_market_cap=${mcapRows.length}행 · us_stock_perf=${priceRows.length}행 · ${timings["1_valuation재료_3종_read"]}ms`);

  // ── 구간2: valuation 행 조립(upsert 생략, payload 바이트만) ──────────────
  const s2 = now();
  const asOf = new Date().toISOString().slice(0, 10); // route.ts와 동일(오늘 날짜) — 실제 upsert는 안 함
  const rows = fundRows.map((f) => {
    const marketCap = mcapBySym.get(f.symbol.toUpperCase()) ?? null;
    const v = computeValuation({ marketCap, netIncome: f.net_income, equity: f.common_equity, revenue: f.revenue, operatingIncome: f.operating_income, dna: f.dna, debt: f.debt, nonOperatingAssets: f.non_operating_assets });
    const ageDays = f.fetched_at ? Math.round((Date.parse(asOf) - Date.parse(f.fetched_at)) / 86_400_000) : null;
    return {
      as_of: asOf, symbol: f.symbol, price: priceBySym.get(f.symbol.toUpperCase()) ?? null, market_cap: marketCap,
      per: v.per, pbr: v.pbr, psr: v.psr, ev_ebitda: v.evEbitda, ev: v.ev, ebitda: v.ebitda,
      per_basis: VALUATION_SPEC.per.basis, fundamentals_fiscal_year: f.fiscal_year, fundamentals_age_days: ageDays,
      unavailable: v.unavailable,
    };
  });
  let totalBytes = 0, batchCount = 0;
  for (let i = 0; i < rows.length; i += 1000) { const batch = rows.slice(i, i + 1000); totalBytes += Buffer.byteLength(JSON.stringify(batch)); batchCount++; }
  timings["2_valuation_행조립"] = now() - s2;
  console.log(`[2] rows=${rows.length} · batches=${batchCount} · totalPayloadBytes=${totalBytes}(${(totalBytes / 1024 / 1024).toFixed(2)}MB) · ${timings["2_valuation_행조립"]}ms (upsert 생략)`);

  // ── 구간3: us_valuation 전량 read(기존 최신 as_of 기준, 실제 오늘 쓴 게 없으므로 대체) + us_sector_wide 최신 as_of ──
  const s3 = now();
  const valLatest = (await sb.from("us_valuation").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const valuationRows = valLatest
    ? await fetchAllRows<{ symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }>(
        () => sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", valLatest.as_of),
        [{ column: "symbol" }]
      )
    : [];
  const latestSector = (await sb.from("us_sector_wide").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  timings["3_usvaluation_read_plus_sectorwide_asof"] = now() - s3;
  console.log(`[3] us_valuation(as_of=${valLatest?.as_of})=${valuationRows.length}행 · us_sector_wide 최신 as_of=${latestSector?.as_of} · ${timings["3_usvaluation_read_plus_sectorwide_asof"]}ms`);

  if (!latestSector) { console.error("🔴 us_sector_wide 행 없음 — 이후 단계 스킵"); printSummary(timings, t0); return; }
  const sectorAsOf = latestSector.as_of;

  // ── 구간4: missingSymbols 산출 → resolveSector 실제 호출(외부 네트워크 0, Supabase read만) ──
  const s4a = now();
  const existingSectorSymbols = await fetchAllRows<{ symbol: string }>(
    () => sb.from("us_sector_wide").select("symbol").eq("as_of", sectorAsOf),
    [{ column: "symbol" }]
  );
  const existingSet = new Set(existingSectorSymbols.map((r) => r.symbol));
  const missingSymbols = valuationRows.map((r) => r.symbol).filter((s) => !existingSet.has(s));
  const s4b = now();
  let resolveSectorError: string | null = null;
  let resolvedCount = 0;
  try {
    if (missingSymbols.length > 0) {
      const resolved = await resolveSector(sb, missingSymbols);
      resolvedCount = resolved.size;
    }
  } catch (e) {
    resolveSectorError = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  }
  timings["4a_missingSymbols_산출"] = s4b - s4a;
  timings["4b_resolveSector_호출"] = now() - s4b;
  console.log(`[4a] existingSectorSymbols=${existingSectorSymbols.length}행 · missingSymbols=${missingSymbols.length}건 · ${timings["4a_missingSymbols_산출"]}ms`);
  console.log(`[4b] resolveSector(${missingSymbols.length}건) → resolved=${resolvedCount}건 · ${timings["4b_resolveSector_호출"]}ms${resolveSectorError ? ` · 🔴 예외: ${resolveSectorError}` : ""}`);

  // ── 구간5: computeSectorRelativeBatch 계산 ───────────────────────────────
  const s5 = now();
  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", sectorAsOf),
    [{ column: "symbol" }]
  );
  const valuations: ValuationInput[] = valuationRows.map((r) => ({ symbol: r.symbol, per: r.per, pbr: r.pbr, psr: r.psr, evEbitda: r.ev_ebitda }));
  const sectors: SectorInput[] = sectorRows.map((r) => ({ symbol: r.symbol, sector: r.sector }));
  const results = computeSectorRelativeBatch(valuations, sectors, SECTOR_RELATIVE_SPEC.minSample);
  timings["5_sectorRows_read_plus_batch계산"] = now() - s5;
  console.log(`[5] sectorRows=${sectorRows.length}행 · results=${results.length}행 · ${timings["5_sectorRows_read_plus_batch계산"]}ms`);

  // ── 구간6: sector_relative 행 조립(upsert 생략, payload 바이트만) ────────
  const s6 = now();
  const dbRows = results.map((r) => ({
    as_of: asOf, symbol: r.symbol, sector: r.sector, sector_as_of: sectorAsOf,
    per_pct: r.perPct, pbr_pct: r.pbrPct, psr_pct: r.psrPct, ev_ebitda_pct: r.evEbitdaPct,
    per_rel: r.perRel, pbr_rel: r.pbrRel, psr_rel: r.psrRel, ev_ebitda_rel: r.evEbitdaRel,
    per_med: r.perMed, pbr_med: r.pbrMed, psr_med: r.psrMed, ev_ebitda_med: r.evEbitdaMed,
    per_n: r.perN, pbr_n: r.pbrN, psr_n: r.psrN, ev_ebitda_n: r.evEbitdaN,
    unavailable: r.unavailable, min_sample: r.minSample,
    updated_at: new Date().toISOString(),
  })); // route.ts:145-153와 필드 동일(payload 바이트 정확도용, upsert는 안 함)
  let srBytes = 0, srBatches = 0;
  for (let i = 0; i < dbRows.length; i += 1000) { const batch = dbRows.slice(i, i + 1000); srBytes += Buffer.byteLength(JSON.stringify(batch)); srBatches++; }
  timings["6_sectorRelative_행조립"] = now() - s6;
  console.log(`[6] dbRows=${dbRows.length} · batches=${srBatches} · totalPayloadBytes=${srBytes}(${(srBytes / 1024 / 1024).toFixed(2)}MB) · ${timings["6_sectorRelative_행조립"]}ms (upsert 생략)`);

  printSummary(timings, t0);
}

function printSummary(timings: Record<string, number>, t0: number) {
  const total = Date.now() - t0;
  console.log("\n=== SUMMARY(로컬 기준 — Vercel 실측 아님) ===");
  console.log(JSON.stringify(timings, null, 2));
  console.log(`누적 = ${total}ms (${(total / 1000).toFixed(1)}s)`);
  console.log(`BUDGET_MS(270,000ms) 소진 후 남는 예산(300s−270s=30s=30,000ms) 대비 = ${total > 30_000 ? "🔴 초과" : "✅ 이내"}`);
}

main().catch((e) => { console.error("🔴 예외", e); process.exit(1); });
