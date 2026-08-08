// STEP 942 §3 — resolveSector(3순위=야후, 942 A안) 최종 실측 리포트(판정 아님·사실 기록).
// 실행: npx tsx scripts/probe_942_final_resolve.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";

async function main() {
  const sb = createAdminClient();

  const lensRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as { symbol: string }[]; lensRows.push(...c); if (c.length < 1000) break;
  }
  const targets = lensRows.map((r) => r.symbol);

  // ── §1 출처별 건수(0순위 포함, 실제 배치용) ─────────────────────────────
  const full = await resolveSector(sb, targets);
  const bySource: Record<string, number> = { spdr: 0, damodaran: 0, "damodaran-sibling": 0, yahoo: 0 };
  for (const r of full.values()) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  const unclassified = targets.filter((t) => !full.has(t));
  const coverage = full.size / targets.length;

  // 🔴 0·1·2순위는 941 실측(498·311·5)과 같아야 한다 — 검증만, 자동 정지는 안 함(보고에서 육안 확인)
  const expected = { spdr: 498, damodaran: 311, "damodaran-sibling": 5 };
  const tier012Match = bySource.spdr === expected.spdr && bySource.damodaran === expected.damodaran && bySource["damodaran-sibling"] === expected["damodaran-sibling"];

  // ── §2 0순위 제외 채점(SPDR 정답지 대비, 순위별) ────────────────────────
  const noZero = await resolveSector(sb, targets, { skipTier0: true });
  const gicsAll: { symbol: string; sector: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_gics").select("symbol, sector").range(f, f + 999);
    const c = (data ?? []) as typeof gicsAll; gicsAll.push(...c); if (c.length < 1000) break;
  }
  const normKey = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const truthBySymbol = new Map(gicsAll.map((r) => [normKey(r.symbol), r.sector]));

  const scoreBySource: Record<string, { overlap: number; match: number }> = {
    damodaran: { overlap: 0, match: 0 }, "damodaran-sibling": { overlap: 0, match: 0 }, yahoo: { overlap: 0, match: 0 },
  };
  for (const [symbol, r] of noZero) {
    const truth = truthBySymbol.get(normKey(symbol));
    if (truth === undefined) continue;
    const bucket = scoreBySource[r.source];
    if (!bucket) continue;
    bucket.overlap++;
    if (truth === r.sector) bucket.match++;
  }
  const scoreSummary = Object.fromEntries(
    Object.entries(scoreBySource).map(([k, v]) => [k, { ...v, accuracy: v.overlap > 0 ? v.match / v.overlap : null }])
  );

  // ── §3 disagree=true 전건 목록 ───────────────────────────────────────
  const disagreeList = Array.from(full.entries())
    .filter(([, r]) => r.crossCheck.disagree)
    .map(([symbol, r]) => ({ symbol, adoptedSector: r.sector, adoptedSource: r.source, crossCheck: r.crossCheck }));

  // ── §4 섹터별 종목 수(최종 확정분 기준) ─────────────────────────────
  const bySector = new Map<string, number>();
  for (const r of full.values()) bySector.set(r.sector, (bySector.get(r.sector) ?? 0) + 1);
  const sectorCounts = Array.from(bySector.entries()).sort((a, b) => a[1] - b[1]).map(([sector, n]) => ({ sector, n }));

  // ── §5 미분류 잔여(전건 + 사유: 야후 취득 실패 여부) ────────────────
  const yahooRows: { symbol: string; sector_raw: string | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_yahoo").select("symbol, sector_raw").range(f, f + 999);
    const c = (data ?? []) as typeof yahooRows; yahooRows.push(...c); if (c.length < 1000) break;
  }
  const yahooRawBySymbol = new Map(yahooRows.map((r) => [normKey(r.symbol), r.sector_raw]));
  const unclassifiedDetail = unclassified.map((symbol) => {
    const raw = yahooRawBySymbol.get(normKey(symbol));
    return { symbol, reason: raw === undefined ? "yahoo_row_missing" : raw === null ? "yahoo_fetch_failed" : "yahoo_mapping_gap(사전 942 검증에서 0건이었음 — 재확인 필요)" };
  });

  const out = {
    _meta: { purpose: "STEP 942 §3 — resolveSector 최종 실측(3순위=야후)", targetCount: targets.length, generatedAt: new Date().toISOString() },
    bySource: { ...bySource, unclassified: unclassified.length },
    tier012MatchesExpected941: tier012Match,
    coverage,
    scoreExcludingTier0: scoreSummary,
    disagreeCount: disagreeList.length,
    disagreeList,
    sectorCounts,
    unclassifiedDetail,
  };
  fs.writeFileSync("docs/probe_942_final_resolve.json", JSON.stringify(out, null, 2));

  console.log("=== §1 출처별 건수 ===");
  console.log(bySource, "미분류", unclassified.length, "커버리지", (coverage * 100).toFixed(1) + "%");
  console.log("0·1·2순위가 941 실측(498/311/5)과 일치?", tier012Match);
  console.log("\n=== §2 0순위 제외 채점(SPDR 대비) ===");
  console.log(JSON.stringify(scoreSummary, null, 1));
  console.log("\n=== §3 disagree=true ===", disagreeList.length, "건");
  console.log("\n=== §4 섹터별 종목 수(하위 6개) ===");
  console.log(sectorCounts.slice(0, 6));
  console.log("\n=== §5 미분류 잔여 ===", unclassified.length, "건:", unclassified.join(", "));
  console.log("\n저장: docs/probe_942_final_resolve.json");
}

main();
