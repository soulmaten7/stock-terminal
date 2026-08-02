// STEP 872 §2 — "둘째 안"(기준=과거 CAGR 유지 + 범위=야후 low/high)이 성립하는가.
// 측정 전용 · lib/revdcf/** 수정 없음(참조도 안 함) · 871의 야후 응답(probe_871_rows.json)을 그대로 재사용 — 재조회 금지.
// 실행: npx tsx scripts/probe_872_range_check.ts
import { readFileSync, writeFileSync } from "fs";

type Row871 = {
  cik: number; symbol: string;
  oldSalesGrowth: number; newSalesGrowth: number | null;
  newSalesGrowthLow: number | null; newSalesGrowthHigh: number | null;
  signFlip: boolean;
};

function percentile(xs: number[], p: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

function main() {
  const rows = JSON.parse(readFileSync("docs/probe_871_rows.json", "utf8")) as Row871[];
  console.error(`[0] 871 rows 재사용 — n=${rows.length}(재조회 없음)`);

  const withLowHigh = rows.filter((r) => r.newSalesGrowthLow != null && r.newSalesGrowthHigh != null);
  let inside = 0, below = 0, above = 0;
  const widths: number[] = [];
  for (const r of withLowHigh) {
    const lo = r.newSalesGrowthLow!, hi = r.newSalesGrowthHigh!;
    if (r.oldSalesGrowth < lo) below++;
    else if (r.oldSalesGrowth > hi) above++;
    else inside++;
    widths.push((hi - lo) * 100); // %p 단위
  }

  const flipped = rows.filter((r) => r.signFlip);
  const flippedWithRange = flipped.filter((r) => r.newSalesGrowthLow != null && r.newSalesGrowthHigh != null);
  let flippedInside = 0;
  for (const r of flippedWithRange) {
    if (r.oldSalesGrowth >= r.newSalesGrowthLow! && r.oldSalesGrowth <= r.newSalesGrowthHigh!) flippedInside++;
  }

  const out = {
    n: rows.length,
    hasLowHigh: withLowHigh.length,
    baseInsideRange: inside,
    baseBelowLow: below,
    baseAboveHigh: above,
    pctInside: withLowHigh.length ? +((inside / withLowHigh.length) * 100).toFixed(1) : null,
    bySignFlip: { flipped: flipped.length, flippedInside },
    medianRangeWidthPct: percentile(widths, 50),
    rangeWidthP25Pct: percentile(widths, 25),
    rangeWidthP75Pct: percentile(widths, 75),
    note: "야후 low/high는 애널리스트 분산(+1y 컨센서스 분포)이고 원전의 low 시나리오는 서사적 가정(도미노 3%/7%/11%처럼 스토리 기반)이다 — 같은 물건이 아님을 전제로 한 측정. baseInsideRange가 낮으면 '기준=과거CAGR·범위=야후low/high'라는 조합 자체가 자기모순(기준값이 자기 범위 밖에 표시됨)이라는 사실만 보여준다 — 채택 여부는 판단하지 않는다.",
  };
  writeFileSync("docs/probe_872_range.json", JSON.stringify(out, null, 2));
  console.error(`[1] hasLowHigh=${out.hasLowHigh} inside=${inside}(${out.pctInside}%) below=${below} above=${above}`);
  console.error(`[2] 부호반전 ${flipped.length}사 중 range내 ${flippedInside}`);
  console.error(`[3] 범위폭 중앙 ${out.medianRangeWidthPct?.toFixed(2)}%p (p25 ${out.rangeWidthP25Pct?.toFixed(2)} · p75 ${out.rangeWidthP75Pct?.toFixed(2)})`);
}

main();
