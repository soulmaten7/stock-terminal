// STEP 848 — 역산기 엔진 테스트. 🔴 통과 조건 = 원전 도미노 재현(value(1)≈285·MIFP 8).
import { describe, it, expect } from "vitest";
import { runRevDcf, thresholdMargin, type RevDcfDrivers, type RevDcfMarket } from "./engine";

// 도미노피자 T8 Inputs (2020-09) — data/sources/expectations-investing/T8.xlsx
const DPZ_D: RevDcfDrivers = {
  startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739,
  taxRate: 0.165, fixedCapitalRate: 0.15, workingCapitalRate: 0.10,
};
const DPZ_M: RevDcfMarket = {
  wacc: 0.05357, inflation: 0.016, sharePrice: 418, sharesOutstanding: 39.35, debt: 4170, nonOperatingAssets: 391.9,
};

describe("§5 원전 재현 — 도미노피자", () => {
  const r = runRevDcf(DPZ_D, DPZ_M);
  it("value(year 1) ≈ $285 (T8 D27=285.20)", () => {
    const v1 = r.years.find((y) => y.year === 1)!.perShare;
    expect(v1).toBeGreaterThan(284);
    expect(v1).toBeLessThan(286);
  });
  it("MIFP = 8년", () => {
    expect(r.verdict).toEqual({ kind: "years", gap: 8 });
  });
  it("단조 증가 (증분 ROIC > WACC)", () => {
    expect(r.monotonic).toBe("up");
  });
  it("임계마진 검산 일치 (마진 17.5% > 임계 → 가치창출)", () => {
    expect(r.thresholdConsistent).toBe(true);
    expect(DPZ_D.operatingMargin).toBeGreaterThan(r.thresholdMargin);
  });
});

describe("추가 1 — i=0 vs 원전 i=1.6% 터미널 차이", () => {
  it("i=0이면 터미널 작아져 같은 주가 설명에 더 긴 GAP 필요", () => {
    const withInfl = runRevDcf(DPZ_D, DPZ_M);
    const noInfl = runRevDcf(DPZ_D, { ...DPZ_M, inflation: 0 });
    const g1 = withInfl.verdict.kind === "years" ? withInfl.verdict.gap : -1;
    const g0 = noInfl.verdict.kind === "years" ? noInfl.verdict.gap : -1;
    expect(g0).toBeGreaterThan(g1); // i=0 → 더 김
  });
});

describe("추가 2 — 단조성: 무작위 드라이버에서 mixed 없음", () => {
  it("100세트 드라이버 불변 → mixed 0", () => {
    let mixed = 0;
    for (let n = 0; n < 100; n++) {
      // 결정론(인덱스 기반) — Math.random 미사용
      const g = 0.01 + (n % 20) * 0.01; // 1%~20%
      const marg = 0.05 + ((n * 7) % 30) * 0.01; // 5%~34%
      const wacc = 0.04 + ((n * 3) % 8) * 0.01; // 4%~11%
      const d: RevDcfDrivers = { startingSales: 1000, salesGrowth: g, operatingMargin: marg, startingMargin: marg, taxRate: 0.21, fixedCapitalRate: 0.1 + (n % 5) * 0.05, workingCapitalRate: 0.05 + (n % 3) * 0.03 };
      const m: RevDcfMarket = { wacc, inflation: 0, sharePrice: 100, sharesOutstanding: 100, debt: 0, nonOperatingAssets: 0 };
      const r = runRevDcf(d, m);
      if (r.monotonic === "mixed") mixed++;
    }
    expect(mixed).toBe(0);
  });
});

describe("추가 3 — 5분기 판정 타입", () => {
  const base = { ...DPZ_M };
  it("years — 정상 크로스", () => {
    expect(runRevDcf(DPZ_D, base).verdict.kind).toBe("years");
  });
  it("below_one — 주가가 매우 낮음", () => {
    expect(runRevDcf(DPZ_D, { ...base, sharePrice: 50 }).verdict.kind).toBe("below_one");
  });
  it("over_cap — 주가가 매우 높음 + explainedPct", () => {
    const v = runRevDcf(DPZ_D, { ...base, sharePrice: 5000 }).verdict;
    expect(v.kind).toBe("over_cap");
    if (v.kind === "over_cap") { expect(v.explainedPct).toBeGreaterThan(0); expect(v.explainedPct).toBeLessThan(1); }
  });
  it("value_destroying — 마진 < 임계(증분 ROIC < WACC)", () => {
    const d: RevDcfDrivers = { ...DPZ_D, operatingMargin: 0.02, startingMargin: 0.02, salesGrowth: 0.20, fixedCapitalRate: 0.5, workingCapitalRate: 0.3 };
    const r = runRevDcf(d, base);
    expect(r.verdict.kind).toBe("value_destroying");
    expect(r.monotonic).toBe("down");
    expect(r.thresholdConsistent).toBe(true); // 마진 2% < 임계
  });
  it("invalid — WACC ≤ i", () => {
    expect(runRevDcf(DPZ_D, { ...base, wacc: 0.01, inflation: 0.02 }).verdict).toEqual({ kind: "invalid", reason: expect.stringContaining("WACC") });
  });
  it("invalid — 주식수 0", () => {
    expect(runRevDcf(DPZ_D, { ...base, sharesOutstanding: 0 }).verdict.kind).toBe("invalid");
  });
});

describe("추가 4 — 임계마진 ↔ value_destroying 일치", () => {
  it("마진을 임계 근처에서 넘나들면 판정이 뒤집힌다", () => {
    const m = { ...DPZ_M };
    // 🔑 임계마진은 currentMargin의 선형함수 thr(x)=a·x+b → 고정점(break-even) m* = b/(1−a).
    const b = thresholdMargin(DPZ_D, m, 0); // growthTerm
    const a = (1 + m.inflation) / (1 + DPZ_D.salesGrowth);
    const bm = b / (1 - a); // 실제 break-even 마진 (도미노 드라이버 기준 ≈ 1.4%)
    const above = runRevDcf({ ...DPZ_D, operatingMargin: bm + 0.02, startingMargin: bm + 0.02 }, m);
    const below = runRevDcf({ ...DPZ_D, operatingMargin: bm - 0.01, startingMargin: bm - 0.01 }, m);
    expect(above.monotonic).toBe("up");
    expect(below.verdict.kind).toBe("value_destroying");
  });
});
