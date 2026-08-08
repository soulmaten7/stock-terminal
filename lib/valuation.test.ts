// STEP 947 §5-3 — 손계산 검산(규칙 5-1 ④). 4개 조건(흑자·무차입 / 흑자·유차입 / 적자 / 자기자본 음수) 각각을 손으로 계산해 하드코딩.
//
// 🔴 지시 원문은 "us_fundamentals에서 조건에 맞는 첫 종목을 사전순으로 뽑아 쓴다"였으나, us_fundamentals는 이 STEP 시점에
//   0행이다(revdcf 크론이 아직 안 돌았음 — §7-5가 "0이어야 정상"이라고 명시한 바로 그 상태). 뽑을 실제 종목이 없어
//   합성 픽스처(Case A~D, 라운드 넘버)로 대체했다 — 이 테스트의 목적은 "실제 회사 값이 맞는지"가 아니라
//   "VALUATION_SPEC이 서술하는 4개 식을 코드가 정확히 구현했는지"이므로 손계산 검산 자체는 온전히 유효하다.
//   실제 종목 기반 재검증은 크론이 한 번 돌아 us_fundamentals가 채워진 뒤 별도로 필요하다(7-5에 미해결로 기록).
import { describe, it, expect } from "vitest";
import { computeValuation, VALUATION_SPEC, type ValuationInputs } from "./valuation";

describe("VALUATION_SPEC — 정의 고정(규칙 5-1) — docs/VALUATION_SPEC.md와 글자 그대로 일치해야 한다(§6-2)", () => {
  it("4개 축의 formula·unavailableWhen이 고정 문자열이다", () => {
    expect(VALUATION_SPEC.per.formula).toBe("marketCap / netIncome");
    expect(VALUATION_SPEC.per.basis).toBe("annual");
    expect(VALUATION_SPEC.pbr.formula).toBe("marketCap / equity");
    expect(VALUATION_SPEC.psr.formula).toBe("marketCap / revenue");
    expect(VALUATION_SPEC.evEbitda.formula).toBe("(marketCap + debt - nonOperatingAssets) / (operatingIncome + dna)");
  });
});

describe("computeValuation — 손계산 검산 4케이스(§5-3)", () => {
  // Case A — 흑자·무차입: PER=20 · PBR=5 · PSR=2.5 · EV=1,000,000,000-0-100,000,000(비영업자산)... debt=0이라 EV=900,000,000, EBITDA=70,000,000 → EV/EBITDA=12.857142857142858
  it("Case A: 흑자·무차입", () => {
    const inp: ValuationInputs = { marketCap: 1_000_000_000, netIncome: 50_000_000, equity: 200_000_000, revenue: 400_000_000, operatingIncome: 60_000_000, dna: 10_000_000, debt: 0, nonOperatingAssets: 100_000_000 };
    const r = computeValuation(inp);
    expect(r.per).toBe(20);
    expect(r.pbr).toBe(5);
    expect(r.psr).toBe(2.5);
    expect(r.ebitda).toBe(70_000_000);
    expect(r.ev).toBe(900_000_000);
    expect(r.evEbitda).toBeCloseTo(12.857142857142858, 10);
    expect(r.unavailable).toEqual({});
  });

  // Case B — 흑자·유차입: PER=20 · PBR=4 · PSR=2.5 · EBITDA=200,000,000 · EV=2,000,000,000+300,000,000-50,000,000=2,250,000,000 → EV/EBITDA=11.25
  it("Case B: 흑자·유차입", () => {
    const inp: ValuationInputs = { marketCap: 2_000_000_000, netIncome: 100_000_000, equity: 500_000_000, revenue: 800_000_000, operatingIncome: 150_000_000, dna: 50_000_000, debt: 300_000_000, nonOperatingAssets: 50_000_000 };
    const r = computeValuation(inp);
    expect(r.per).toBe(20);
    expect(r.pbr).toBe(4);
    expect(r.psr).toBe(2.5);
    expect(r.ebitda).toBe(200_000_000);
    expect(r.ev).toBe(2_250_000_000);
    expect(r.evEbitda).toBe(11.25);
    expect(r.unavailable).toEqual({});
  });

  // Case C — 적자(순손실): PER은 미성립(NEGATIVE_EARNINGS). PBR=5 · PSR=5/3. EBITDA는 흑자(30M+10M=40,000,000) —
  //   순손실이어도 EBITDA는 양수일 수 있다는 걸 같이 확인한다(이자·세금 때문에 순손실인 케이스).
  it("Case C: 적자(순손실) — PER만 미성립, 나머지는 계산된다", () => {
    const inp: ValuationInputs = { marketCap: 500_000_000, netIncome: -20_000_000, equity: 100_000_000, revenue: 300_000_000, operatingIncome: 30_000_000, dna: 10_000_000, debt: 100_000_000, nonOperatingAssets: 20_000_000 };
    const r = computeValuation(inp);
    expect(r.per).toBeNull();
    expect(r.unavailable.per).toBe("NEGATIVE_EARNINGS");
    expect(r.pbr).toBe(5);
    expect(r.psr).toBeCloseTo(5 / 3, 10);
    expect(r.ebitda).toBe(40_000_000);
    expect(r.ev).toBe(580_000_000);
    expect(r.evEbitda).toBe(14.5);
  });

  // Case D — 자기자본 음수(자본잠식): PBR만 미성립(NEGATIVE_EQUITY). PER=30 · PSR=2 · EV/EBITDA=19.6
  it("Case D: 자기자본 음수(자본잠식) — PBR만 미성립, 나머지는 계산된다", () => {
    const inp: ValuationInputs = { marketCap: 300_000_000, netIncome: 10_000_000, equity: -50_000_000, revenue: 150_000_000, operatingIncome: 20_000_000, dna: 5_000_000, debt: 200_000_000, nonOperatingAssets: 10_000_000 };
    const r = computeValuation(inp);
    expect(r.per).toBe(30);
    expect(r.pbr).toBeNull();
    expect(r.unavailable.pbr).toBe("NEGATIVE_EQUITY");
    expect(r.psr).toBe(2);
    expect(r.evEbitda).toBe(19.6);
  });
});

describe("computeValuation — 미성립 경계(규칙 5-1 ⑤ — 빈 칸을 null로만 두지 않는다)", () => {
  const base: ValuationInputs = { marketCap: 1_000_000_000, netIncome: 50_000_000, equity: 200_000_000, revenue: 400_000_000, operatingIncome: 60_000_000, dna: 10_000_000, debt: 0, nonOperatingAssets: 100_000_000 };

  it("marketCap이 없으면 4축 전부 미성립(MISSING_MARKET_CAP)", () => {
    const r = computeValuation({ ...base, marketCap: null });
    expect(r.per).toBeNull(); expect(r.pbr).toBeNull(); expect(r.psr).toBeNull(); expect(r.evEbitda).toBeNull();
    expect(r.unavailable).toEqual({ per: "MISSING_MARKET_CAP", pbr: "MISSING_MARKET_CAP", psr: "MISSING_MARKET_CAP", evEbitda: "MISSING_MARKET_CAP" });
  });

  it("netIncome이 null(결측)이면 MISSING_NET_INCOME — 0(적자)과 다른 사유", () => {
    const r = computeValuation({ ...base, netIncome: null });
    expect(r.unavailable.per).toBe("MISSING_NET_INCOME");
  });

  it("operatingIncome은 있는데 dna가 null이면 EV/EBITDA만 MISSING_DNA", () => {
    const r = computeValuation({ ...base, dna: null });
    expect(r.evEbitda).toBeNull();
    expect(r.unavailable.evEbitda).toBe("MISSING_DNA");
    expect(r.per).toBe(20); // 다른 축은 영향 없음
  });

  it("🔴 debt·nonOperatingAssets가 null(driver 전체 성공 전이라 미수집)이면 EV/EBITDA는 MISSING_MARKET_DATA — 0으로 가정하지 않는다", () => {
    const r = computeValuation({ ...base, debt: null, nonOperatingAssets: null });
    expect(r.evEbitda).toBeNull();
    expect(r.unavailable.evEbitda).toBe("MISSING_MARKET_DATA");
  });

  it("EBITDA가 0 이하이면 NEGATIVE_EBITDA", () => {
    const r = computeValuation({ ...base, operatingIncome: -30_000_000, dna: 10_000_000 }); // ebitda = -20,000,000
    expect(r.ebitda).toBe(-20_000_000);
    expect(r.evEbitda).toBeNull();
    expect(r.unavailable.evEbitda).toBe("NEGATIVE_EBITDA");
  });

  it("revenue가 정확히 0이면(결측 아님) PSR 미성립(NEGATIVE_REVENUE — '<=0' 조건)", () => {
    const r = computeValuation({ ...base, revenue: 0 });
    expect(r.psr).toBeNull();
    expect(r.unavailable.psr).toBe("NEGATIVE_REVENUE");
  });
});
