// STEP 944 — Q0 ⑤ 준비: resolveSector 결과 영속화 + sector_cuts 적용/제외 갱신.
// 🔴 이 스크립트가 만드는 테이블은 캐시다 — lib/sector.ts의 resolveSector가 정본.
// 🔴 크론 미등록 — 수동 실행만(npx tsx scripts/refresh_sector.ts). 재실행 안전(같은 as_of면 upsert).
// 🔴 943의 lib/sectorCuts.ts를 그대로 재사용 — 계산 로직을 복제하지 않는다(규칙 5-2 ①).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";
import { sectorCut, bootstrap, mulberry32, decideApplied, toResolvedRows } from "../lib/sectorCuts";

const SEED = 943; // 🔴 943과 동일 시드 유지(재현성) — 임계값과 마찬가지로 상수 한 곳에서만 관리
const MIN_N = 20;
const EXCLUDE_THRESHOLD = 1.0; // 🔴 규칙 5-2 — 값이 아니라 식: 이 상수 하나만 바꾸면 applied 집합이 전부 다시 계산된다
const AS_OF = new Date().toISOString().slice(0, 10);

const LENS_KEYS = ["momentum", "technical", "valuation", "lowvol", "quality", "assetgrowth", "fscore"] as const;

async function fetchAllUsLensScores(sb: ReturnType<typeof createAdminClient>): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select(
      "symbol, momentum_value, technical_value, valuation_value, lowvol_value, quality_value, assetgrowth_value, fscore_value"
    ).eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as Record<string, unknown>[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  return rows;
}

async function fetchRevdcfAtAsOf(sb: ReturnType<typeof createAdminClient>, asOf: string): Promise<{ symbol: string | null; gap_years: number | null }[]> {
  const rows: { symbol: string | null; gap_years: number | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("symbol, gap_years").eq("as_of", asOf).range(f, f + 999);
    const c = (data ?? []) as { symbol: string | null; gap_years: number | null }[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  return rows;
}

async function main() {
  const t0 = Date.now();
  const sb = createAdminClient();

  // ── ① us_sector_resolved 재생성 — resolveSector를 그대로 호출(로직 복제 금지) ──
  const t1a = Date.now();
  const lensRowsFull = await fetchAllUsLensScores(sb);
  const lensSymbols = lensRowsFull.map((r) => String(r.symbol));
  const lensSectorMap = await resolveSector(sb, lensSymbols);

  const resolvedRows = toResolvedRows(AS_OF, lensSymbols, lensSectorMap);
  for (let i = 0; i < resolvedRows.length; i += 500) {
    const { error } = await sb.from("us_sector_resolved").upsert(resolvedRows.slice(i, i + 500), { onConflict: "as_of,symbol" });
    if (error) throw new Error(`us_sector_resolved upsert@${i}: ${error.message}`);
  }
  const t1b = Date.now();
  console.log(`① us_sector_resolved: ${resolvedRows.length}행 upsert (${((t1b - t1a) / 1000).toFixed(1)}s)`);

  // ── ② sector_cuts 재계산 ──────────────────────────────────────────────
  const t2a = Date.now();
  const latestRevdcfAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const revdcfRowsAsOf = latestRevdcfAsOf ? await fetchRevdcfAtAsOf(sb, latestRevdcfAsOf.as_of) : [];
  const revdcfSymbols = revdcfRowsAsOf.filter((r) => r.gap_years != null).map((r) => String(r.symbol));
  const revdcfSectorMap = revdcfSymbols.length ? await resolveSector(sb, revdcfSymbols) : new Map();

  type Group = { sector: string; metricKey: string; values: number[] };
  const groups = new Map<string, Group>();
  const addValue = (sector: string, metricKey: string, value: unknown) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    const key = `${sector}::${metricKey}`;
    if (!groups.has(key)) groups.set(key, { sector, metricKey, values: [] });
    groups.get(key)!.values.push(value);
  };
  for (const row of lensRowsFull) {
    const res = lensSectorMap.get(String(row.symbol));
    if (!res) continue;
    for (const key of LENS_KEYS) addValue(res.sector, key, row[`${key}_value`]);
  }
  for (const row of revdcfRowsAsOf) {
    if (row.gap_years == null || !row.symbol) continue;
    const res = revdcfSectorMap.get(row.symbol);
    if (!res) continue;
    addValue(res.sector, "gap_years", row.gap_years);
  }

  // ── ③ 부트스트랩(943과 같은 시드) → width_over_iqr·applied·exclude_reason ──
  const cutRows: { market: string; sector: string; metric_key: string; lo: number; hi: number; n: number; method: string; as_of: string; applied: boolean; exclude_reason: string | null; width_over_iqr: number }[] = [];
  let seedCounter = SEED;
  let skipCount = 0;
  for (const g of Array.from(groups.values())) {
    const c = sectorCut(g.values, MIN_N);
    if (!c) { skipCount++; continue; }
    const rng = mulberry32(seedCounter++);
    const b = bootstrap(g.values, rng, 1000);
    const decision = decideApplied(b, EXCLUDE_THRESHOLD);
    cutRows.push({
      market: "US", sector: g.sector, metric_key: g.metricKey, lo: c.lo, hi: c.hi, n: c.n,
      method: "p30/p70 · sector-scoped · missing-excluded", as_of: AS_OF,
      applied: decision.applied, exclude_reason: decision.excludeReason, width_over_iqr: decision.widthOverIqr,
    });
  }
  for (let i = 0; i < cutRows.length; i += 500) {
    const { error } = await sb.from("sector_cuts").upsert(cutRows.slice(i, i + 500), { onConflict: "market,sector,metric_key,as_of" });
    if (error) throw new Error(`sector_cuts upsert@${i}: ${error.message}`);
  }
  const t2b = Date.now();
  const appliedCount = cutRows.filter((r) => r.applied).length;
  console.log(`② sector_cuts: ${cutRows.length}개 조합(적용 ${appliedCount}·제외 ${cutRows.length - appliedCount}) · skip(n<${MIN_N}) ${skipCount}건 (${((t2b - t2a) / 1000).toFixed(1)}s)`);
  console.log(`③ 부트스트랩: 시드=${SEED}(조합마다 +1) · 1,000회 · 임계=${EXCLUDE_THRESHOLD}`);

  console.log(`\n총 소요 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main();
