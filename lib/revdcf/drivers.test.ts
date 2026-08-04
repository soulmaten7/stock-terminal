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
function gaapOf(tags: Record<string, Fact[]>): GaapArg {
  const g: Record<string, { units: { USD: Fact[] } }> = {};
  for (const [tag, facts] of Object.entries(tags)) g[tag] = { units: { USD: facts } };
  return g as GaapArg;
}

const REV_TAG = "RevenueFromContractWithCustomerExcludingAssessedTax";
const revenue5yr = { [REV_TAG]: flowFacts(five(1000)) };
const oi5yr = { OperatingIncomeLoss: flowFacts(five(100)) };
const ppe5yr = { PropertyPlantAndEquipmentNet: stockFacts(five(500)) };
const bs5yr = { AssetsCurrent: stockFacts(five(300)), LiabilitiesCurrent: stockFacts(five(200)) };
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
