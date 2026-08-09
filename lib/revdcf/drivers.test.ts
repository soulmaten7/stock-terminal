// STEP 896 §5 — MISSING_TAG 3분기(§4) 회귀 방지. 조건식(has5 게이트)은 그대로 두고 반환 문자열만 나눴다는 것을,
// 각 조건을 개별로 결핍시켜 실제 computeDrivers()를 돌려 확인한다(모킹이 아니라 실물 함수).
import { describe, it, expect } from "vitest";
import { computeDrivers, resolveYearWindow } from "./drivers";

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

  // STEP 963 §2-4 — commonEquity·NET_INCOME 우선주 우선순위 회귀 고정.
  const availToCommon5yr = { NetIncomeLossAvailableToCommonStockholdersBasic: flowFacts(five(70)) };
  const preferred5yr = { PreferredStockValue: stockFacts(five(60)) };
  const nciEquity5yr = { StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest: stockFacts(five(450)) };
  const minorityInterest5yr = { MinorityInterest: stockFacts(five(50)) };

  it("NetIncomeLossAvailableToCommonStockholdersBasic이 있으면 그것을 쓴다(NetIncomeLoss가 있어도 우선)", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...netIncomeLoss5yr, ...availToCommon5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.netIncome).toBe(70);
    expect(r.fundamentals.sourceTags.netIncome).toBe("NetIncomeLossAvailableToCommonStockholdersBasic");
  });

  it("AvailableToCommon이 없으면 기존대로 NetIncomeLoss로 폴백한다", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...netIncomeLoss5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.netIncome).toBe(80);
    expect(r.fundamentals.sourceTags.netIncome).toBe("NetIncomeLoss");
  });

  it("우선주 태그가 없으면 commonEquity == equity이고 preferredStockUnknown 플래그가 선다", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...equity5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.commonEquity).toBe(400);
    expect(r.fundamentals.preferredStock).toBeNull();
    expect(r.flags.preferredStockUnknown).toBe(true);
  });

  it("우선주가 있으면 commonEquity = equity - 우선주", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...equity5yr, ...preferred5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.equity).toBe(400);
    expect(r.fundamentals.commonEquity).toBe(340);
    expect(r.fundamentals.preferredStock).toBe(60);
    expect(r.fundamentals.sourceTags.preferredStock).toBe("PreferredStockValue");
  });

  it("EQUITY가 NCI포함 태그로 채택되고 MinorityInterest가 있으면 commonEquity에서 NCI를 뺀다", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...nciEquity5yr, ...minorityInterest5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.equity).toBe(450);
    expect(r.fundamentals.sourceTags.equity).toBe("StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest");
    expect(r.fundamentals.commonEquity).toBe(400); // 450 - 50(NCI) - 0(우선주 없음)
    expect(r.fundamentals.minorityInterest).toBe(50);
    expect(r.fundamentals.sourceTags.minorityInterest).toBe("MinorityInterest");
  });

  it("EQUITY가 NCI포함 태그인데 MinorityInterest 태그가 없으면 못 빼고 flags.commonEquityNciNotSubtracted가 선다", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...nciEquity5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.commonEquity).toBe(450); // 못 뺐음 — equity 그대로
    expect(r.flags.commonEquityNciNotSubtracted).toBe(true);
  });

  it("commonEquity가 음수가 될 수 있다 — 가공하지 않고 그대로 보존한다(PBR 계산 단계에서 unavailable 처리)", () => {
    const smallEquity5yr = { StockholdersEquity: stockFacts(five(30)) };
    const bigPreferred5yr = { PreferredStockValue: stockFacts(five(60)) };
    const r = computeDrivers(gaapOf({ ...fullOk, ...smallEquity5yr, ...bigPreferred5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.equity).toBe(30);
    expect(r.fundamentals.commonEquity).toBe(-30);
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

  // STEP 965 §2-4 — 제출버전(vintage) 재작성 감지 회귀. annualMap의 선택 로직(filed 최신값 우선)은 무변경 —
  // 이미 선택된 값이 실제로 재작성을 거쳤는지(같은 연도에 값이 다른 제출이 2개 이상)만 flags.restated에 기록.
  it("같은 연도에 값이 다른 제출이 2개면 flags.restated에 필드명이 실리고, 값 선택은 기존 규칙(최신 filed) 그대로다", () => {
    const netIncomeRestated2024 = {
      NetIncomeLoss: [
        ...flowFacts(five(80)),
        { form: "10-K", start: "2024-01-01", end: "2024-12-31", filed: "2026-02-01", val: 90 }, // 원본(2025-02-01,80)보다 늦게 제출된 재작성치
      ],
    };
    const r = computeDrivers(gaapOf({ ...fullOk, ...netIncomeRestated2024 }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.netIncome).toBe(90); // 기존 규칙대로 최신 filed값(90) 채택 — 값 선택 로직 무변경
    expect(r.flags.restated).toContain("netIncome");
  });

  it("같은 연도에 값이 같은 제출이 2개(단순 재제출)면 재작성으로 세지 않는다", () => {
    const netIncomeResubmitted2024 = {
      NetIncomeLoss: [
        ...flowFacts(five(80)),
        { form: "10-K", start: "2024-01-01", end: "2024-12-31", filed: "2026-02-01", val: 80 }, // filed만 다르고 값은 동일
      ],
    };
    const r = computeDrivers(gaapOf({ ...fullOk, ...netIncomeResubmitted2024 }), dei);
    expect(r.ok).toBe(true);
    expect(r.fundamentals.netIncome).toBe(80);
    expect(r.flags.restated).not.toContain("netIncome");
  });

  it("단일 제출뿐이면 restated는 빈 배열이다(필드 자체를 빼지 않는다)", () => {
    const r = computeDrivers(gaapOf({ ...fullOk, ...netIncomeLoss5yr, ...equity5yr }), dei);
    expect(r.ok).toBe(true);
    expect(r.flags.restated).toEqual([]);
  });

  it("skip 경로(창 미성립)에도 flags.restated는 실린다(빈 배열, undefined 아님)", () => {
    const r = computeDrivers(gaapOf({ ...revenue5yr }), dei);
    expect(r.ok).toBe(false);
    expect(r.flags.restated).toEqual([]);
  });
});

// STEP 967 §3-4 — 은행형 매출(순이자수익+비이자수익) 폴백 회귀.
describe("computeDrivers — 은행형 매출 폴백(STEP 967)", () => {
  const niiNonint5yr = {
    InterestIncomeExpenseNet: flowFacts(five(700)),
    NoninterestIncome: flowFacts(five(300)),
  };
  const bankFullOk = { ...niiNonint5yr, ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr, ...shares5yr, ...capexDna4yr };
  const fullOk = { ...revenue5yr, ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr, ...shares5yr, ...capexDna4yr };

  it("Revenues 계열(REV 4종)이 있으면 폴백이 발동하지 않는다 — 표준 경로 값 그대로", () => {
    // 표준 REV 태그와 은행형 태그가 둘 다 있어도(가상 상황) REV가 우선이어야 한다(기존 경로 무변경 원칙).
    const r = computeDrivers(gaapOf({ ...fullOk, ...niiNonint5yr }), dei);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.flags.revenuePath).toBe("standard");
      expect(r.drivers.startingSales).toBe(1000); // REV_TAG값(1000) — NII+NonInt(700+300=1000)와 우연히 같아도 출처는 REV여야 함
    }
    expect(r.fundamentals.sourceTags.revenue).toBe(REV_TAG);
  });

  it("NII+비이자만 있으면(REV 4종 전무) 폴백이 발동하고 합계가 맞는다", () => {
    const r = computeDrivers(gaapOf(bankFullOk), dei);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.flags.revenuePath).toBe("bank");
      expect(r.drivers.startingSales).toBe(1000); // 700(NII) + 300(NonInt)
    }
    expect(r.fundamentals.revenue).toBe(1000);
    expect(r.fundamentals.sourceTags.revenue).toBe("InterestIncomeExpenseNet+NoninterestIncome");
  });

  it("NII만 있고 비이자수익이 없으면(REV 4종도 전무) 폴백이 발동하지 않는다 — 창 미성립", () => {
    const niiOnly = { InterestIncomeExpenseNet: flowFacts(five(700)) };
    const r = computeDrivers(gaapOf({ ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr, ...shares5yr, ...capexDna4yr, ...niiOnly }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.skipReason).toBe("INSUFFICIENT_HISTORY");
    expect(r.flags.revenuePath).toBe("standard"); // 폴백도 실패 — 기본값 유지
    expect(r.fundamentals.revenue).toBeNull(); // 부분합 금지 — NII만으로 revenue를 채우지 않는다
  });

  it("비이자수익만 있고 NII가 없으면(REV 4종도 전무) 폴백이 발동하지 않는다 — 창 미성립", () => {
    const nonIntOnly = { NoninterestIncome: flowFacts(five(300)) };
    const r = computeDrivers(gaapOf({ ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr, ...shares5yr, ...capexDna4yr, ...nonIntOnly }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.skipReason).toBe("INSUFFICIENT_HISTORY");
    expect(r.flags.revenuePath).toBe("standard");
  });

  it("아무 매출 재료도 없으면 flags.revenuePath는 기본값 'standard'로 남는다(빈 값 아님)", () => {
    const r = computeDrivers(gaapOf({}), dei);
    expect(r.ok).toBe(false);
    expect(r.flags.revenuePath).toBe("standard");
  });
});

// STEP 951 §1 — resolveYearWindow: 종목별 실재 최신 5개 연도 계산의 유일한 출처. 6개 케이스 전부.
// 커스텀 end 날짜가 필요해 이 블록 전용 flowFacts를 따로 둔다(파일 상단의 flowFacts는 end를 `${y}-12-31`로 고정).
function flowFactsAt(entries: [number, string, number][]): Fact[] {
  // entries: [calYear라벨(주석용, 실제 귀속은 end로 계산), end날짜, 값]
  return entries.map(([, end, val]) => ({ form: "10-K", start: `${+end.slice(0, 4) - 1}-${end.slice(5)}`, end, filed: `${+end.slice(0, 4) + 1}-02-01`, val }));
}
describe("resolveYearWindow(STEP 951 §1) — 창 계산 6케이스", () => {
  it("① 연속 5개가 있으면 최신 5개를 그대로 고른다", () => {
    const gaap = gaapOf({ [REV_TAG]: flowFacts({ 2021: 100, 2022: 110, 2023: 120, 2024: 130, 2025: 140 }) });
    const r = resolveYearWindow(gaap, { size: 5, maxYear: 2026 });
    expect(r.years).toEqual([2021, 2022, 2023, 2024, 2025]);
    expect(r.latestAvailable).toBe(2025);
  });

  it("② 최신 쪽에 6개 이상 있으면 최신 5개만 고른다", () => {
    const gaap = gaapOf({ [REV_TAG]: flowFacts({ 2019: 90, 2020: 95, 2021: 100, 2022: 110, 2023: 120, 2024: 130, 2025: 140 }) }); // 7개 연속
    const r = resolveYearWindow(gaap, { size: 5, maxYear: 2026 });
    expect(r.years).toEqual([2021, 2022, 2023, 2024, 2025]);
  });

  it("③ 중간에 구멍이 있으면 null + reason NON_CONTIGUOUS", () => {
    // 2020,2021,2022,2024,2025(2023 빠짐) — 정확히 5개지만 연속이 아님
    const gaap = gaapOf({ [REV_TAG]: flowFacts({ 2020: 90, 2021: 95, 2022: 100, 2024: 120, 2025: 130 }) });
    const r = resolveYearWindow(gaap, { size: 5, maxYear: 2026 });
    expect(r.years).toBeNull();
    expect(r.reason).toBe("NON_CONTIGUOUS");
    expect(r.latestAvailable).toBe(2025); // 구멍이 있어도 "본 최신 연도" 자체는 보고한다
  });

  it("④ 4개뿐이면 null(size 미달)", () => {
    const gaap = gaapOf({ [REV_TAG]: flowFacts({ 2022: 100, 2023: 110, 2024: 120, 2025: 130 }) });
    const r = resolveYearWindow(gaap, { size: 5, maxYear: 2026 });
    expect(r.years).toBeNull();
    expect(r.latestAvailable).toBe(2025);
  });

  it("⑤ maxYear를 넘는 연도가 섞이면 그 연도를 배제하고 그 아래에서 5개를 고른다", () => {
    // 2026·2027은 오늘(가정: maxYear=2025) 기준 아직 존재할 수 없는 미래 데이터 — 배제 후 2021~2025 5개가 남는다
    const gaap = gaapOf({ [REV_TAG]: flowFacts({ 2021: 100, 2022: 110, 2023: 120, 2024: 130, 2025: 140, 2026: 150, 2027: 160 }) });
    const r = resolveYearWindow(gaap, { size: 5, maxYear: 2025 });
    expect(r.years).toEqual([2021, 2022, 2023, 2024, 2025]);
    expect(r.latestAvailable).toBe(2025); // 2027이 아니라 2025 — maxYear 밖은 latestAvailable 계산에도 안 들어간다
  });

  it("⑥ 회계연도 종료월이 1월(1~5월 경계)이면 전년도로 귀속된다(NVDA형 FYE)", () => {
    // end=2026-01-25 → calYear(month=01<=5) = 2025. 5개 연속 회계연도(각각 다음해 1월 종료)가 2021~2025로 귀속돼야 한다.
    const gaap = gaapOf({
      [REV_TAG]: flowFactsAt([
        [2021, "2022-01-29", 100], [2022, "2023-01-28", 110], [2023, "2024-01-26", 120],
        [2024, "2025-01-25", 130], [2025, "2026-01-24", 140],
      ]),
    });
    const r = resolveYearWindow(gaap, { size: 5, maxYear: 2026 });
    expect(r.years).toEqual([2021, 2022, 2023, 2024, 2025]);
    expect(r.latestAvailable).toBe(2025); // 2026이 아니라 2025 — 1월 종료가 전년도로 정확히 귀속됨
  });
});

// STEP 951 §3-1/§3-4 — computeDrivers가 window 실패를 어휘 그대로(INSUFFICIENT_HISTORY) 반환하고,
// 성공 시 flags.yearWindow로 창을 남기는지 엔드투엔드로 확인.
describe("computeDrivers — 창 게이트 배선(STEP 951 §3)", () => {
  it("창이 안 잡히면(4개뿐) 기존 skipReason INSUFFICIENT_HISTORY를 그대로 쓰고 flags.windowReason에 새 사유를 싣는다", () => {
    const gaap = gaapOf({ [REV_TAG]: flowFacts({ 2022: 100, 2023: 110, 2024: 120, 2025: 130 }) });
    const r = computeDrivers(gaap, dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("INSUFFICIENT_HISTORY");
      expect(r.flags.windowReason).toBe("TOO_FEW_YEARS");
    }
  });

  it("창이 5개 연속(2021~2025)으로 잡히면 성공 시 flags.yearWindow·windowSize·latestAvailable이 실린다", () => {
    const gaap = gaapOf({
      [REV_TAG]: flowFacts({ 2021: 1000, 2022: 1000, 2023: 1000, 2024: 1000, 2025: 1000 }),
      OperatingIncomeLoss: flowFacts({ 2021: 100, 2022: 100, 2023: 100, 2024: 100, 2025: 100 }),
      PropertyPlantAndEquipmentNet: stockFacts({ 2021: 500, 2022: 500, 2023: 500, 2024: 500, 2025: 500 }),
      AssetsCurrent: stockFacts({ 2021: 300, 2022: 300, 2023: 300, 2024: 300, 2025: 300 }),
      LiabilitiesCurrent: stockFacts({ 2021: 200, 2022: 200, 2023: 200, 2024: 200, 2025: 200 }),
      CashAndCashEquivalentsAtCarryingValue: stockFacts({ 2021: 50, 2022: 50, 2023: 50, 2024: 50, 2025: 50 }),
      WeightedAverageNumberOfDilutedSharesOutstanding: { unit: "shares", facts: flowFacts({ 2021: 10, 2022: 10, 2023: 10, 2024: 10, 2025: 10 }) },
    });
    const r = computeDrivers(gaap, dei);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.flags.yearWindow).toEqual([2021, 2022, 2023, 2024, 2025]);
      expect(r.flags.windowSize).toBe(5);
      expect(r.flags.latestAvailable).toBe(2025);
      expect(r.market.latestYear).toBe(2025);
      expect(r.fundamentals.fiscalYear).toBe(2025); // 947 fiscalYear가 새 창의 최신 연도를 따른다(§3-5)
    }
  });
});

// STEP 951 §4-3 — 이 변경의 가장 큰 사고 위험: 서로 다른 창을 가진 두 종목을 같이 처리해도 결과가 안 섞이는지.
// computeDrivers는 완전 동기 함수라 진짜 레이스는 안 나지만(모듈 레벨 가변 상태를 아예 없앴으므로 구조적으로 불가능),
// "지난 호출의 창이 다음 호출에 새어들지 않는가"를 회귀 잠금한다 — module-level let을 되살리는 리팩터가 오면 이 테스트가 깨진다.
describe("computeDrivers — 창 격리(STEP 951 §4-3, 병렬 안전성 회귀 방지)", () => {
  const gaapOld = gaapOf({ [REV_TAG]: flowFacts({ 2016: 100, 2017: 100, 2018: 100, 2019: 100, 2020: 100 }) }); // 옛 창(2016~2020)
  const gaapNew = gaapOf({ [REV_TAG]: flowFacts({ 2021: 100, 2022: 100, 2023: 100, 2024: 100, 2025: 100 }) }); // 새 창(2021~2025)

  it("Promise.all로 동시에 넣어도 각자의 창을 유지한다(섞이지 않음)", async () => {
    const [rOld, rNew] = await Promise.all([Promise.resolve(computeDrivers(gaapOld, dei)), Promise.resolve(computeDrivers(gaapNew, dei))]);
    // 둘 다 매출 5년만 있고 나머지 재료가 없어 INSUFFICIENT_HISTORY는 아니고 그 다음 게이트(MISSING_TAG_OPERATING_INCOME)에서 skip —
    // 그 skip 자체가 아니라 fundamentals.fiscalYear(=각자의 latestAvailable)가 안 섞였는지를 본다.
    expect(rOld.fundamentals.fiscalYear).toBe(2020);
    expect(rNew.fundamentals.fiscalYear).toBe(2025);
  });

  it("호출 순서를 바꿔 반복해도(구형→신형→구형) 창이 새지 않는다", () => {
    const r1 = computeDrivers(gaapOld, dei);
    const r2 = computeDrivers(gaapNew, dei);
    const r3 = computeDrivers(gaapOld, dei);
    expect(r1.fundamentals.fiscalYear).toBe(2020);
    expect(r2.fundamentals.fiscalYear).toBe(2025);
    expect(r3.fundamentals.fiscalYear).toBe(2020); // r2 처리 후에도 r1과 동일한 입력엔 동일한 결과
  });
});

// STEP 969 §3-3 — 부채 「0 / 값 / 모름」 3분류 회귀. fullOk는 이 describe 전용으로 다시 조립(모듈 상단 5년 픽스처 재사용).
describe("computeDrivers — 부채 3분류(STEP 969)", () => {
  const equity5yr = { StockholdersEquity: stockFacts(five(400)) };
  const netIncomeLoss5yr = { NetIncomeLoss: flowFacts(five(80)) };
  const fullOkDebt = { ...revenue5yr, ...oi5yr, ...ppe5yr, ...bs5yr, ...cashOp5yr, ...shares5yr, ...capexDna4yr, ...equity5yr, ...netIncomeLoss5yr };

  it("배열 밖 태그(예: ConvertibleDebtNoncurrent)만 있어도 잡힌다 — 969에서 새로 추가된 태그", () => {
    const conv5yr = { ConvertibleDebtNoncurrent: stockFacts(five(1000)) };
    const r = computeDrivers(gaapOf({ ...fullOkDebt, ...conv5yr }), dei);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.market.debt).toBe(1000);
      expect(r.flags.debtBasis).toBe("tagged");
    }
  });

  it("Including/ExcludingCurrentMaturities 단일총액 태그가 둘 다 있어도 이중계상하지 않는다(하나만 채택)", () => {
    const dual5yr = {
      DebtAndCapitalLeaseObligations: stockFacts(five(5000)),
      LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities: stockFacts(five(7000)),
    };
    const r = computeDrivers(gaapOf({ ...fullOkDebt, ...dual5yr }), dei);
    expect(r.ok).toBe(true);
    // coalesceMap은 배열 순서상 먼저 나오는 태그(DebtAndCapitalLeaseObligations)를 채택 — 5000+7000=12000이 되면 이중계상 버그.
    if (r.ok) expect(r.market.debt).toBe(5000);
  });

  it("부채꼴 태그가 전무하면 debt=0·debtBasis='none'(진짜 무차입)", () => {
    const r = computeDrivers(gaapOf({ ...fullOkDebt }), dei);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.market.debt).toBe(0); expect(r.flags.debtBasis).toBe("none"); }
  });

  it("배열이 못 잡는 부채꼴 태그(예: SeniorNotes)만 있으면 UNRESOLVED_DEBT로 skip한다(0으로 채우지 않는다)", () => {
    const unresolved5yr = { SeniorNotes: stockFacts(five(2000)) };
    const r = computeDrivers(gaapOf({ ...fullOkDebt, ...unresolved5yr }), dei);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.skipReason).toBe("UNRESOLVED_DEBT");
      expect(r.flags.debtBasis).toBe("unresolved");
      expect(r.flags.debtTagsSeen).toEqual(["SeniorNotes"]);
    }
  });
});
