// STEP 943 — 섹터 내 컷 계산·저장 + 부트스트랩 안정성 실측 + 시장 전체 컷 대비 판정 변경 크기(결함⑤).
// 🔴 lens_cuts는 읽기만(절대 쓰지 않음) · lib/lenses.ts·lensCompute.ts·lensPrecompute.ts·sector.ts 미수정.
// 🔴 리포트에 판정·권고 문장 없음 — 숫자와 사실만.
// 실행: npx tsx scripts/probe_943_sector_cuts.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";
import { sectorCut, bootstrap, mulberry32 } from "../lib/sectorCuts";
import { CUT_LENSES, CUT_DIR, stateFromCut, type Cut } from "../lib/lensCuts";

const SEED = 943; // 고정 시드(943 §5-4 재현성 요구) — 리포트에 명시
const MIN_N = 20;
const AS_OF = new Date().toISOString().slice(0, 10);

const LENS_KEYS = ["momentum", "technical", "valuation", "lowvol", "quality", "assetgrowth", "fscore"] as const;

async function main() {
  const sb = createAdminClient();

  // ── 1. 지표별 값 취득(lens_scores US 전체 · revdcf_results 최신 as_of) ──
  const lensRowsFull = await fetchAllUsLensScores(sb);

  const latestRevdcfAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const revdcfRowsAsOf = latestRevdcfAsOf ? await fetchRevdcfAtAsOf(sb, latestRevdcfAsOf.as_of) : [];

  // ── 2. 섹터 해석 — 지표군마다 별개 모집단(943 ⓖ 원칙: 지표별로 그 지표가 있는 종목 전체) ──
  const lensSymbols = lensRowsFull.map((r) => String(r.symbol));
  const lensSectorMap = await resolveSector(sb, lensSymbols);

  const revdcfSymbols = revdcfRowsAsOf.filter((r) => r.gap_years != null).map((r) => String(r.symbol));
  const revdcfSectorMap = revdcfSymbols.length ? await resolveSector(sb, revdcfSymbols) : new Map();

  // ── 3. (섹터×지표) 값 그룹핑 ──
  type Group = { market: string; sector: string; metricKey: string; values: number[]; symbols: string[] };
  const groups = new Map<string, Group>();
  const addValue = (sector: string, metricKey: string, value: unknown, symbol: string) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    const key = `${sector}::${metricKey}`;
    if (!groups.has(key)) groups.set(key, { market: "US", sector, metricKey, values: [], symbols: [] });
    groups.get(key)!.values.push(value);
    groups.get(key)!.symbols.push(symbol);
  };
  for (const row of lensRowsFull) {
    const symbol = String(row.symbol);
    const res = lensSectorMap.get(symbol);
    if (!res) continue; // 미분류 — 이 심볼은 어떤 섹터에도 안 들어감
    for (const key of LENS_KEYS) addValue(res.sector, key, row[`${key}_value`], symbol);
  }
  for (const row of revdcfRowsAsOf) {
    if (row.gap_years == null || !row.symbol) continue;
    const res = revdcfSectorMap.get(row.symbol);
    if (!res) continue;
    addValue(res.sector, "gap_years", row.gap_years, row.symbol);
  }

  // ── 4. 컷 계산 + skip 목록 ──
  const cutRows: { market: string; sector: string; metric_key: string; lo: number; hi: number; n: number; method: string; as_of: string }[] = [];
  const skipList: { sector: string; metricKey: string; n: number; reason: string }[] = [];
  const cutTable: { sector: string; metricKey: string; lo: number; hi: number; n: number }[] = [];
  const groupList = Array.from(groups.values());
  for (const g of groupList) {
    const c = sectorCut(g.values, MIN_N);
    if (!c) { skipList.push({ sector: g.sector, metricKey: g.metricKey, n: g.values.length, reason: `n=${g.values.length} < ${MIN_N}` }); continue; }
    cutRows.push({ market: g.market, sector: g.sector, metric_key: g.metricKey, lo: c.lo, hi: c.hi, n: c.n, method: "p30/p70 · sector-scoped · missing-excluded", as_of: AS_OF });
    cutTable.push({ sector: g.sector, metricKey: g.metricKey, lo: c.lo, hi: c.hi, n: c.n });
  }

  // sector_cuts에 저장(신규 테이블만 — lens_cuts는 절대 안 씀)
  for (let i = 0; i < cutRows.length; i += 500) {
    const { error } = await sb.from("sector_cuts").upsert(cutRows.slice(i, i + 500), { onConflict: "market,sector,metric_key,as_of" });
    if (error) throw new Error(`sector_cuts upsert@${i}: ${error.message}`);
  }

  // ── 5. 부트스트랩(고정 시드) ──
  const bootstrapTable: { sector: string; metricKey: string; n: number; p30Width: number; p70Width: number; p30WidthOverIqr: number | null; p70WidthOverIqr: number | null }[] = [];
  let seedCounter = SEED;
  for (const g of groupList) {
    const c = sectorCut(g.values, MIN_N);
    if (!c) continue;
    const rng = mulberry32(seedCounter++); // 조합마다 시드를 1씩 증가 — 943 자체는 고정, 재현 가능(순서 고정이면 항상 같은 시드 배정)
    const b = bootstrap(g.values, rng, 1000);
    bootstrapTable.push({ sector: g.sector, metricKey: g.metricKey, n: c.n, p30Width: b.p30Width, p70Width: b.p70Width, p30WidthOverIqr: b.p30WidthOverIqr, p70WidthOverIqr: b.p70WidthOverIqr });
  }
  const nVsWidth = bootstrapTable.map((b) => ({ sector: b.sector, metricKey: b.metricKey, n: b.n, p30Width: b.p30Width, p70Width: b.p70Width })).sort((a, b) => a.n - b.n);

  // ── 6. 시장 전체 컷(lens_cuts, 읽기만) vs 섹터 컷 — 판정 변경 종목 수(CUT_LENSES 5종만, technical·fscore·gap_years는 대응 market cut 없음) ──
  const marketCutsRaw = (await sb.from("lens_cuts").select("lens_key, lo, hi, n").eq("market", "US")).data as { lens_key: string; lo: number; hi: number; n: number }[];
  const marketCutByKey = new Map(marketCutsRaw.map((r) => [r.lens_key, { lo: r.lo, hi: r.hi } as Cut]));
  const sectorCutByKey = new Map(cutTable.map((c) => [`${c.sector}::${c.metricKey}`, { lo: c.lo, hi: c.hi } as Cut]));

  const verdictChangeByMetric: Record<string, { comparedN: number; changedN: number }> = {};
  for (const lensKey of CUT_LENSES) {
    const marketCut = marketCutByKey.get(lensKey);
    if (!marketCut) { verdictChangeByMetric[lensKey] = { comparedN: 0, changedN: 0 }; continue; }
    let compared = 0, changed = 0;
    for (const row of lensRowsFull) {
      const symbol = String(row.symbol);
      const res = lensSectorMap.get(symbol);
      if (!res) continue;
      const value = row[`${lensKey}_value`];
      if (typeof value !== "number") continue;
      const secCut = sectorCutByKey.get(`${res.sector}::${lensKey}`);
      if (!secCut) continue; // 그 섹터는 skip됐음(n<20)
      const marketState = stateFromCut(lensKey, value, marketCut);
      const sectorState = stateFromCut(lensKey, value, secCut);
      compared++;
      if (marketState !== sectorState) changed++;
    }
    verdictChangeByMetric[lensKey] = { comparedN: compared, changedN: changed };
  }

  // ── 7. Utilities(n=43 근방, 가장 작은 섹터) 상세 ──
  const utilitiesDetail = bootstrapTable.filter((b) => b.sector === "Utilities");

  const out = {
    _meta: { purpose: "STEP 943 — 섹터 내 컷 + 부트스트랩 안정성 실측(판정·권고 없음, 숫자만)", asOf: AS_OF, bootstrapSeed: SEED, bootstrapIterations: 1000, minN: MIN_N, generatedAt: new Date().toISOString() },
    cutTable,
    bootstrapTable,
    nVsWidth,
    verdictChangeByMetric,
    skipList,
    utilitiesDetail,
  };
  fs.writeFileSync("docs/probe_943_sector_cuts.json", JSON.stringify(out, null, 2));

  console.log(`컷 계산 완료: ${cutRows.length}개 (섹터×지표) 조합 · skip ${skipList.length}건`);
  console.log(`부트스트랩: ${bootstrapTable.length}개 조합 · 시드=${SEED} · 1000회`);
  console.log("판정 변경(시장 vs 섹터, CUT_LENSES 5종):", JSON.stringify(verdictChangeByMetric, null, 1));
  console.log(`Utilities 상세: ${utilitiesDetail.length}개 지표`);
  console.log("\n저장: docs/probe_943_sector_cuts.json · DB: sector_cuts", cutRows.length, "행 upsert");
}

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

main();
