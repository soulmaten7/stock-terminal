// STEP 973 §2 — as_of='2026-08-09'의 us_sector_relative 복구(스크립트 1회, 크론 아님).
// 🔴 로직은 computeSectorRelativeBatch()(lib/sectorRelativeBatch.ts) 그대로 재사용 — 복제하지 않는다.
// 🔴 route.ts 수정분과 같은 원칙: us_sector_wide는 "최신 as_of"를 그대로 쓴다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const AS_OF = "2026-08-09";

async function main() {
  const sb = createAdminClient();

  const valuationRows = await fetchAllRows<{ symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }>(
    () => sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  console.log(`us_valuation as_of=${AS_OF}: ${valuationRows.length}행`);

  const latestSector = (await sb.from("us_sector_wide").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!latestSector) throw new Error("us_sector_wide가 비어있음");
  const sectorAsOf = latestSector.as_of;
  console.log(`us_sector_wide 최신 as_of=${sectorAsOf}`);

  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", sectorAsOf),
    [{ column: "symbol" }]
  );
  console.log(`us_sector_wide as_of=${sectorAsOf}: ${sectorRows.length}행`);

  const valuations: ValuationInput[] = valuationRows.map((r) => ({ symbol: r.symbol, per: r.per, pbr: r.pbr, psr: r.psr, evEbitda: r.ev_ebitda }));
  const sectors: SectorInput[] = sectorRows.map((r) => ({ symbol: r.symbol, sector: r.sector }));
  const results = computeSectorRelativeBatch(valuations, sectors, SECTOR_RELATIVE_SPEC.minSample);

  const dbRows = results.map((r) => ({
    as_of: AS_OF, symbol: r.symbol, sector: r.sector, sector_as_of: sectorAsOf,
    per_pct: r.perPct, pbr_pct: r.pbrPct, psr_pct: r.psrPct, ev_ebitda_pct: r.evEbitdaPct,
    per_n: r.perN, pbr_n: r.pbrN, psr_n: r.psrN, ev_ebitda_n: r.evEbitdaN,
    unavailable: r.unavailable, min_sample: r.minSample,
    updated_at: new Date().toISOString(),
  }));

  let saved = 0;
  for (let i = 0; i < dbRows.length; i += 1000) {
    const batch = dbRows.slice(i, i + 1000);
    const { error } = await sb.from("us_sector_relative").upsert(batch, { onConflict: "as_of,symbol" });
    if (error) { console.error("upsert 실패:", error); process.exit(1); }
    saved += batch.length;
  }
  console.log(`저장 완료: ${saved}행`);

  const nullSector = results.filter((r) => r.sector == null).length;
  const perOk = results.filter((r) => r.perPct != null).length;
  const pbrOk = results.filter((r) => r.pbrPct != null).length;
  const psrOk = results.filter((r) => r.psrPct != null).length;
  const evOk = results.filter((r) => r.evEbitdaPct != null).length;
  console.log(JSON.stringify({ total: results.length, nullSector, perOk, pbrOk, psrOk, evOk }, null, 2));
}

main();
