import { describe, it, expect } from "vitest";
import { sectorPercentiles, sectorMedian, sectorMedianRelative } from "./sectorRelative";

describe("sectorPercentiles — 손계산 검산(STEP 952 §3-4)", () => {
  it("기본 + 동점: [10,20,20,30,40] — 손계산: 0.0/0.2/0.2/0.6/0.8", () => {
    const r = sectorPercentiles([
      { symbol: "A", value: 10 },
      { symbol: "B", value: 20 },
      { symbol: "C", value: 20 },
      { symbol: "D", value: 30 },
      { symbol: "E", value: 40 },
    ]);
    expect(r.get("A")).toBeCloseTo(0.0);
    expect(r.get("B")).toBeCloseTo(0.2); // A(10)만 작음 → 1/5
    expect(r.get("C")).toBeCloseTo(0.2); // B와 동점 → 같은 백분위(중간순위 보정 없음)
    expect(r.get("D")).toBeCloseTo(0.6);
    expect(r.get("E")).toBeCloseTo(0.8);
  });

  it("유효표본 1개: [15,null,null,null,null] — 나머지 4개 결측, A만 유효(n=1)", () => {
    const r = sectorPercentiles([
      { symbol: "A", value: 15 },
      { symbol: "B", value: null },
      { symbol: "C", value: null },
      { symbol: "D", value: null },
      { symbol: "E", value: null },
    ]);
    expect(r.get("A")).toBeCloseTo(0.0); // 자기 자신 외 비교 대상 없음 → countLess=0/1
    expect(r.get("B")).toBeNull();
    expect(r.get("C")).toBeNull();
    expect(r.get("D")).toBeNull();
    expect(r.get("E")).toBeNull();
  });

  it("전부 결측: 5개 전부 null — 전부 null, NaN·크래시 없음", () => {
    const r = sectorPercentiles([
      { symbol: "A", value: null },
      { symbol: "B", value: null },
      { symbol: "C", value: null },
      { symbol: "D", value: null },
      { symbol: "E", value: null },
    ]);
    for (const s of ["A", "B", "C", "D", "E"]) expect(r.get(s)).toBeNull();
  });

  it("음수 혼재(적자 종목): [-10,-3,5,8,null] — 손계산: 0.0/0.25/0.5/0.75/null", () => {
    const r = sectorPercentiles([
      { symbol: "A", value: -10 },
      { symbol: "B", value: -3 },
      { symbol: "C", value: 5 },
      { symbol: "D", value: 8 },
      { symbol: "E", value: null },
    ]);
    expect(r.get("A")).toBeCloseTo(0.0);
    expect(r.get("B")).toBeCloseTo(0.25); // A(-10)만 작음 → 1/4
    expect(r.get("C")).toBeCloseTo(0.5); // A,B < 5 → 2/4
    expect(r.get("D")).toBeCloseTo(0.75); // A,B,C < 8 → 3/4
    expect(r.get("E")).toBeNull();
  });
});

describe("sectorMedian — 표준 정의(STEP 980)", () => {
  it("홀수 표본: [10,20,30,40,50] → 가운데 값 30", () => {
    expect(sectorMedian([50, 10, 40, 20, 30])).toBe(30);
  });
  it("짝수 표본: [10,20,30,40] → 가운데 두 값(20,30) 평균 25", () => {
    expect(sectorMedian([40, 10, 30, 20])).toBe(25);
  });
  it("빈 배열 → null", () => {
    expect(sectorMedian([])).toBeNull();
  });
  it("단일값 → 그 값 자체", () => {
    expect(sectorMedian([42])).toBe(42);
  });
});

describe("sectorMedianRelative — 업종 대비 정본(STEP 980)", () => {
  it("기본: [10,20,20,30,40] 중앙값=20 → 배율 0.5/1.0/1.0/1.5/2.0", () => {
    const { median, ratios } = sectorMedianRelative([
      { symbol: "A", value: 10 },
      { symbol: "B", value: 20 },
      { symbol: "C", value: 20 },
      { symbol: "D", value: 30 },
      { symbol: "E", value: 40 },
    ]);
    expect(median).toBe(20);
    expect(ratios.get("A")).toBeCloseTo(0.5);
    expect(ratios.get("B")).toBeCloseTo(1.0);
    expect(ratios.get("C")).toBeCloseTo(1.0);
    expect(ratios.get("D")).toBeCloseTo(1.5);
    expect(ratios.get("E")).toBeCloseTo(2.0);
  });

  it("음수는 이미 상류(computeValuation)에서 걸러져 이 함수에 도달하지 않는다 — null 항목은 분모·분자에서 제외", () => {
    const { median, ratios } = sectorMedianRelative([
      { symbol: "A", value: 10 },
      { symbol: "B", value: 20 },
      { symbol: "C", value: null }, // NEGATIVE_EARNINGS 등으로 상류에서 이미 null
      { symbol: "D", value: 30 },
    ]);
    expect(median).toBe(20); // [10,20,30] 중앙값
    expect(ratios.get("C")).toBeNull();
    expect(ratios.get("A")).toBeCloseTo(0.5);
  });

  it("중앙값이 0이면 배율은 null(0으로 나누지 않는다, 지어내지 않는다)", () => {
    const { median, ratios } = sectorMedianRelative([
      { symbol: "A", value: -1 }, // 이론상 도달 불가(음수는 상류에서 걸러짐)이나 방어적으로 0 중앙값 케이스만 검증
      { symbol: "B", value: 0 },
      { symbol: "C", value: 1 },
    ]);
    expect(median).toBe(0);
    for (const s of ["A", "B", "C"]) expect(ratios.get(s)).toBeNull();
  });

  it("극단 배율은 잘리지 않고 그대로 나온다(CSGP 1750x류) — 상한 없음", () => {
    const { median, ratios } = sectorMedianRelative([
      { symbol: "LOW1", value: 10 },
      { symbol: "LOW2", value: 15 },
      { symbol: "MED", value: 20 },
      { symbol: "HIGH1", value: 25 },
      { symbol: "EXTREME", value: 35010 }, // 중앙값(20) 대비 1750.5배
    ]);
    expect(median).toBe(20);
    expect(ratios.get("EXTREME")).toBeCloseTo(1750.5);
  });

  it("전부 결측 → 중앙값 null, 전부 null(크래시 없음)", () => {
    const { median, ratios } = sectorMedianRelative([
      { symbol: "A", value: null },
      { symbol: "B", value: null },
    ]);
    expect(median).toBeNull();
    expect(ratios.get("A")).toBeNull();
    expect(ratios.get("B")).toBeNull();
  });
});
