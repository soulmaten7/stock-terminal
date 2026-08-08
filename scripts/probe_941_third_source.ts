// STEP 941 §3 — 세 출처(나스닥·SEC SIC·야후) 조합별 정확도 실측 + 미분류 70건 재분류 시뮬레이션(판정 아님·사실 기록).
// 🔴 lib/sector.ts의 resolveSector는 건드리지 않는다 — 이 스크립트는 독립적으로 조합을 채점만 한다.
// 🔴 대상 유니버스 = lens_scores US(1,021) 하나로 고정 — 나스닥·Damodaran 원자료 전체(수천 건)를 도는 게 아니다.
// 실행: npx tsx scripts/probe_941_third_source.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";

const norm = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, "");
const SIC_CONSENSUS_THRESHOLD = 0.7;

// 나스닥 12분류 → GICS 11(940·registry.ts와 동일 대응표). Miscellaneous·매핑표 밖 값 → undefined(미분류로 흘림).
const NASDAQ_TO_GICS: Record<string, string> = {
  Finance: "Financials", "Basic Materials": "Materials", Technology: "Information Technology",
  Telecommunications: "Communication Services", "Consumer Discretionary": "Consumer Discretionary",
  "Consumer Staples": "Consumer Staples", Energy: "Energy", "Health Care": "Health Care",
  Industrials: "Industrials", "Real Estate": "Real Estate", Utilities: "Utilities",
};

async function fetchAll<T>(sb: ReturnType<typeof createAdminClient>, table: string, select: string): Promise<T[]> {
  const rows: T[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from(table).select(select).range(f, f + 999);
    const c = (data ?? []) as T[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  return rows;
}

async function main() {
  const sb = createAdminClient();

  // 대상 = lens_scores US (모든 채점·조합 루프가 이 1,021개 범위 안에서만 돈다)
  const lensRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as { symbol: string }[]; lensRows.push(...c); if (c.length < 1000) break;
  }
  const targets = lensRows.map((r) => r.symbol);
  const targetNorms = targets.map(norm);
  const normToOriginal = new Map(targets.map((t) => [norm(t), t]));

  // 정답지: SPDR(us_sector_gics) — 전체 로드 후 조회는 targetNorms로만
  const gics = await fetchAll<{ symbol: string; sector: string }>(sb, "us_sector_gics", "symbol, sector");
  const truthByNorm = new Map(gics.map((r) => [norm(r.symbol), r.sector]));

  // 나스닥 원문 → GICS 매핑 적용 후 저장(비교는 반드시 GICS 어휘끼리)
  const nasdaqRowsAll = await fetchAll<{ symbol: string; sector: string | null }>(sb, "us_sector_nasdaq", "symbol, sector");
  const nasdaqRawByNorm = new Map(nasdaqRowsAll.map((r) => [norm(r.symbol), r.sector]));
  const nasdaqGicsByNorm = new Map<string, string>();
  for (const [n, raw] of nasdaqRawByNorm) { if (raw && NASDAQ_TO_GICS[raw]) nasdaqGicsByNorm.set(n, NASDAQ_TO_GICS[raw]); }

  // 야후(이미 GICS로 매핑된 sector 컬럼)
  const yahooRowsAll = await fetchAll<{ symbol: string; sector: string | null }>(sb, "us_sector_yahoo", "symbol, sector");
  const yahooByNorm = new Map<string, string>();
  for (const r of yahooRowsAll) if (r.sector) yahooByNorm.set(norm(r.symbol), r.sector);

  // SEC SIC: damodaran_industry의 sic_code(직접 매칭분) + sec_sic_missing219(그 밖 종목) → sic_code별 최빈섹터
  const damo = await fetchAll<{ ticker_norm: string; primary_sector: string | null; sic_code: string | null }>(
    sb, "damodaran_industry", "ticker_norm, primary_sector, sic_code"
  );
  const sicCount = new Map<string, Map<string, number>>();
  for (const d of damo) {
    if (!d.sic_code || d.sic_code === "0" || !d.primary_sector) continue;
    if (!sicCount.has(d.sic_code)) sicCount.set(d.sic_code, new Map());
    const m = sicCount.get(d.sic_code)!;
    m.set(d.primary_sector, (m.get(d.primary_sector) ?? 0) + 1);
  }
  const sicMajority = new Map<string, string>();
  for (const [sic, counts] of sicCount) {
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    let top: [string, number] = ["", 0];
    for (const e of counts) if (e[1] > top[1]) top = e;
    if (top[1] / total >= SIC_CONSENSUS_THRESHOLD) sicMajority.set(sic, top[0]);
  }
  const damoSicByNorm = new Map(damo.filter((d) => d.sic_code && d.sic_code !== "0").map((d) => [d.ticker_norm, d.sic_code!]));
  const missing219 = JSON.parse(fs.readFileSync("data/sources/sec/sec_sic_missing219_20260808.json", "utf8")) as { data: { symbol: string; sic: string }[] };
  const missing219SicByNorm = new Map(missing219.data.map((r) => [norm(r.symbol), r.sic]));
  const sicByNorm = new Map<string, string>([...damoSicByNorm, ...missing219SicByNorm]); // damodaran 우선, 없으면 219파일
  const sicGicsByNorm = new Map<string, string>();
  for (const n of targetNorms) { const sic = sicByNorm.get(n); if (sic) { const s = sicMajority.get(sic); if (s) sicGicsByNorm.set(n, s); } }

  // ── §2 단독 정확도(SPDR 대비, 대상=targets 내 SPDR 겹침분만) ───────────
  function scoreSingle(bySource: Map<string, string>) {
    let overlap = 0, match = 0;
    const mismatches: { symbol: string; predicted: string; truth: string }[] = [];
    for (const n of targetNorms) {
      const truth = truthByNorm.get(n);
      const pred = bySource.get(n);
      if (!truth || !pred) continue;
      overlap++;
      if (pred === truth) match++;
      else mismatches.push({ symbol: normToOriginal.get(n) ?? n, predicted: pred, truth });
    }
    return { overlap, match, accuracy: overlap > 0 ? match / overlap : null, mismatches };
  }
  const scoreNasdaq = scoreSingle(nasdaqGicsByNorm);
  const scoreSic = scoreSingle(sicGicsByNorm);
  const scoreYahoo = scoreSingle(yahooByNorm);

  // ── §3 조합별 정확도(전부 targets 범위 안에서만) ───────────────────────
  // 나스닥 ∩ SIC(현행 3순위)
  let consAgree = 0, consFail = 0, consMatch = 0, consOverlapWithTruth = 0;
  for (const n of targetNorms) {
    const na = nasdaqGicsByNorm.get(n), si = sicGicsByNorm.get(n);
    if (na && si) {
      if (na === si) {
        consAgree++;
        const truth = truthByNorm.get(n);
        if (truth) { consOverlapWithTruth++; if (truth === na) consMatch++; }
      } else consFail++;
    }
  }

  // 2-of-3 다수결 / 3-of-3 만장일치 (targets 범위 안에서만)
  let twoOfThreeOverlap = 0, twoOfThreeMatch = 0, twoOfThreeUndecided = 0;
  let threeOfThreeOverlap = 0, threeOfThreeMatch = 0, threeOfThreeCoverage = 0;
  const allDisagree: { symbol: string; nasdaq: string | null; sic: string | null; yahoo: string | null; truth: string | null }[] = [];
  const majorityBySymbol = new Map<string, string>();

  for (const n of targetNorms) {
    const votes = [nasdaqGicsByNorm.get(n), sicGicsByNorm.get(n), yahooByNorm.get(n)].filter((v): v is string => !!v);
    if (votes.length === 0) continue;
    const counts = new Map<string, number>();
    for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
    let top: [string, number] = ["", 0];
    for (const e of counts) if (e[1] > top[1]) top = e;
    const majority = top[1] >= 2 ? top[0] : null;
    if (majority) {
      majorityBySymbol.set(n, majority);
      const truth = truthByNorm.get(n);
      if (truth) { twoOfThreeOverlap++; if (truth === majority) twoOfThreeMatch++; }
    } else if (votes.length === 3) {
      twoOfThreeUndecided++;
      allDisagree.push({ symbol: normToOriginal.get(n) ?? n, nasdaq: nasdaqGicsByNorm.get(n) ?? null, sic: sicGicsByNorm.get(n) ?? null, yahoo: yahooByNorm.get(n) ?? null, truth: truthByNorm.get(n) ?? null });
    }
    if (votes.length === 3 && counts.size === 1) {
      threeOfThreeCoverage++;
      const truth = truthByNorm.get(n);
      if (truth) { threeOfThreeOverlap++; if (truth === votes[0]) threeOfThreeMatch++; }
    }
  }

  // ── §4 미분류 70건 재분류 시뮬레이션(940 산출물 재사용) ────────────────
  const prev940 = JSON.parse(fs.readFileSync("docs/probe_940_sector_resolve.json", "utf8")) as { unclassified: { symbol: string }[] };
  function simulate(bySource: Map<string, string>, label: string) {
    const recovered: { symbol: string; sector: string }[] = [];
    for (const u of prev940.unclassified) {
      const n = norm(u.symbol);
      const s = bySource.get(n);
      if (s) recovered.push({ symbol: u.symbol, sector: s });
    }
    return { label, count: recovered.length, recovered };
  }
  const consensusMap = new Map<string, string>();
  for (const n of targetNorms) { const na = nasdaqGicsByNorm.get(n), si = sicGicsByNorm.get(n); if (na && si && na === si) consensusMap.set(n, na); }
  const simNasdaq = simulate(nasdaqGicsByNorm, "나스닥 단독");
  const simSic = simulate(sicGicsByNorm, "SIC 단독");
  const simYahoo = simulate(yahooByNorm, "야후 단독");
  const simConsensus = simulate(consensusMap, "나스닥∩SIC");
  const simMajority = simulate(majorityBySymbol, "2-of-3 다수결");

  // ── §5 섹터별 종목 수(2-of-3 다수결 기준) ───────────────────────────
  const bySector = new Map<string, number>();
  for (const n of targetNorms) { const s = majorityBySymbol.get(n); if (s) bySector.set(s, (bySector.get(s) ?? 0) + 1); }
  const sectorCounts = Array.from(bySector.entries()).sort((a, b) => a[1] - b[1]).map(([sector, n]) => ({ sector, n }));

  const out = {
    _meta: { purpose: "STEP 941 §3 — 세 출처 조합별 정확도 실측(대상=lens_scores US 1,021)", targetCount: targets.length, spdrTruthCount: gics.length, generatedAt: new Date().toISOString() },
    acquisition: JSON.parse(fs.readFileSync("docs/probe_941_yahoo_ingest.json", "utf8")),
    singleSourceScores: { nasdaq: scoreNasdaq, sic: scoreSic, yahoo: scoreYahoo },
    combinations: {
      nasdaqCapSic: { agree: consAgree, fail: consFail, accuracy: consOverlapWithTruth > 0 ? consMatch / consOverlapWithTruth : null, overlapWithTruth: consOverlapWithTruth },
      twoOfThree: { overlapWithTruth: twoOfThreeOverlap, match: twoOfThreeMatch, accuracy: twoOfThreeOverlap > 0 ? twoOfThreeMatch / twoOfThreeOverlap : null, undecided: twoOfThreeUndecided },
      threeOfThree: { coverage: threeOfThreeCoverage, overlapWithTruth: threeOfThreeOverlap, match: threeOfThreeMatch, accuracy: threeOfThreeOverlap > 0 ? threeOfThreeMatch / threeOfThreeOverlap : null },
    },
    unclassifiedSimulation: { total: prev940.unclassified.length, byMethod: [simNasdaq, simSic, simYahoo, simConsensus, simMajority].map((s) => ({ label: s.label, recoveredCount: s.count })) },
    unclassifiedRecoveredDetail: { nasdaq: simNasdaq.recovered, sic: simSic.recovered, yahoo: simYahoo.recovered, consensus: simConsensus.recovered, majority: simMajority.recovered },
    sectorCountsUnderMajority: sectorCounts,
    allThreeDisagree: allDisagree,
  };
  fs.writeFileSync("docs/probe_941_third_source.json", JSON.stringify(out, null, 2));

  console.log("=== §2 단독 정확도(SPDR 대비, targets 범위) ===");
  console.log("나스닥:", scoreNasdaq.overlap, "겹침 /", scoreNasdaq.accuracy !== null ? (scoreNasdaq.accuracy * 100).toFixed(1) + "%" : "n/a");
  console.log("SIC  :", scoreSic.overlap, "겹침 /", scoreSic.accuracy !== null ? (scoreSic.accuracy * 100).toFixed(1) + "%" : "n/a");
  console.log("야후 :", scoreYahoo.overlap, "겹침 /", scoreYahoo.accuracy !== null ? (scoreYahoo.accuracy * 100).toFixed(1) + "%" : "n/a");
  console.log("\n=== §3 조합별 ===");
  console.log("나스닥∩SIC:", "합의", consAgree, "실패", consFail, "정확도", consOverlapWithTruth > 0 ? (consMatch / consOverlapWithTruth * 100).toFixed(1) + "%" : "n/a");
  console.log("2-of-3:", "겹침", twoOfThreeOverlap, "정확도", twoOfThreeOverlap > 0 ? (twoOfThreeMatch / twoOfThreeOverlap * 100).toFixed(1) + "%" : "n/a", "결정불가", twoOfThreeUndecided);
  console.log("3-of-3:", "커버리지", threeOfThreeCoverage, "정확도", threeOfThreeOverlap > 0 ? (threeOfThreeMatch / threeOfThreeOverlap * 100).toFixed(1) + "%" : "n/a");
  console.log("\n=== §4 미분류 70건 재분류(방법별 회수 건수) ===");
  for (const s of [simNasdaq, simSic, simYahoo, simConsensus, simMajority]) console.log(` ${s.label}: ${s.count}건`);
  console.log("\n=== §6 세 출처 모두 갈림 ===", allDisagree.length, "건");
  console.log("\n저장: docs/probe_941_third_source.json");
}

main();
