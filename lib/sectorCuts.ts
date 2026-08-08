// STEP 943 — 섹터 내 컷(p30/p70) + 부트스트랩 안정성 계산의 순수 함수.
// 🔴 기존 lens_cuts 파이프라인(lib/lensPrecompute.ts:438 pctile)과 동일한 선형보간 공식을 재사용 — 결과가 비교 가능해야 한다.
// 🔴 이 파일은 새 계산만 담는다. lib/lensCuts.ts(기존 판정 소비부)는 여기서 import만 하고 수정하지 않는다.

export function pctile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const loI = Math.floor(idx), hiI = Math.ceil(idx);
  return sorted[loI] + (sorted[hiI] - sorted[loI]) * (idx - loI);
}

export type Cut = { lo: number; hi: number; n: number };

/** n<20이면 null(행을 만들지 않는다, 943 §④-3). */
export function sectorCut(values: number[], minN = 20): Cut | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < minN) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  return { lo: pctile(sorted, 0.3), hi: pctile(sorted, 0.7), n: sorted.length };
}

// mulberry32 — 고정 시드 재현 가능한 PRNG(Math.random()은 시드 불가). 943 §3 재현성 요구.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type BootstrapResult = {
  p30Width: number; // 부트스트랩 p30의 2.5~97.5 백분위 구간 폭
  p70Width: number;
  iqr: number; // 원표본(리샘플 아님)의 사분위범위 p75-p25
  p30WidthOverIqr: number | null;
  p70WidthOverIqr: number | null;
};

/** 복원추출 재표본 iterations회, 매회 p30/p70 계산 → 구간폭 산출. 고정 시드(rng)로 재현 가능. */
export function bootstrap(values: number[], rng: () => number, iterations = 1000): BootstrapResult {
  const clean = values.filter((v) => Number.isFinite(v));
  const n = clean.length;
  const p30s: number[] = new Array(iterations);
  const p70s: number[] = new Array(iterations);
  for (let it = 0; it < iterations; it++) {
    const resample: number[] = new Array(n);
    for (let i = 0; i < n; i++) resample[i] = clean[Math.floor(rng() * n)];
    resample.sort((a, b) => a - b);
    p30s[it] = pctile(resample, 0.3);
    p70s[it] = pctile(resample, 0.7);
  }
  p30s.sort((a, b) => a - b);
  p70s.sort((a, b) => a - b);
  const width = (arr: number[]) => pctile(arr, 0.975) - pctile(arr, 0.025);
  const p30Width = width(p30s);
  const p70Width = width(p70s);
  const sortedOrig = [...clean].sort((a, b) => a - b);
  const iqr = pctile(sortedOrig, 0.75) - pctile(sortedOrig, 0.25);
  return {
    p30Width, p70Width, iqr,
    p30WidthOverIqr: iqr > 0 ? p30Width / iqr : null,
    p70WidthOverIqr: iqr > 0 ? p70Width / iqr : null,
  };
}

// ────────────────────────────────────────────────────────────────
// STEP 944 — 적용/제외 판정 + 영속화 행 변환의 순수 함수.
// 🔴 임계값은 여기 상수로 고정하지 않는다 — 호출부(scripts/refresh_sector.ts)가 EXCLUDE_THRESHOLD를 넘긴다(규칙 5-2).
// ────────────────────────────────────────────────────────────────

export type AppliedDecision = { applied: boolean; excludeReason: string | null; widthOverIqr: number };

/** 부트스트랩 결과 + 임계값 → 적용/제외 판정. p30·p70 중 IQR 대비 더 큰 쪽으로 비교한다(943 §3). */
export function decideApplied(b: BootstrapResult, threshold: number): AppliedDecision {
  const widthOverIqr = Math.max(b.p30WidthOverIqr ?? 0, b.p70WidthOverIqr ?? 0);
  const applied = widthOverIqr <= threshold;
  return { applied, excludeReason: applied ? null : `bootstrap_width_over_iqr=${widthOverIqr.toFixed(2)} > ${threshold}`, widthOverIqr };
}

/** 🔴 944 §5-2: applied=false(또는 컷 자체가 없음)면 null — 시장 전체 컷으로 폴백하지 않는다(결함⑤ 재현 금지). */
export function cutIfApplied(row: { applied: boolean | null; lo: number; hi: number } | undefined): { lo: number; hi: number } | null {
  if (!row || row.applied !== true) return null;
  return { lo: row.lo, hi: row.hi };
}

export type SectorResolvedRow = {
  as_of: string; symbol: string; sector: string | null; source: string | null;
  cross_nasdaq: string | null; cross_sic: string | null; cross_yahoo: string | null; disagree: boolean | null;
};

/** resolveSector Map → us_sector_resolved 행. 🔴 resolveSector 로직을 복제하지 않는다 — 이미 계산된 결과를 형태만 바꾼다. */
export function toResolvedRows(
  asOf: string,
  symbols: string[],
  resolved: Map<string, { sector: string; source: string; crossCheck: { nasdaq: string | null; sic: string | null; yahoo: string | null; disagree: boolean } }>
): SectorResolvedRow[] {
  return symbols.map((symbol) => {
    const r = resolved.get(symbol);
    return {
      as_of: asOf, symbol,
      sector: r?.sector ?? null, source: r?.source ?? null,
      cross_nasdaq: r?.crossCheck.nasdaq ?? null, cross_sic: r?.crossCheck.sic ?? null, cross_yahoo: r?.crossCheck.yahoo ?? null,
      disagree: r?.crossCheck.disagree ?? null,
    };
  });
}
