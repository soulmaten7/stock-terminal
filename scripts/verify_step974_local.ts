// STEP 974 §4 — 로컬 1회 검증. app/api/cron/revdcf/route.ts의 computeAndSaveSectorRelative()와
// 정확히 같은 로직을 그대로 호출한다(복제가 아니라 같은 단계를 그대로 재현 — 함수가 export 안 돼 있어
// 스크립트에서 직접 부르지 못하므로 동일 코드를 옮겨 실행한다. STEP973 backfill 스크립트와 같은 관행).
// 🔴 asOf='2026-08-09'(기존 us_valuation 값) 고정 — "오늘"(2026-08-10, 시스템 날짜)로 실행하면
//   전체 GET 핸들러가 revdcf_results에 새 as_of 행을 쓰게 되어 이 STEP의 불변 규칙
//   ("revdcf_results에 쓰지 않는다")과 정면으로 충돌한다. 이 스크립트는 us_sector_wide·us_sector_relative
//   경로만 격리해서 재현하므로 그 규칙을 어기지 않는다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { resolveSector } from "../lib/sector";
import { toResolvedRows } from "../lib/sectorCuts";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const AS_OF = "2026-08-09";

async function computeAndSaveSectorRelative(sb: ReturnType<typeof createAdminClient>, asOf: string) {
  const valuationRows = await fetchAllRows<{ symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }>(
    () => sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", asOf),
    [{ column: "symbol" }]
  );
  if (valuationRows.length === 0) return { saved: 0, sectorWideAdded: 0, sectorWideError: null };

  const latestSector = (await sb.from("us_sector_wide").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!latestSector) return { saved: 0, sectorWideAdded: 0, sectorWideError: null };
  const sectorAsOf = latestSector.as_of;

  let sectorWideAdded = 0;
  let sectorWideError: string | null = null;
  try {
    const existingSectorSymbols = await fetchAllRows<{ symbol: string }>(
      () => sb.from("us_sector_wide").select("symbol").eq("as_of", sectorAsOf),
      [{ column: "symbol" }]
    );
    const existingSet = new Set(existingSectorSymbols.map((r) => r.symbol));
    const missingSymbols = valuationRows.map((r) => r.symbol).filter((s) => !existingSet.has(s));

    if (missingSymbols.length > 0) {
      const resolved = await resolveSector(sb, missingSymbols);
      const newRows = toResolvedRows(sectorAsOf, missingSymbols, resolved);
      for (let i = 0; i < newRows.length; i += 1000) {
        const batch = newRows.slice(i, i + 1000);
        const { error } = await sb.from("us_sector_wide").upsert(batch, { onConflict: "as_of,symbol" });
        if (error) throw error;
      }
      sectorWideAdded = newRows.length;
    }
  } catch (e) {
    sectorWideAdded = 0;
    sectorWideError = e instanceof Error ? e.message : String(e);
  }

  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", sectorAsOf),
    [{ column: "symbol" }]
  );

  const valuations: ValuationInput[] = valuationRows.map((r) => ({ symbol: r.symbol, per: r.per, pbr: r.pbr, psr: r.psr, evEbitda: r.ev_ebitda }));
  const sectors: SectorInput[] = sectorRows.map((r) => ({ symbol: r.symbol, sector: r.sector }));
  const results = computeSectorRelativeBatch(valuations, sectors, SECTOR_RELATIVE_SPEC.minSample);

  const dbRows = results.map((r) => ({
    as_of: asOf, symbol: r.symbol, sector: r.sector, sector_as_of: sectorAsOf,
    per_pct: r.perPct, pbr_pct: r.pbrPct, psr_pct: r.psrPct, ev_ebitda_pct: r.evEbitdaPct,
    per_n: r.perN, pbr_n: r.pbrN, psr_n: r.psrN, ev_ebitda_n: r.evEbitdaN,
    unavailable: r.unavailable, min_sample: r.minSample,
    updated_at: new Date().toISOString(),
  }));

  let saved = 0;
  for (let i = 0; i < dbRows.length; i += 1000) { const batch = dbRows.slice(i, i + 1000); const { error } = await sb.from("us_sector_relative").upsert(batch, { onConflict: "as_of,symbol" }); if (!error) saved += batch.length; }
  return { saved, sectorWideAdded, sectorWideError };
}

async function main() {
  const sb = createAdminClient();
  const result = await computeAndSaveSectorRelative(sb, AS_OF);
  console.log(JSON.stringify(result, null, 2));
}

main();
