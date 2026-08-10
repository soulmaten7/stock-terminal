// STEP 981 §2-2 — 야후 PER(TTM) vs SEC PER(연간) 상위 괴리 20종목 원인 분류.
// 🔴 조사 전용 — DB 쓰기 0. docs/probe_951_cache/{symbol}.json(기존 SEC companyfacts 캐시, 1,167종목)만 읽는다.
// 가설: sec_per/yahoo_per ≈ TTM_순이익/FY_순이익 (같은 marketCap이 분자에서 상쇄되므로 이익 시점차만 남는다는 예측).
//   틀리면(예측과 실측이 크게 어긋나면) shares 기준차 등 다른 요인 — "불명"으로 분류.
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";

const NET_INCOME_TAGS = ["NetIncomeLossAvailableToCommonStockholdersBasic", "NetIncomeLoss", "ProfitLoss"]; // drivers.ts NET_INCOME과 동일 우선순위(981은 이걸 복제만 — drivers.ts 미수정)

type Fact = { start?: string; end?: string; val: number; form?: string; fy?: number; fp?: string; filed?: string };

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

// 이산(비누적) 분기 실적만 추출 — start~end가 80~100일인 항목. 같은 end 중복(같은 분기 다른 폼)은 최신 filed만.
function discreteQuartersOfTag(facts: Fact[]): Map<string, Fact> {
  const byEnd = new Map<string, Fact>();
  for (const f of facts) {
    if (!f.start || !f.end || typeof f.val !== "number") continue;
    const d = daysBetween(f.start, f.end);
    if (d < 80 || d > 100) continue;
    const prev = byEnd.get(f.end);
    if (!prev || (f.filed ?? "") > (prev.filed ?? "")) byEnd.set(f.end, f);
  }
  return byEnd;
}

// 🔴 981 수정 — drivers.ts의 coalesceMap과 동일 철학: 태그를 "통째로 하나만" 고르지 않고 end일자(연도)별로
//   우선순위 태그가 있으면 쓰고 없으면 다음 태그로 폴백한다. TWLO가 2022년부터 1순위 태그
//   (NetIncomeLossAvailableToCommonStockholdersBasic)를 끊고 NetIncomeLoss만 쓰기 시작한 사례로 발견
//   (전체선택 방식은 2021~2022년 옛 값에 고정되고 2025~2026년 최신 분기를 놓침).
function discreteQuarters(cacheJson: unknown): { end: string; val: number }[] {
  const facts = (cacheJson as { facts?: { "us-gaap"?: Record<string, { units?: { USD?: Fact[] } }> } }).facts?.["us-gaap"];
  if (!facts) return [];
  const byTag = NET_INCOME_TAGS.map((t) => discreteQuartersOfTag(facts[t]?.units?.USD ?? []));
  const allEnds = new Set<string>();
  for (const m of byTag) for (const end of m.keys()) allEnds.add(end);
  const merged: { end: string; val: number }[] = [];
  for (const end of allEnds) {
    for (const m of byTag) {
      const f = m.get(end);
      if (f) { merged.push({ end, val: f.val }); break; } // 우선순위 태그 중 이 end를 가진 첫 태그
    }
  }
  return merged.sort((a, b) => (a.end < b.end ? 1 : -1));
}

async function main() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("lens_scores")
    .select("symbol,valuation_value")
    .eq("market", "US")
    .not("valuation_value", "is", null);
  if (error) throw error;
  const yahooBySym = new Map<string, number>();
  for (const r of (data ?? []) as { symbol: string; valuation_value: number }[]) yahooBySym.set(r.symbol, r.valuation_value);

  const { data: uvRows, error: e2 } = await sb
    .from("us_valuation")
    .select("symbol,per,market_cap")
    .eq("as_of", "2026-08-09")
    .not("per", "is", null)
    .gt("per", 0);
  if (e2) throw e2;

  // 🔴 981 수정 — |a-b|/denominator는 어느 쪽을 분모로 두느냐에 따라 순위가 크게 갈린다(TWLO: yahoo분모=3125% vs sec분모=96.9%).
  //   분모 선택 문제를 피하려면 대칭 지표(ratio=max/min)를 쓴다 — "몇 배 차이"는 방향과 무관하게 하나로 정해진다.
  type Row = { symbol: string; secPer: number; marketCap: number; yahooPer: number; ratio: number };
  const matched: Row[] = [];
  for (const r of (uvRows ?? []) as { symbol: string; per: number; market_cap: number }[]) {
    const yp = yahooBySym.get(r.symbol);
    if (yp == null) continue;
    const ratio = Math.max(r.per, yp) / Math.min(r.per, yp);
    matched.push({ symbol: r.symbol, secPer: r.per, marketCap: r.market_cap, yahooPer: yp, ratio });
  }
  matched.sort((a, b) => b.ratio - a.ratio);
  const top20 = matched.slice(0, 20);

  const out: Record<string, unknown>[] = [];
  for (const row of top20) {
    const path = `docs/probe_951_cache/${row.symbol}.json`;
    if (!fs.existsSync(path)) {
      out.push({ ...row, cause: "unknown", note: "SEC 캐시 없음(981 범위 밖 — 재조회 안 함)" });
      continue;
    }
    const cacheJson = JSON.parse(fs.readFileSync(path, "utf8"));
    const fyNi = row.marketCap / row.secPer; // per = marketCap/netIncome 역산 — us_fundamentals 재조회 없이 정확히 복원(같은 값)
    const quarters = discreteQuarters(cacheJson);
    if (quarters.length < 4) {
      out.push({ ...row, cause: "unknown", note: `이산분기 ${quarters.length}개뿐(4개 미만) — TTM 재구성 불가` });
      continue;
    }
    const mostRecentEnd = quarters[0].end;
    const staleQuarters = daysBetween(mostRecentEnd, "2026-08-09") > 200; // 최근 분기 끝이 6개월+ 전이면 TTM 재구성 자체가 신뢰 불가(캐시 시점 문제 등) — 원인판정 아예 보류
    const ttmNi = quarters.slice(0, 4).reduce((s, q) => s + q.val, 0);
    const predictedRatio = ttmNi / fyNi; // = sec_per/yahoo_per 예측값(marketCap 상쇄 가정)
    const observedRatio = row.secPer / row.yahooPer;
    // 예측이 실측의 절반~2배 안에 들면(같은 자릿수·같은 방향) "TTM/FY 시점차"로 분류, 아니면 불명.
    const ok = !staleQuarters && predictedRatio > 0 && observedRatio > 0 &&
      Math.max(predictedRatio, observedRatio) / Math.min(predictedRatio, observedRatio) <= 2;
    out.push({
      symbol: row.symbol, secPer: row.secPer, marketCap: row.marketCap, yahooPer: row.yahooPer, ratio: Number(row.ratio.toFixed(2)),
      fyNi: Math.round(fyNi), ttmNi: Math.round(ttmNi),
      ttmQuarterEnds: quarters.slice(0, 4).map((q) => q.end),
      predictedRatio: Number(predictedRatio.toFixed(2)),
      observedRatio: Number(observedRatio.toFixed(2)),
      cause: staleQuarters ? "stale_quarters_untestable" : ok ? "ttm_fy_timing" : "unknown",
    });
  }

  const matchedN = matched.length;
  const sortedRatio = matched.map((m) => m.ratio).sort((a, b) => a - b);
  const pct = (p: number) => sortedRatio[Math.min(sortedRatio.length - 1, Math.floor(sortedRatio.length * p))];

  const result = {
    matchedN,
    p50Ratio: pct(0.5), // Postgres percentile_cont과 별개 계산(중복검증) — SQL 결과와 대조
    p90Ratio: pct(0.9),
    top20: out,
    causeCounts: out.reduce((acc: Record<string, number>, r) => { const c = String(r.cause); acc[c] = (acc[c] ?? 0) + 1; return acc; }, {}),
  };
  fs.writeFileSync("docs/probe_981_decompose_output.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main();
