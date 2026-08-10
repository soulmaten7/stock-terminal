// STEP 980 §4-2 — as_of=2026-08-08·2026-08-09 두 날짜에 median_relative(per_rel 등 8컬럼)를 백필한다.
// 🔴 computeSectorRelativeBatch()(순수함수, lib/sectorRelativeBatch.ts)를 그대로 재사용 — 로직 복제 없음.
// 🔴 수정(1차 시도 실패 — 부분 컬럼 upsert는 Postgres가 INSERT...ON CONFLICT의 VALUES 행 자체를
//   NOT NULL 제약으로 검증해 실패한다[min_sample 등]. route.ts와 동일하게 전 컬럼을 다시 계산해 싣는다 —
//   percentile 계열은 원래 계산과 100% 동일한 입력(같은 sectorAsOf)이면 값이 그대로 재현되므로 안전하고,
//   이건 §4-3의 md5 대조로 실제로 검증한다(하나라도 다르면 중단).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "../lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "../lib/sectorRelative";

const TARGET_AS_OFS = ["2026-08-08", "2026-08-09"];

async function backfillOne(sb: ReturnType<typeof createAdminClient>, asOf: string) {
  const valuationRows = await fetchAllRows<{ symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }>(
    () => sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", asOf),
    [{ column: "symbol" }]
  );
  if (valuationRows.length === 0) { console.log(`${asOf}: us_valuation 0행 — 스킵`); return { asOf, updated: 0 }; }

  // 🔴 sectorAsOf: 저장된 sector_as_of가 있으면 그걸 쓴다(973 이후). 없으면(08-08은 973 이전 데이터라
  //   컬럼 자체가 null) 그 시점엔 us_sector_wide가 as_of=2026-08-08 하나뿐이었으므로(973/974 이전) 그 as_of를
  //   그대로 쓴다 — 이래야 원래 계산이 썼던 것과 동일한 섹터 재료로 재현되어 percentile이 안 바뀐다.
  const existingRow = (await sb.from("us_sector_relative").select("sector_as_of").eq("as_of", asOf).limit(1).maybeSingle()).data as { sector_as_of: string | null } | null;
  const sectorAsOf = existingRow?.sector_as_of ?? asOf;

  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", sectorAsOf),
    [{ column: "symbol" }]
  );

  const valuations: ValuationInput[] = valuationRows.map((r) => ({ symbol: r.symbol, per: r.per, pbr: r.pbr, psr: r.psr, evEbitda: r.ev_ebitda }));
  const sectors: SectorInput[] = sectorRows.map((r) => ({ symbol: r.symbol, sector: r.sector }));
  const results = computeSectorRelativeBatch(valuations, sectors, SECTOR_RELATIVE_SPEC.minSample);

  // 🔴 route.ts의 dbRows 구성과 동일 — percentile 계열도 다시 싣지만, 같은 입력이면 같은 출력이라
  //   §4-3에서 md5로 "정말 안 바뀌었는지" 검증한다(지어내지 않는다).
  const dbRows = results.map((r) => ({
    as_of: asOf, symbol: r.symbol, sector: r.sector, sector_as_of: sectorAsOf,
    per_pct: r.perPct, pbr_pct: r.pbrPct, psr_pct: r.psrPct, ev_ebitda_pct: r.evEbitdaPct,
    per_rel: r.perRel, pbr_rel: r.pbrRel, psr_rel: r.psrRel, ev_ebitda_rel: r.evEbitdaRel,
    per_med: r.perMed, pbr_med: r.pbrMed, psr_med: r.psrMed, ev_ebitda_med: r.evEbitdaMed,
    per_n: r.perN, pbr_n: r.pbrN, psr_n: r.psrN, ev_ebitda_n: r.evEbitdaN,
    unavailable: r.unavailable, min_sample: r.minSample,
    updated_at: new Date().toISOString(),
  }));

  let updated = 0;
  for (let i = 0; i < dbRows.length; i += 1000) {
    const batch = dbRows.slice(i, i + 1000);
    const { error } = await sb.from("us_sector_relative").upsert(batch, { onConflict: "as_of,symbol" });
    if (error) { console.error(`${asOf} upsert 실패:`, error); process.exit(1); }
    updated += batch.length;
  }
  console.log(`${asOf}: sectorAsOf=${sectorAsOf}, ${updated}행 갱신`);
  return { asOf, updated };
}

async function main() {
  const sb = createAdminClient();
  const out = [];
  for (const asOf of TARGET_AS_OFS) out.push(await backfillOne(sb, asOf));
  console.log(JSON.stringify(out, null, 2));
}

main();
