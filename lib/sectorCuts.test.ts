// STEP 943 §5 — sectorCut·bootstrap 유닛테스트.
import { describe, it, expect } from "vitest";
import { pctile, sectorCut, bootstrap, mulberry32 } from "./sectorCuts";

describe("pctile", () => {
  it("알려진 배열에서 정확한 p30/p70을 낸다(선형보간)", () => {
    // 1..10 정렬됨. idx = (10-1)*0.3 = 2.7 → sorted[2]+((sorted[3]-sorted[2])*0.7) = 3+0.7=3.7
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(pctile(sorted, 0.3)).toBeCloseTo(3.7, 6);
    // idx=(10-1)*0.7=6.3 → sorted[6]+((sorted[7]-sorted[6])*0.3)=7+0.3=7.3
    expect(pctile(sorted, 0.7)).toBeCloseTo(7.3, 6);
  });
});

describe("sectorCut", () => {
  it("결측(NaN·Infinity)이 섞인 배열에서 결측을 제외하고 계산한다", () => {
    const values = [...Array(25).fill(0).map((_, i) => i + 1), NaN, Infinity, -Infinity];
    const c = sectorCut(values);
    expect(c?.n).toBe(25); // 결측 3개 제외
  });

  it("🔴 n < 20이면 null(행을 만들지 않는다)", () => {
    const values = Array.from({ length: 19 }, (_, i) => i + 1);
    expect(sectorCut(values)).toBeNull();
  });

  it("n = 20이면 계산된다(경계값)", () => {
    const values = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(sectorCut(values)).not.toBeNull();
    expect(sectorCut(values)?.n).toBe(20);
  });
});

describe("bootstrap", () => {
  it("🔴 고정 시드에서 재현된다(같은 입력 → 같은 구간)", () => {
    const values = Array.from({ length: 50 }, (_, i) => i + 1);
    const r1 = bootstrap(values, mulberry32(12345), 200);
    const r2 = bootstrap(values, mulberry32(12345), 200);
    expect(r1).toEqual(r2);
  });

  it("다른 시드면 결과가 달라질 수 있다(동일하지 않음을 확인 — 결정론 오검출 방지)", () => {
    const values = Array.from({ length: 50 }, (_, i) => i + 1);
    const r1 = bootstrap(values, mulberry32(1), 200);
    const r2 = bootstrap(values, mulberry32(2), 200);
    expect(r1).not.toEqual(r2);
  });

  it("IQR 대비 비율을 함께 낸다", () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const r = bootstrap(values, mulberry32(1), 200);
    expect(r.iqr).toBeGreaterThan(0);
    expect(r.p30WidthOverIqr).not.toBeNull();
    expect(r.p70WidthOverIqr).not.toBeNull();
  });
});
