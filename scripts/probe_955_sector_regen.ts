// STEP 955 — us_sector_wide 재생성(954 이후 코드로). resolveSector·toResolvedRows는 무수정으로 그대로 호출.
// 🔴 lib/sector.ts 무수정. us_sector_resolved 무접촉. 크론 미호출. scripts/refresh_sector.ts 미실행.
// 실행: npx tsx scripts/probe_955_sector_regen.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";
import { toResolvedRows } from "../lib/sectorCuts";

const WATCH5 = ["PTGX", "TEAM", "TIGO", "WMS", "WTRG"];

async function main() {
  const sb = createAdminClient();

  // ── §1(참고 재확인) 스냅샷 상태 ──
  const { count: snapTotal } = await sb.from("us_sector_wide_snapshot").select("*", { count: "exact", head: true }).eq("snapshot_tag", "pre_step954_paging");
  const { count: snapNull } = await sb.from("us_sector_wide_snapshot").select("*", { count: "exact", head: true }).eq("snapshot_tag", "pre_step954_paging").is("sector", null);
  console.log(`§1 스냅샷(pre_step954_paging): 총 ${snapTotal}행, 미분류 ${snapNull}건`);

  // ── §2-1 대상 유니버스: us_valuation 최신 as_of ──
  const latest = (await sb.from("us_valuation").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!latest) throw new Error("us_valuation 비어있음");
  const asOf = latest.as_of;
  const valRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol").eq("as_of", asOf).range(f, f + 999);
    const c = (data ?? []) as typeof valRows;
    valRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = valRows.map((r) => r.symbol);
  console.log(`대상: us_valuation as_of=${asOf}, ${symbols.length}종목`);

  // ── 기존 us_sector_wide as_of 확인(같은 as_of를 써야 비교 가능) ──
  const { data: wideAsOfRows } = await sb.from("us_sector_wide").select("as_of").limit(1);
  const existingAsOf = (wideAsOfRows as { as_of: string }[] | null)?.[0]?.as_of;
  console.log(`기존 us_sector_wide as_of=${existingAsOf} vs 신규 대상 as_of=${asOf} — ${existingAsOf === asOf ? "일치" : "🔴 불일치"}`);

  // ── §2-3 적재 전 3회 반복 안정성 확인 ──
  const stabilityRuns: { classified: number; unclassified: number }[] = [];
  let lastResolved: Awaited<ReturnType<typeof resolveSector>> | null = null;
  for (let i = 0; i < 3; i++) {
    const r = await resolveSector(sb, symbols);
    stabilityRuns.push({ classified: r.size, unclassified: symbols.length - r.size });
    console.log(`§2-3 [run ${i + 1}] classified=${r.size} unclassified=${symbols.length - r.size}`);
    lastResolved = r;
  }
  const stable = new Set(stabilityRuns.map((s) => s.unclassified)).size === 1;
  console.log(`3회 미분류 건수 동일한가: ${stable ? "예" : "🔴 아니오 — 적재 중단"}`);

  if (!stable || !lastResolved) {
    fs.writeFileSync("docs/probe_955_sector_regen.json", JSON.stringify({ measuredAt: asOf, aborted: true, stabilityRuns }, null, 2));
    console.log("🔴 3회 반복이 불안정 — 적재하지 않고 중단.");
    process.exit(1);
  }

  // ── §2-4 upsert(같은 as_of, DELETE 없음) ──
  const rows = toResolvedRows(asOf, symbols, lastResolved);
  let saved = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from("us_sector_wide").upsert(batch, { onConflict: "as_of,symbol" });
    if (error) { console.error("🔴 upsert 에러:", error); process.exit(1); }
    saved += batch.length;
  }
  console.log(`\nus_sector_wide 재적재 완료: ${saved}행 (as_of=${asOf})`);

  // ── §3 before/after 전수 대조 ──
  const beforeRows: { symbol: string; sector: string | null; source: string | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_wide_snapshot").select("symbol, sector, source").eq("snapshot_tag", "pre_step954_paging").range(f, f + 999);
    const c = (data ?? []) as typeof beforeRows;
    beforeRows.push(...c);
    if (c.length < 1000) break;
  }
  const beforeBySym = new Map(beforeRows.map((r) => [r.symbol, r]));

  const afterRows: { symbol: string; sector: string | null; source: string | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_wide").select("symbol, sector, source").eq("as_of", asOf).range(f, f + 999);
    const c = (data ?? []) as typeof afterRows;
    afterRows.push(...c);
    if (c.length < 1000) break;
  }

  const unclassifiedToClassified: { symbol: string; newSector: string; newSource: string }[] = [];
  const classifiedToUnclassified: { symbol: string; oldSector: string; oldSource: string }[] = [];
  const sectorChanged: { symbol: string; beforeSector: string; afterSector: string; beforeSource: string; afterSource: string }[] = [];
  const sourceChanged: { symbol: string; sector: string; beforeSource: string; afterSource: string }[] = [];

  for (const a of afterRows) {
    const b = beforeBySym.get(a.symbol);
    const bSector = b?.sector ?? null, bSource = b?.source ?? null;
    const aSector = a.sector, aSource = a.source;
    if (bSector == null && aSector != null) unclassifiedToClassified.push({ symbol: a.symbol, newSector: aSector, newSource: aSource ?? "" });
    if (bSector != null && aSector == null) classifiedToUnclassified.push({ symbol: a.symbol, oldSector: bSector, oldSource: bSource ?? "" });
    if (bSector != null && aSector != null && bSector !== aSector) sectorChanged.push({ symbol: a.symbol, beforeSector: bSector, afterSector: aSector, beforeSource: bSource ?? "", afterSource: aSource ?? "" });
    if (bSector != null && aSector != null && bSector === aSector && bSource !== aSource) sourceChanged.push({ symbol: a.symbol, sector: aSector, beforeSource: bSource ?? "", afterSource: aSource ?? "" });
  }

  console.log(`\n§3 대조: 미분류→분류 ${unclassifiedToClassified.length}건 · 분류→미분류 ${classifiedToUnclassified.length}건 · sector변경 ${sectorChanged.length}건 · source변경(sector동일) ${sourceChanged.length}건`);

  // ── §3-2 감시 5종목 개별 ──
  const watch5Detail = WATCH5.map((sym) => {
    const b = beforeBySym.get(sym);
    const a = afterRows.find((r) => r.symbol === sym);
    return { symbol: sym, before: { sector: b?.sector ?? null, source: b?.source ?? null }, after: { sector: a?.sector ?? null, source: a?.source ?? null } };
  });
  console.log("\n§3-2 감시 5종목:", JSON.stringify(watch5Detail, null, 2));

  // ── §3-3 출처 단계별 건수 ──
  const tally: Record<string, number> = { spdr: 0, damodaran: 0, "damodaran-sibling": 0, yahoo: 0, unclassified: 0 };
  for (const a of afterRows) {
    if (!a.source) tally.unclassified++;
    else tally[a.source] = (tally[a.source] ?? 0) + 1;
  }
  console.log("\n§3-3 출처별(after):", JSON.stringify(tally, null, 2));

  // ── §4 us_sector_resolved 함의(조사만, 무접촉) ──
  const resolvedRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_resolved").select("symbol").range(f, f + 999);
    const c = (data ?? []) as typeof resolvedRows;
    resolvedRows.push(...c);
    if (c.length < 1000) break;
  }
  const resolvedSymSet = new Set(resolvedRows.map((r) => r.symbol));
  const tierChangedSymbols = [...sectorChanged.map((s) => s.symbol), ...sourceChanged.map((s) => s.symbol)];
  const alsoInResolved = tierChangedSymbols.filter((s) => resolvedSymSet.has(s));
  console.log(`\n§4 tier/sector 변경 종목 중 us_sector_resolved(1,021)에도 있는 것: ${alsoInResolved.length}건 — ${JSON.stringify(alsoInResolved)}`);

  const out = {
    asOf,
    step1_snapshot: { total: snapTotal, nullSector: snapNull },
    step2_targetCount: symbols.length,
    step2_existingAsOfMatch: existingAsOf === asOf,
    step2_3_stabilityRuns: stabilityRuns,
    step2_3_stable: stable,
    step2_4_saved: saved,
    step3_unclassifiedToClassified: unclassifiedToClassified,
    step3_classifiedToUnclassified: classifiedToUnclassified,
    step3_sectorChanged: sectorChanged,
    step3_sourceChanged: sourceChanged,
    step3_2_watch5: watch5Detail,
    step3_3_sourceTally_after: tally,
    step3_3_sourceTally_952: { spdr: 402, damodaran: 601, "damodaran-sibling": 5, yahoo: 29, unclassified: 90 },
    step4_tierChangedAlsoInResolved: { n: alsoInResolved.length, symbols: alsoInResolved },
  };
  fs.writeFileSync("docs/probe_955_sector_regen.json", JSON.stringify(out, null, 2));
  console.log("\n저장: docs/probe_955_sector_regen.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
