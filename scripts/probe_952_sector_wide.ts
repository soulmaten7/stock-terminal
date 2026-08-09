// STEP 952 §1~2 — Q1 ②단계 준비. resolveSector를 us_valuation 전체(1,127)에 돌려 커버리지를 재고,
// 결과를 us_sector_wide(신규, us_sector_resolved 무접촉)에 적재한다.
// 🔴 resolveSector·toResolvedRows 로직은 수정하지 않는다 — 그대로 호출만.
// 🔴 us_sector_resolved에는 쓰지 않는다. 크론 미호출.
// 실행: npx tsx scripts/probe_952_sector_wide.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";
import { toResolvedRows } from "../lib/sectorCuts";

const Q0_BASELINE = { total: 1021, spdr: 498, damodaran: 311, "damodaran-sibling": 5, yahoo: 207, unclassified: 0 };

async function main() {
  const sb = createAdminClient();

  // ── 대상: us_valuation 최신 as_of 전 종목 ──
  const latest = (await sb.from("us_valuation").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!latest) throw new Error("us_valuation 비어있음");
  const asOf = latest.as_of;
  const valRows: { symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", asOf).range(f, f + 999);
    const c = (data ?? []) as typeof valRows;
    valRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = valRows.map((r) => r.symbol);
  console.log(`대상: us_valuation as_of=${asOf}, ${symbols.length}종목`);

  // ── 1단계: resolveSector 호출(DB 쓰기 없음) ──
  const resolved = await resolveSector(sb, symbols);
  const tally: Record<string, number> = { spdr: 0, damodaran: 0, "damodaran-sibling": 0, yahoo: 0, unclassified: 0 };
  for (const s of symbols) {
    const r = resolved.get(s);
    if (!r) tally.unclassified++;
    else tally[r.source] = (tally[r.source] ?? 0) + 1;
  }
  console.log("출처별 건수:", tally);
  console.log("Q0 기준(1,021):", Q0_BASELINE);

  // 🔴 1-4: "야후 호출이 필요한 구간" 실측 — resolveSector 코드를 직접 재확인한 결과, yahoo tier(3순위)는
  //   live Yahoo API 호출이 아니라 us_sector_yahoo(사전 적재 테이블) 읽기다. resolveSector 전체가 Supabase
  //   테이블 read만 수행(fetchAll 4회 — damodaran_industry·us_sector_nasdaq·us_sector_yahoo·us_sector_gics),
  //   외부 네트워크 호출 0건. 레이트리밋 위험은 이 함수 경로에 존재하지 않는다.
  console.log(`\n🔑 yahoo tier(us_sector_yahoo 테이블 조회, 라이브 API 아님) = ${tally.yahoo}건. resolveSector는 외부 네트워크 호출 0건(전부 Supabase 테이블 read).`);

  const step1Out = {
    measuredAt: asOf,
    targetCount: symbols.length,
    tally,
    q0Baseline: Q0_BASELINE,
    note: "resolveSector는 damodaran_industry·us_sector_nasdaq·us_sector_yahoo·us_sector_gics 4개 테이블만 읽는다 — 외부 네트워크 호출(야후 라이브 API 등) 0건. yahoo tier는 us_sector_yahoo 사전적재 테이블 조회다.",
  };
  fs.writeFileSync("docs/probe_952_sector_wide_step1.json", JSON.stringify(step1Out, null, 2));

  // ── 2단계: us_sector_wide 적재 ──
  const rows = toResolvedRows(asOf, symbols, resolved);
  let saved = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from("us_sector_wide").upsert(batch, { onConflict: "as_of,symbol" });
    if (error) { console.error("🔴 upsert 에러:", error); process.exit(1); }
    saved += batch.length;
  }
  console.log(`\nus_sector_wide 적재 완료: ${saved}행 (as_of=${asOf})`);

  // ── 검증: 행수 · 미분류 수 · us_sector_resolved와 교차 대조 ──
  const { count: wideCount } = await sb.from("us_sector_wide").select("*", { count: "exact", head: true }).eq("as_of", asOf);
  const { count: nullSectorCount } = await sb.from("us_sector_wide").select("*", { count: "exact", head: true }).eq("as_of", asOf).is("sector", null);

  const resolvedAsOf = (await sb.from("us_sector_resolved").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;

  let mismatches: { symbol: string; wideSector: string | null; resolvedSector: string | null }[] = [];
  let overlapChecked = 0;
  if (resolvedAsOf) {
    const resolvedMap = new Map<string, string | null>();
    for (let f = 0; ; f += 1000) {
      const { data } = await sb.from("us_sector_resolved").select("symbol, sector").eq("as_of", resolvedAsOf.as_of).range(f, f + 999);
      const c = (data ?? []) as { symbol: string; sector: string | null }[];
      for (const r of c) resolvedMap.set(r.symbol, r.sector);
      if (c.length < 1000) break;
    }
    for (const row of rows) {
      if (resolvedMap.has(row.symbol)) {
        overlapChecked++;
        const rs = resolvedMap.get(row.symbol)!;
        if (rs !== row.sector) mismatches.push({ symbol: row.symbol, wideSector: row.sector, resolvedSector: rs });
      }
    }
  }

  console.log(`\n검증: us_sector_wide 행수=${wideCount} (기대 ${symbols.length}) · sector null=${nullSectorCount} · us_sector_resolved 교차대조=${overlapChecked}건, 불일치=${mismatches.length}건`);
  if (mismatches.length) console.log("🔴 불일치 목록:", JSON.stringify(mismatches, null, 2));

  const step2Out = {
    asOf, wideCount, expectedCount: symbols.length, nullSectorCount, resolvedAsOf: resolvedAsOf?.as_of ?? null,
    overlapChecked, mismatchCount: mismatches.length, mismatches,
  };
  fs.writeFileSync("docs/probe_952_sector_wide_step2.json", JSON.stringify(step2Out, null, 2));

  // ── 3-3 재료: 업종 11개 × 축 4개 유효표본 표 ──
  const valBySymbol = new Map(valRows.map((r) => [r.symbol, r]));
  const sampleTable: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!row.sector) continue;
    const v = valBySymbol.get(row.symbol);
    if (!v) continue;
    if (!sampleTable[row.sector]) sampleTable[row.sector] = { per: 0, pbr: 0, psr: 0, evEbitda: 0 };
    if (v.per != null) sampleTable[row.sector].per++;
    if (v.pbr != null) sampleTable[row.sector].pbr++;
    if (v.psr != null) sampleTable[row.sector].psr++;
    if (v.ev_ebitda != null) sampleTable[row.sector].evEbitda++;
  }
  console.log("\n업종×축 유효표본:", JSON.stringify(sampleTable, null, 2));
  fs.writeFileSync("docs/probe_952_sector_sample_table.json", JSON.stringify(sampleTable, null, 2));

  console.log("\n저장 완료: docs/probe_952_sector_wide_step1.json · _step2.json · _sample_table.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
