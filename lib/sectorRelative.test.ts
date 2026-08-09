import { describe, it, expect } from "vitest";
import { sectorPercentiles } from "./sectorRelative";

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
