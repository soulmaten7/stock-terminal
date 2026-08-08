// STEP 896 §5 — MISSING_TAG 3분기(§4) 회귀 방지. 조건식(has5 게이트)은 그대로 두고 반환 문자열만 나눴다는 것을,
// 각 조건을 개별로 결핍시켜 실제 computeDrivers()를 돌려 확인한다(모킹이 아니라 실물 함수).
import { describe, it, expect } from "vitest";
import { computeDrivers } from "./drivers";

type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type GaapArg = Parameters<typeof computeDrivers>[0];

const YS = [2020, 2021, 2022, 2023, 2024];
const five = (v: number): Record<number, number> => Object.fromEntries(YS.map((y) => [y, v]));

function flowFacts(vals: Record<number, number>): Fact[] {
  return Object.entries(vals).map(([y, v]) => ({ form: "10-K", start: `${y}-01-01`, end: `${y}-12-31`, filed: `${+y + 1}-02-01`, val: v }));
}
function stockFacts(vals: Record<number, number>): Fact[] {
  return Object.entries(vals).map(([y, v]) => ({ form: "10-K", fp: "FY", end: `${y}-12-31`, filed: `${+y + 1}-02-01`, val: v }));
}
type TagInput = Fact[] | { unit: string; facts: Fact[] };
function gaapOf(tags: Record<string, TagInput>): GaapArg {
  const g: Record<string, { units: Record<string, Fact[]> }> = {};
  for (const [tag, input] of Object.entries(tags)) {
    const { unit, facts } = Array.isArray(input) ? { unit: "USD", facts: input } : input;
    g[tag] = { units: { [unit]: facts } };
  }
  return g as GaapArg;
}

const REV_TAG = "RevenueFromContractWithCustomerExcludingAssessedTax";
const revenue5yr = { [REV_TAG]: flowFacts(five(1000)) }; // 5년 내내 동일값 — Δ매출=0 케이스에도 재사용
const oi5yr = { OperatingIncomeLoss: flowFacts(five(100)) };
const ppe5yr = { PropertyPlantAndEquipmentNet: stockFacts(five(500)) };
const bs5yr = { AssetsCurrent: stockFacts(five(300)), LiabilitiesCurrent: stockFacts(five(200)) };
const cashOp5yr = { CashAndCashEquivalentsAtCarryingValue: stockFacts(five(50)) };
const shares5yr = { WeightedAverageNumberOfDilutedSharesOutstanding: { unit: "shares", facts: flowFacts(five(10)) } };
// driver5 marginal 재료 — invYears(2021~2024)만 필요(drivers.ts:180 YS.slice(1))
const INV_YEARS = [2021, 2022, 2023, 2024];
const invFive = (v: number): Record<number, number> => Object.fromEntries(INV_YEARS.map((y) => [y, v]));
const capexDna4yr = {
  PaymentsToAcquirePropertyPlantAndEquipment: flowFacts(invFive(80)),
  DepreciationDepletionAndAmortization: flowFacts(invFive(60)),
};
const dei = {} as GaapArg;

describe("computeDrivers — MISSING_TAG 3분기(STEP 896 §4) 회귀 방지", () => {
  it("영업이익 5년 미확보 → MISSING_TAG_OPERATING_INCOME (매출은 5년 있음)", () => {
    const r = computeDrivers(gaapOf({ ...revenue5yr }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("MISSING_TAG_OPERATING_INCOME");
      expect(r.flags.missing).toBe("operatingIncome<5yr");
    }
  });

  it("PP&E 5년 미확보 → MISSING_TAG_PPE (매출·영업이익은 5년 있음)", () => {
    const r = computeDrivers(gaapOf({ ...revenue5yr, ...oi5yr }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("MISSING_TAG_PPE");
      expect(r.flags.missing).toBe("ppe<5yr");
    }
  });

  it("영업현금흐름 5년 미확보 → MISSING_TAG_OPERATING_CASH (나머지 4개 재료는 5년 있음)", () => {
    const r = computeDrivers(gaapOf({ ...revenue5yr, ...oi5yr, ...ppe5yr, ...bs5yr }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("MISSING_TAG_OPERATING_CASH");
      expect(r.flags.missing).toBe("operatingCash<5yr");
    }
  });

  it("세 코드가 서로 다르다 — 한 코드로 다시 뭉치는 회귀를 잡는다(895 §3-1)", () => {
    const a = computeDrivers(gaapOf({ ...revenue5yr }), dei);
    const b = computeDrivers(gaapOf({ ...revenue5yr, ...oi5yr }), dei);
    const c = computeDrivers(gaapOf({ ...revenue5yr, ...oi5yr, ...ppe5yr, ...bs5yr }), dei);
    const codes = [a, b, c].map((r) => (!r.ok ? r.skipReason : null));
    expect(new Set(codes).size).toBe(3);
  });
});

// STEP 900 §2~§3 — DoD8 경계 케이스 점검에서 나온 미커버 항목 보강. 기존 스킵 5분기 중 세 곳(INSUFFICIENT_HISTORY·
// NOT_APPLICABLE_SECTOR·MULTI_CLASS_SHARES)이 개별 테스트가 없었다(MISSING_TAG 3종만 896에서 커버됨).
describe("computeDrivers — 스킵 경계 보강 (STEP 900 §3 — 이전 미커버)", () => {
  it("매출 5년 미확보(재료 자체가 없음) → INSUFFICIENT_HISTORY", () => {
    const r = computeDrivers(gaapOf({}), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("INSUFFICIENT_HISTORY");
      expect(r.flags.missing).toBe("revenue<5yr");
    }
  });

  it("유동/비유동 미분류(AssetsCurrent·LiabilitiesCurrent 없음) → NOT_APPLICABLE_SECTOR (매출·영업이익·PP&E는 5년 있음)", () => {
    const r = computeDrivers(gaapOf({ ...revenue5yr, ...oi5yr, ...ppe5yr }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("NOT_APPLICABLE_SECTOR");
      expect(r.flags.missing).toBe("unclassifiedBalanceSheet");
    }
  });

  it("5년 이력 전부 확보했으나 주식수 전 폴백(희석→기본→발행→dei)이 실패 → MULTI_CLASS_SHARES", () => {
    const r = computeDrivers(gaapOf({ ...revenue5yr, ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("MULTI_CLASS_SHARES");
      expect(r.flags.missing).toBe("shares");
    }
  });

  it("Δ매출=0(5년 전 대비 매출 불변) → fixedCapitalRateMarginal은 null (drivers.ts:186 cumDRev!==0 가드 직접 확인)", () => {
    // revenue5yr은 5년 내내 동일값(1000)이라 cumDRev = rev[2024]-rev[2020] = 0. NO_MARGINAL_CAPEX(route.ts)는
    // 이 null을 보고 스킵하는데, 그 null이 실제로 이 조건에서 나오는지는 지금까지 route 레벨 mock으로만 확인됐다(880) —
    // 여기서 drivers.ts 자체의 0-나눗셈 가드를 직접 확인한다.
    const r = computeDrivers(gaapOf({ ...revenue5yr, ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr, ...shares5yr, ...capexDna4yr }), dei);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.drivers.salesGrowth).toBe(0);
      expect(r.drivers.fixedCapitalRateMarginal).toBeNull();
    }
  });
});

// STEP 947 §2-5 — fundamentals(Q1 밸류에이션 재료: netIncome·equity·revenue·operatingIncome·dna·fiscalYear·sourceTags) 회귀 고정.
describe("computeDrivers — fundamentals(STEP 947 §2) — Q1 밸류에이션 재료", () => {
  const netIncomeLoss5yr = { NetIncomeLoss: flowFacts(five(80)) };
  const profitLoss5yr = { ProfitLoss: flowFacts(five(80)) };
  const equity5yr = { StockholdersEquity: stockFacts(five(400)) };
  const equityNeg5yr = { StockholdersEquity: stockFacts(five(-50)) };
  const fullOk = { ...revenue5yr, ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr, ...shares5yr, ...capexDna4yr };

  it("NetIncomeLoss만 있으면 netIncome이 채워지고 sourceTags.netIncome === 'NetIncomeLoss'", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...netIncomeLoss5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.netIncome).toBe(80);
    expect(r.fundamentals.sourceTags.netIncome).toBe("NetIncomeLoss");
  });

  it("NetIncomeLoss 없고 ProfitLoss만 있으면 폴백으로 값을 채우고 sourceTags에 'ProfitLoss'를 남긴다", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...profitLoss5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.netIncome).toBe(80);
    expect(r.fundamentals.sourceTags.netIncome).toBe("ProfitLoss");
  });

  it("NetIncomeLoss·ProfitLoss 둘 다 없으면 netIncome은 null이다(0으로 채우지 않는다)", () => {
    const r = computeDrivers(gaapOf({ ...fullOk }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.netIncome).toBeNull();
    expect(r.fundamentals.sourceTags.netIncome).toBeUndefined();
  });

  it("StockholdersEquity가 음수(자기자본잠식)이면 음수 그대로 보존한다(가공하지 않는다)", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...equityNeg5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.equity).toBe(-50);
  });

  it("StockholdersEquity가 있으면 sourceTags.equity가 기록된다", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...equity5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.equity).toBe(400);
    expect(r.fundamentals.sourceTags.equity).toBe("StockholdersEquity");
  });

  it("영업이익 5년치가 없어 MISSING_TAG_OPERATING_INCOME으로 return해도 fundamentals가 실려 온다(매출은 채워짐)", () => {
    const r = computeDrivers(gaapOf({ ...revenue5yr }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("MISSING_TAG_OPERATING_INCOME");
      expect(r.fundamentals).toBeDefined();
      expect(r.fundamentals.fiscalYear).toBe(2024);
      expect(r.fundamentals.revenue).toBe(1000);
      expect(r.fundamentals.operatingIncome).toBeNull(); // OperatingIncomeLoss 태그 자체가 없음 — 재구성 재료도 없음
    }
  });

  it("매출조차 없어 INSUFFICIENT_HISTORY로 return하면 fundamentals 전부 null(재료 자체가 없음)", () => {
    const r = computeDrivers(gaapOf({}), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("INSUFFICIENT_HISTORY");
      expect(r.fundamentals.fiscalYear).toBeNull();
      expect(r.fundamentals.revenue).toBeNull();
      expect(r.fundamentals.netIncome).toBeNull();
      expect(r.fundamentals.equity).toBeNull();
      expect(r.fundamentals.operatingIncome).toBeNull();
      expect(r.fundamentals.dna).toBeNull();
      expect(r.fundamentals.sourceTags).toEqual({});
    }
  });
});
