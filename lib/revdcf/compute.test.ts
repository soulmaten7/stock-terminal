// STEP 849 — WACC 조립 + 3점 민감도 테스트. 재료는 fixture(테스트 입력·프로덕션 하드코딩 아님).
import { describe, it, expect } from "vitest";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity, type WaccMaterials } from "./compute";
import type { RevDcfDrivers, RevDcfMarket } from "./engine";

// 다모다란 2026-01 Restaurant/Dining (DPZ 업종) — 검산 fixture
const SPREADS = [
  { std_dev_lo: 0, std_dev_hi: 0.3, spread: 0.005506 },
  { std_dev_lo: 0.30001, std_dev_hi: 0.45, spread: 0.008872 },
  { std_dev_lo: 0.45001, std_dev_hi: 0.65, spread: 0.011113 },
  { std_dev_lo: 0.650001, std_dev_hi: 0.8, spread: 0.018395 },
  { std_dev_lo: 0.800001, std_dev_hi: 0.9, spread: 0.032098 },
  { std_dev_lo: 0.900001, std_dev_hi: 1, spread: 0.050899 },
  { std_dev_lo: 1.000001, std_dev_hi: 10, spread: 0.0885 },
];

describe("§2 credit spread 밴드 lookup", () => {
  it("std dev → 올바른 밴드", () => {
    expect(creditSpreadFor(0.4115, SPREADS)).toBe(0.008872); // Restaurant 업종 std
    expect(creditSpreadFor(0.1, SPREADS)).toBe(0.005506);
    expect(creditSpreadFor(2, SPREADS)).toBe(0.0885); // 상한 초과
  });
});

describe("§2 WACC 조립 — 업종 완성값 검산", () => {
  it("Restaurant/Dining: 우리 조립 ≈ 다모다란 cost_of_capital 7.16% (세율만 우리 것)", () => {
    const m: WaccMaterials = {
      riskFree: 0.0395, erp: 0.0446, unleveredBetaCashAdj: 0.7830073823550779,
      taxRate: 0.2563, deRatio: 0.2721981524363927, creditSpread: creditSpreadFor(0.411494619604859, SPREADS)!,
    };
    const w = assembleWacc(m);
    // 다모다란 완성값 0.07158 (그들은 eff_tax 0.0992 사용) · 우리는 marginal 0.2563 → 0.5%p 이내
    expect(Math.abs(w.wacc - 0.07158)).toBeLessThan(0.005);
    expect(w.equityWeight + w.debtWeight).toBeCloseTo(1, 10);
    expect(w.releveredBeta).toBeGreaterThan(w.releveredBeta > 0 ? 0.78 : 0); // relever ≥ unlevered
    expect(w.releveredBeta).toBeGreaterThan(0.7830073823550779);
  });
});

describe("§1 3점 민감도 래퍼 (통계 모델링 없음)", () => {
  const D: RevDcfDrivers = { startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739, taxRate: 0.165, fixedCapitalRate: 0.15, workingCapitalRate: 0.10 };
  const M: RevDcfMarket = { wacc: 0.05357, inflation: 0.016, sharePrice: 418, sharesOutstanding: 39.35, debt: 4170, nonOperatingAssets: 391.9 };
  it("도미노 기준 3점 → 기준 8년 · WACC 밴드로 GAP 확산", () => {
    const s = computeGapWithSensitivity(D, M);
    expect(s.base).toEqual({ kind: "years", gap: 8 });
    // −1%p는 더 짧게(또는 below_one), +1%p는 더 길게
    const g = (v: typeof s.base) => (v.kind === "years" ? v.gap : v.kind === "below_one" ? 0 : 999);
    expect(g(s.waccMinus1)).toBeLessThan(8);
    expect(g(s.waccPlus1)).toBeGreaterThan(8);
  });
});
