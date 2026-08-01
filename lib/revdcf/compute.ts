/**
 * 역DCF 재료 조립 (STEP 849) — WACC 구성요소 조립 + 3점 민감도 래퍼.
 *
 * 🔴 순수 함수. 재료는 인자(DB에서 읽은 값을 주입). 값을 코드에 박지 않는다(§12 B분류).
 * 🔴 848 민감도: GAP은 WACC에 극도로 민감(±1%p→below_one/15년) → 단일 GAP은 거짓 정밀도.
 *    결정 = 안 C: 통계 모델링 없이 WACC 3점(−1%p/기준/+1%p)으로 GAP을 함께 낸다. 가정 0.
 * 🔴 다모다란 완성 Cost of Capital 열은 쓰지 않는다(세율 불일치·§12) — 구성요소로 조립.
 */
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket, type RevDcfOptions, type RevDcfVerdict, type RevDcfHooks } from "./engine";

export interface WaccMaterials {
  riskFree: number; // damodaran_global_inputs.riskfree_rate (또는 FRED)
  erp: number; // damodaran_global_inputs.erp
  unleveredBetaCashAdj: number; // damodaran_beta.unlevered_beta_cash_adj (업종)
  taxRate: number; // damodaran_country_tax US (driver 3과 동일 값)
  deRatio: number; // 🔴 기업별 실측 = 부채 ÷ 시가총액 (업종평균 아님)
  creditSpread: number; // damodaran_credit_spread (주가 변동성 밴드)
}

export interface WaccBreakdown {
  wacc: number;
  costOfEquity: number;
  releveredBeta: number;
  afterTaxCostOfDebt: number;
  equityWeight: number;
  debtWeight: number;
}

/** Ke = rf + β_relevered×ERP · β_relevered = β_u_cash × [1+(1−t)D/E] · WACC = Ke·E/(D+E) + atCoD·D/(D+E) */
export function assembleWacc(m: WaccMaterials): WaccBreakdown {
  const releveredBeta = m.unleveredBetaCashAdj * (1 + (1 - m.taxRate) * m.deRatio);
  const costOfEquity = m.riskFree + releveredBeta * m.erp;
  const afterTaxCostOfDebt = (m.riskFree + m.creditSpread) * (1 - m.taxRate);
  const debtWeight = m.deRatio / (1 + m.deRatio);
  const equityWeight = 1 / (1 + m.deRatio);
  const wacc = costOfEquity * equityWeight + afterTaxCostOfDebt * debtWeight;
  return { wacc, costOfEquity, releveredBeta, afterTaxCostOfDebt, equityWeight, debtWeight };
}

/** 주가 표준편차 → basis spread (damodaran_credit_spread 밴드). 밴드는 [lo,hi]·마지막은 상한 큰 값. */
export function creditSpreadFor(stdDev: number, bands: { std_dev_lo: number; std_dev_hi: number | null; spread: number }[]): number | null {
  const sorted = [...bands].sort((a, b) => a.std_dev_lo - b.std_dev_lo);
  for (const b of sorted) if (stdDev >= b.std_dev_lo && (b.std_dev_hi == null || stdDev <= b.std_dev_hi)) return b.spread;
  return sorted.length ? sorted[sorted.length - 1].spread : null; // 초과 시 최상단
}

export interface GapSensitivity {
  wacc: number;
  base: RevDcfVerdict;
  waccMinus1: RevDcfVerdict;
  waccPlus1: RevDcfVerdict;
  waccSource: Record<string, unknown>;
}

/** 🔴 GAP 3점(−1%p/기준/+1%p). 통계 모델링 없음 — 엔진 3회 호출. */
export function computeGapWithSensitivity(
  drivers: RevDcfDrivers,
  market: RevDcfMarket,
  opts: RevDcfOptions = {},
  hooks: RevDcfHooks = {},
  waccSource: Record<string, unknown> = {}
): GapSensitivity {
  const run = (w: number) => runRevDcf(drivers, { ...market, wacc: w }, opts, hooks).verdict;
  return {
    wacc: market.wacc,
    base: run(market.wacc),
    waccMinus1: run(market.wacc - 0.01),
    waccPlus1: run(market.wacc + 0.01),
    waccSource,
  };
}
