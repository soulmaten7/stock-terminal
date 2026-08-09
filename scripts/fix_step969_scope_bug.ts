// STEP 969 — 백필 직후 자체 발견한 결함 수정. backfill_step969_debt.ts가 fiscal_year만 조건으로 삼아
// "debt=null(=실제로는 더 앞선 게이트에서 이미 탈락 — shares·nonOperatingAssets도 전부 null)"이던 191종목에도
// 부채값을 단독으로 써 넣었다(다른 필드는 여전히 null인 채로 debt만 채워지는 모순 상태). 그 게이트 실패 사실을
// 무시하고 debt만 따로 계산한 것은 969의 범위 밖 — 원상복구한다(pre_step969 스냅샷으로 되돌림).
// 🔴 되돌리는 대상 = before.debt가 null이었던 행만(그 행들만 버그의 영향을 받음). before.debt가 0이거나
//   양수였던 행(진짜 969 대상)은 그대로 둔다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeValuation, VALUATION_SPEC } from "../lib/valuation";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const AS_OF = "2026-08-08";

async function main() {
  const backfillResult = JSON.parse(fs.readFileSync("docs/probe_969_backfill_result.json", "utf-8"));
  const buggySymbols: string[] = backfillResult.updates.filter((u: any) => u.before.debt == null).map((u: any) => u.symbol);
  console.log(`되돌릴 대상(버그 영향분) ${buggySymbols.length}건`);

  const sb = createAdminClient();
  const snap = await fetchAllRows<any>(
    () => sb.from("us_fundamentals_snapshot").select("*").eq("snapshot_tag", "pre_step969").in("symbol", buggySymbols),
    [{ column: "symbol" }]
  );
  console.log(`pre_step969 스냅샷에서 ${snap.length}건 확보`);
  if (snap.length !== buggySymbols.length) { console.error("🔴 스냅샷 건수 불일치 — 중단"); process.exit(1); }

  // 원상복구(us_fundamentals) — 스냅샷 그대로(snapshot_tag·captured_at 등 스냅샷 전용 컬럼 제외)
  const restoreRows = snap.map(({ snapshot_tag: _st, captured_at: _ca, id: _id, ...rest }) => rest);
  let restored = 0;
  for (let i = 0; i < restoreRows.length; i += 500) { const batch = restoreRows.slice(i, i + 500); const { error } = await sb.from("us_fundamentals").upsert(batch, { onConflict: "symbol" }); if (error) { console.error("🔴 복구 실패", error); process.exit(1); } restored += batch.length; }
  console.log(`us_fundamentals 복구 ${restored}행`);

  // us_valuation.ev_ebitda 재계산(원상복구된 재무로 다시 — debt·nonOperatingAssets null이면 자동 MISSING_MARKET_DATA)
  const valRows = await fetchAllRows<any>(
    () => sb.from("us_valuation").select("symbol, price, market_cap, per, pbr, psr, fundamentals_fiscal_year, fundamentals_age_days").eq("as_of", AS_OF).in("symbol", buggySymbols),
    [{ column: "symbol" }]
  );
  const snapBySym = new Map(snap.map((r) => [r.symbol, r]));
  const newValRows: Record<string, unknown>[] = [];
  for (const v of valRows) {
    const s = snapBySym.get(v.symbol);
    if (!s) continue;
    const cv = computeValuation({ marketCap: v.market_cap, netIncome: s.net_income, equity: s.equity, revenue: s.revenue, operatingIncome: s.operating_income, dna: s.dna, debt: s.debt, nonOperatingAssets: s.non_operating_assets });
    newValRows.push({
      as_of: AS_OF, symbol: v.symbol, price: v.price, market_cap: v.market_cap,
      per: v.per, pbr: v.pbr, psr: v.psr, ev_ebitda: cv.evEbitda, ev: cv.ev, ebitda: cv.ebitda,
      per_basis: VALUATION_SPEC.per.basis, fundamentals_fiscal_year: v.fundamentals_fiscal_year, fundamentals_age_days: v.fundamentals_age_days,
      unavailable: cv.unavailable,
    });
  }
  let valSaved = 0;
  for (let i = 0; i < newValRows.length; i += 1000) { const batch = newValRows.slice(i, i + 1000); const { error } = await sb.from("us_valuation").upsert(batch, { onConflict: "as_of,symbol" }); if (error) { console.error("🔴 us_valuation 복구 실패", error); process.exit(1); } valSaved += batch.length; }
  console.log(`us_valuation 복구 ${valSaved}행`);

  // us_sector_relative 전체 재계산(순수함수 재사용)
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
  for (let i = 0; i < relRows.length; i += 1000) { const batch = relRows.slice(i, i + 1000); const { error } = await sb.from("us_sector_relative").upsert(batch, { onConflict: "as_of,symbol" }); if (error) { console.error("🔴 us_sector_relative 재계산 실패", error); process.exit(1); } relSaved += batch.length; }
  console.log(`us_sector_relative 재계산 ${relSaved}행`);

  // 검증
  const check = await fetchAllRows<{ symbol: string; debt: number | null; shares: number | null }>(
    () => sb.from("us_fundamentals").select("symbol, debt, shares").in("symbol", buggySymbols),
    [{ column: "symbol" }]
  );
  const stillWrong = check.filter((r) => r.debt != null);
  console.log(`검증: 복구 후 debt가 여전히 non-null인 건(있으면 안 됨) = ${stillWrong.length}`);
  fs.writeFileSync("docs/probe_969_scope_fix.json", JSON.stringify({ buggySymbolsCount: buggySymbols.length, buggySymbols, restored, valSaved, relSaved, stillWrong }, null, 1));
  console.log("저장: docs/probe_969_scope_fix.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
