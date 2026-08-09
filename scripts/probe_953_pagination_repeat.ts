// STEP 953 §2 — 등급 A·B 지점을 10회씩 반복 읽어 결과가 흔들리는지 실측한다.
// 🔴 DB 읽기만. 코드 무수정. SEC·야후 호출 없음. 운영 코드를 복제하되(inline 페이지네이션이라 import 불가한 지점),
//   그대로 옮겨 적었을 뿐 로직은 바꾸지 않았다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector, fetchSectorMap } from "../lib/sector";

const REPEATS = 10;

async function repeatMeasure<T extends string>(
  label: string,
  fn: () => Promise<T[]>
): Promise<{ label: string; counts: number[]; unionSize: number; perRunMissingFromUnion: number[] }> {
  const runs: T[][] = [];
  for (let i = 0; i < REPEATS; i++) runs.push(await fn());
  const counts = runs.map((r) => r.length);
  const union = new Set<string>();
  for (const r of runs) for (const s of r) union.add(s);
  const perRunMissingFromUnion = runs.map((r) => union.size - r.length);
  console.log(`[${label}] counts=${JSON.stringify(counts)} union=${union.size} missingFromUnion=${JSON.stringify(perRunMissingFromUnion)}`);
  return { label, counts, unionSize: union.size, perRunMissingFromUnion };
}

async function pageAll(sb: ReturnType<typeof createAdminClient>, table: string, select: string, filters: [string, unknown][] = []): Promise<string[]> {
  const out: string[] = [];
  for (let f = 0; ; f += 1000) {
    let q = sb.from(table).select(select);
    for (const [k, v] of filters) q = q.eq(k, v as never);
    const { data } = await q.range(f, f + 999);
    const c = (data ?? []) as unknown as { symbol: string }[];
    out.push(...c.map((r) => r.symbol));
    if (c.length < 1000) break;
  }
  return out;
}

async function main() {
  const sb = createAdminClient();
  const results: Record<string, unknown>[] = [];

  // ── A: lib/sector.ts:64 (resolveSector 자체 — damodaran/nasdaq/yahoo/gics 4-fetch 통합) ──
  const valRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol").eq("as_of", "2026-08-08").range(f, f + 999);
    const c = (data ?? []) as typeof valRows;
    valRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = valRows.map((r) => r.symbol);
  results.push(await repeatMeasure("A-1 lib/sector.ts:64 resolveSector() classified-symbols", async () => {
    const r = await resolveSector(sb, symbols);
    return Array.from(r.keys());
  }));

  // ── A: lib/sector.ts:21 fetchSectorMap(industryGroup) ──
  results.push(await repeatMeasure("A-2 lib/sector.ts:21 fetchSectorMap(industryGroup)", async () => {
    const m = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
    return Array.from(m.byTicker.keys());
  }));

  // ── A: revdcf/route.ts:48 us_fundamentals(전체) ──
  results.push(await repeatMeasure("A-3 revdcf:48 us_fundamentals(전체)", () =>
    pageAll(sb, "us_fundamentals", "symbol")));

  // ── A: revdcf/route.ts:106 us_market_cap(전체) ──
  results.push(await repeatMeasure("A-4 revdcf:106 us_market_cap(전체)", () =>
    pageAll(sb, "us_market_cap", "symbol")));

  // ── A: revdcf/route.ts:112 us_cik_map(전체) ──
  results.push(await repeatMeasure("A-5 revdcf:112 us_cik_map(전체)", () =>
    pageAll(sb, "us_cik_map", "symbol")));

  // ── A: search/route.ts:50 kr_stock_snapshot ──
  results.push(await repeatMeasure("A-6 search:50 kr_stock_snapshot", () =>
    pageAll(sb, "kr_stock_snapshot", "symbol")));

  // ── D(비교용, 참고): revdcf:92 revdcf_results(직전 as_of) — 604<1000, 단일페이지 예상 ──
  const latestRevdcf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (latestRevdcf) {
    results.push(await repeatMeasure("D-ref revdcf:92 revdcf_results(직전as_of, 참고용)", () =>
      pageAll(sb, "revdcf_results", "symbol", [["as_of", latestRevdcf.as_of]])));
  }

  // ── B: revdcf/route.ts:53 us_market_cap(당일 as_of) ──
  const mcapLatest = (await sb.from("us_market_cap").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (mcapLatest) {
    results.push(await repeatMeasure("B-1 revdcf:53 us_market_cap(당일as_of)", () =>
      pageAll(sb, "us_market_cap", "symbol", [["as_of", mcapLatest.as_of]])));
  }

  // ── B: revdcf/route.ts:121 us_fundamentals(symbol,fetched_at) — 컬럼만 다르고 동일 테이블 전체, A-3와 같은 취약면 ──
  // (표본 중복 방지 위해 생략 — A-3와 동일 쿼리 패턴)

  // ── B: usPerf/jpPerf/cnPerf (updated_at 읽기, gb/vn은 D라 제외) ──
  results.push(await repeatMeasure("B-2 usPerf:63 us_stock_perf", () =>
    pageAll(sb, "us_stock_perf", "symbol")));
  results.push(await repeatMeasure("B-3 jpPerf:63 jp_stock_perf", () =>
    pageAll(sb, "jp_stock_perf", "symbol")));
  results.push(await repeatMeasure("B-4 cnPerf:119 cn_stock_perf", () =>
    pageAll(sb, "cn_stock_perf", "symbol")));

  console.log("\n=== 요약 ===");
  for (const r of results as { label: string; counts: number[] }[]) {
    const uniqueCounts = new Set(r.counts);
    console.log(`${r.label}: 흔들림=${uniqueCounts.size > 1 ? "예" : "아니오"} (counts=${JSON.stringify(r.counts)})`);
  }

  const fs = await import("node:fs");
  fs.writeFileSync("docs/probe_953_pagination_repeat.json", JSON.stringify({ measuredAt: "2026-08-09", repeats: REPEATS, results }, null, 2));
  console.log("\n저장: docs/probe_953_pagination_repeat.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
