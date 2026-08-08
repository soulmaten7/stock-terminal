// STEP 944 §4 — 영속화 정합·제외 표기 정합·적용 요약·「업종 대비 표시 불가」 조합 수 검증 리포트.
// 🔴 판정 문장 없음 — 숫자와 사실만. scripts/refresh_sector.ts를 먼저 실행한 뒤 이 스크립트로 검증한다.
// 실행: npx tsx scripts/probe_944_persist.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";

async function fetchAllUsLensScoresSymbols(sb: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const rows: string[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(f, f + 999);
    const c = ((data ?? []) as { symbol: string }[]).map((r) => r.symbol);
    rows.push(...c);
    if (c.length < 1000) break;
  }
  return rows;
}

async function main() {
  const sb = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // ── 1. 영속화 정합: us_sector_resolved vs resolveSector 실시간 ──────────
  const symbols = await fetchAllUsLensScoresSymbols(sb);
  const live = await resolveSector(sb, symbols);

  const persistedRows: { symbol: string; sector: string | null; source: string | null; disagree: boolean | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_resolved").select("symbol, sector, source, disagree").eq("as_of", today).range(f, f + 999);
    const c = (data ?? []) as typeof persistedRows;
    persistedRows.push(...c);
    if (c.length < 1000) break;
  }
  const persistedBySymbol = new Map(persistedRows.map((r) => [r.symbol, r]));

  const mismatches: { symbol: string; persisted: unknown; live: unknown }[] = [];
  for (const symbol of symbols) {
    const p = persistedBySymbol.get(symbol);
    const l = live.get(symbol);
    const pSector = p?.sector ?? null, pSource = p?.source ?? null;
    const lSector = l?.sector ?? null, lSource = l?.source ?? null;
    if (pSector !== lSector || pSource !== lSource) {
      mismatches.push({ symbol, persisted: { sector: pSector, source: pSource }, live: { sector: lSector, source: lSource } });
    }
  }

  // ── 2. 제외 표기 정합: sector_cuts applied=false vs 943 리포트 7건 ──────
  const excludedRows = (await sb.from("sector_cuts").select("sector, metric_key, width_over_iqr").eq("applied", false)).data as { sector: string; metric_key: string; width_over_iqr: number }[];
  const probe943 = JSON.parse(fs.readFileSync("docs/probe_943_sector_cuts.json", "utf8")) as { bootstrapTable: { sector: string; metricKey: string; p30WidthOverIqr: number | null; p70WidthOverIqr: number | null }[] };
  const expected943Excluded = probe943.bootstrapTable
    .filter((b) => Math.max(b.p30WidthOverIqr ?? 0, b.p70WidthOverIqr ?? 0) > 1.0)
    .map((b) => `${b.sector}::${b.metricKey}`)
    .sort();
  const actualExcluded = excludedRows.map((r) => `${r.sector}::${r.metric_key}`).sort();
  const excludeMatch943 = JSON.stringify(expected943Excluded) === JSON.stringify(actualExcluded);

  // ── 3. 적용 요약 ─────────────────────────────────────────────────────
  const appliedRows = (await sb.from("sector_cuts").select("sector, metric_key, applied")).data as { sector: string; metric_key: string; applied: boolean | null }[];
  const appliedCount = appliedRows.filter((r) => r.applied === true).length;
  const excludedCount = appliedRows.filter((r) => r.applied === false).length;
  const bySector = new Map<string, { applied: number; excluded: number }>();
  const byMetric = new Map<string, { applied: number; excluded: number }>();
  for (const r of appliedRows) {
    if (!bySector.has(r.sector)) bySector.set(r.sector, { applied: 0, excluded: 0 });
    if (!byMetric.has(r.metric_key)) byMetric.set(r.metric_key, { applied: 0, excluded: 0 });
    const s = bySector.get(r.sector)!, m = byMetric.get(r.metric_key)!;
    if (r.applied) { s.applied++; m.applied++; } else { s.excluded++; m.excluded++; }
  }

  // ── 4. 「업종 대비 표시 불가」 (종목×지표) 조합 수 = 미분류 종목 + 제외 조합에 속한 종목 ──
  const LENS_KEYS = ["momentum", "technical", "valuation", "lowvol", "quality", "assetgrowth", "fscore"] as const;
  const excludedKeySet = new Set(excludedRows.map((r) => `${r.sector}::${r.metric_key}`));
  const lensRowsFull: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select(
      "symbol, momentum_value, technical_value, valuation_value, lowvol_value, quality_value, assetgrowth_value, fscore_value"
    ).eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as Record<string, unknown>[];
    lensRowsFull.push(...c);
    if (c.length < 1000) break;
  }
  let unclassifiedSymbolMetric = 0; // 종목 자체가 미분류 → 모든 지표에서 업종대비 불가
  let excludedComboSymbolMetric = 0; // 섹터는 있으나 그 (섹터×지표) 조합이 제외됨
  let showable = 0;
  for (const row of lensRowsFull) {
    const symbol = String(row.symbol);
    const res = live.get(symbol);
    for (const key of LENS_KEYS) {
      const value = row[`${key}_value`];
      if (typeof value !== "number") continue; // 지표 값 자체가 없으면 업종대비 이전에 이미 결측(범위 밖)
      if (!res) { unclassifiedSymbolMetric++; continue; }
      if (excludedKeySet.has(`${res.sector}::${key}`)) { excludedComboSymbolMetric++; continue; }
      showable++;
    }
  }

  const out = {
    _meta: { purpose: "STEP 944 §4 — 영속화·적용 검증 리포트(판정 없음)", asOf: today, generatedAt: new Date().toISOString() },
    persistenceMatch: { totalSymbols: symbols.length, mismatchCount: mismatches.length, mismatches },
    excludeMatch943,
    expected943Excluded, actualExcluded,
    appliedSummary: { appliedCount, excludedCount, bySector: Object.fromEntries(bySector), byMetric: Object.fromEntries(byMetric) },
    cannotShowSectorCompare: { unclassifiedSymbolMetric, excludedComboSymbolMetric, showable, total: unclassifiedSymbolMetric + excludedComboSymbolMetric + showable },
  };
  fs.writeFileSync("docs/probe_944_persist.json", JSON.stringify(out, null, 2));

  console.log(`1. 영속화 정합: ${symbols.length}종목 중 불일치 ${mismatches.length}건`);
  console.log(`2. 제외 표기 정합(943과 일치): ${excludeMatch943}`);
  console.log(`3. 적용 요약: applied=${appliedCount} · excluded=${excludedCount}`);
  console.log(`4. 업종 대비 표시 불가: 미분류종목 ${unclassifiedSymbolMetric} + 제외조합 ${excludedComboSymbolMetric} = ${unclassifiedSymbolMetric + excludedComboSymbolMetric} / 전체 ${unclassifiedSymbolMetric + excludedComboSymbolMetric + showable}`);
  console.log("\n저장: docs/probe_944_persist.json");
}

main();
