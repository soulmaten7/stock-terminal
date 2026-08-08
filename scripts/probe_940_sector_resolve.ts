// STEP 940 §4 — resolveSector 실측 리포트(판정 아님·사실 기록).
// 실행: npx tsx scripts/probe_940_sector_resolve.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector, type SectorResolution } from "../lib/sector";

async function main() {
  const sb = createAdminClient();

  // 대상 = lens_scores US(1,021)
  const lensRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as { symbol: string }[];
    lensRows.push(...c);
    if (c.length < 1000) break;
  }
  const targets = lensRows.map((r) => r.symbol);

  // ── §1 출처별 건수(0순위 포함, 실제 배치용) ─────────────────────────────
  const full = await resolveSector(sb, targets);
  const bySource: Record<string, number> = { spdr: 0, damodaran: 0, "damodaran-sibling": 0, consensus: 0 };
  for (const r of full.values()) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  const unclassifiedFull = targets.length - full.size;
  const coverage = full.size / targets.length;

  // ── §2 채점: 0순위 제외 상태로 1~3순위만 만들어 SPDR 정답지와 대조 ──────
  const noZero = await resolveSector(sb, targets, { skipTier0: true });
  // SPDR 정답지(전체, us_sector_gics 최신 as_of)
  const gicsAll: { symbol: string; sector: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_gics").select("symbol, sector").range(f, f + 999);
    const c = (data ?? []) as typeof gicsAll;
    gicsAll.push(...c);
    if (c.length < 1000) break;
  }
  const truthBySymbol = new Map(gicsAll.map((r) => [r.symbol.toUpperCase().replace(/[^A-Z0-9]/g, ""), r.sector]));
  const normKey = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const scoreBySource: Record<string, { overlap: number; match: number }> = {
    damodaran: { overlap: 0, match: 0 },
    "damodaran-sibling": { overlap: 0, match: 0 },
    consensus: { overlap: 0, match: 0 },
  };
  const mismatchesBySource: Record<string, { symbol: string; predicted: string; truth: string }[]> = {
    damodaran: [], "damodaran-sibling": [], consensus: [],
  };
  for (const [symbol, r] of noZero) {
    const truth = truthBySymbol.get(normKey(symbol));
    if (truth === undefined) continue; // SPDR 정답지 밖(S&P500 미편입) — 채점 대상 아님
    const bucket = scoreBySource[r.source];
    if (!bucket) continue;
    bucket.overlap++;
    if (truth === r.sector) bucket.match++;
    else mismatchesBySource[r.source].push({ symbol, predicted: r.sector, truth });
  }
  const scoreSummary = Object.fromEntries(
    Object.entries(scoreBySource).map(([k, v]) => [k, { ...v, accuracy: v.overlap > 0 ? v.match / v.overlap : null }])
  );

  // ── §3 3순위 합의 실패 건수 분해 ──────────────────────────────────────
  // 3순위까지 시도했는데도 못 찾은 것들 = full에서 spdr/damodaran/damodaran-sibling/consensus 어디에도 없는 심볼
  const unresolvedAfterAll = targets.filter((t) => !full.has(t));

  // ── §4 미분류 목록 전건 ──────────────────────────────────────────────
  const unclassified = unresolvedAfterAll.map((symbol) => ({ symbol }));

  // ── §5 섹터별 종목 수(최종 확정분 기준) ──────────────────────────────
  const bySector = new Map<string, number>();
  for (const r of full.values()) bySector.set(r.sector, (bySector.get(r.sector) ?? 0) + 1);
  const sectorCounts = Array.from(bySector.entries()).sort((a, b) => a[1] - b[1]).map(([sector, n]) => ({ sector, n }));

  const out = {
    _meta: { purpose: "STEP 940 §4 — resolveSector 실측 리포트(판정 아님)", targetsUniverse: "lens_scores US", targetCount: targets.length, generatedAt: new Date().toISOString() },
    bySource: { ...bySource, unclassified: unclassifiedFull },
    coverage,
    scoreExcludingTier0: scoreSummary,
    mismatchesExcludingTier0: mismatchesBySource,
    unclassifiedCount: unresolvedAfterAll.length,
    unclassified,
    sectorCounts,
  };
  fs.writeFileSync("docs/probe_940_sector_resolve.json", JSON.stringify(out, null, 2));

  console.log("=== §1 출처별 건수 ===");
  console.log(bySource, "미분류(0순위 포함)", unclassifiedFull, "커버리지", (coverage * 100).toFixed(1) + "%");
  console.log("\n=== §2 채점(0순위 제외, SPDR 정답지 대비) ===");
  console.log(JSON.stringify(scoreSummary, null, 1));
  console.log("\n=== §4 미분류 ===", unresolvedAfterAll.length, "건");
  console.log("\n=== §5 섹터별 종목 수(하위 6개) ===");
  console.log(sectorCounts.slice(0, 6));
  console.log("\n저장: docs/probe_940_sector_resolve.json");
}

main();
