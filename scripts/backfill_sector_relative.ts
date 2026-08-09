// STEP 956 §4 — us_sector_relative 1회 백필(as_of=2026-08-08). 크론이 아니라 스크립트.
// 🔴 §3-1의 순수 함수(computeSectorRelativeBatch)를 그대로 import해 쓴다 — 로직을 복제하지 않는다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const AS_OF = "2026-08-08";

async function main() {
  const sb = createAdminClient();

  const valuationRows = await fetchAllRows<{ symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }>(
    () => sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  console.log(`읽음: us_valuation(as_of=${AS_OF}) ${valuationRows.length}행 · us_sector_wide(as_of=${AS_OF}) ${sectorRows.length}행`);

  const valuations: ValuationInput[] = valuationRows.map((r) => ({ symbol: r.symbol, per: r.per, pbr: r.pbr, psr: r.psr, evEbitda: r.ev_ebitda }));
  const sectors: SectorInput[] = sectorRows.map((r) => ({ symbol: r.symbol, sector: r.sector }));
  const results = computeSectorRelativeBatch(valuations, sectors, SECTOR_RELATIVE_SPEC.minSample);

  const dbRows = results.map((r) => ({
    as_of: AS_OF, symbol: r.symbol, sector: r.sector,
    per_pct: r.perPct, pbr_pct: r.pbrPct, psr_pct: r.psrPct, ev_ebitda_pct: r.evEbitdaPct,
    per_n: r.perN, pbr_n: r.pbrN, psr_n: r.psrN, ev_ebitda_n: r.evEbitdaN,
    unavailable: r.unavailable, min_sample: r.minSample,
    updated_at: new Date().toISOString(),
  }));

  let saved = 0;
  for (let i = 0; i < dbRows.length; i += 1000) {
    const batch = dbRows.slice(i, i + 1000);
    const { error } = await sb.from("us_sector_relative").upsert(batch, { onConflict: "as_of,symbol" });
    if (error) { console.error("🔴 upsert 실패:", error); process.exit(1); }
    saved += batch.length;
  }
  console.log(`저장: us_sector_relative ${saved}행 (as_of=${AS_OF})`);

  // 사유별 분포 요약(콘솔 확인용 — §4-3 검증은 별도 조회로 한다)
  const reasonCount = new Map<string, number>();
  for (const r of results) for (const reason of Object.values(r.unavailable)) reasonCount.set(reason, (reasonCount.get(reason) ?? 0) + 1);
  console.log("unavailable 사유별 셀 수:", Object.fromEntries(reasonCount));
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
