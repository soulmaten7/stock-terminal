// STEP 943 §5 — sectorCut·bootstrap 유닛테스트. STEP 944 §5 — decideApplied·cutIfApplied·toResolvedRows.
import { describe, it, expect } from "vitest";
import { pctile, sectorCut, bootstrap, mulberry32, decideApplied, cutIfApplied, toResolvedRows } from "./sectorCuts";

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

// STEP 944 §5
describe("decideApplied", () => {
  it("widthOverIqr이 임계값 이하면 applied:true·exclude_reason:null", () => {
    const d = decideApplied({ p30Width: 1, p70Width: 1, iqr: 2, p30WidthOverIqr: 0.5, p70WidthOverIqr: 0.4 }, 1.0);
    expect(d).toEqual({ applied: true, excludeReason: null, widthOverIqr: 0.5 });
  });

  it("widthOverIqr이 임계값 초과면 applied:false·사유 문자열에 임계값 포함", () => {
    const d = decideApplied({ p30Width: 3, p70Width: 1, iqr: 2, p30WidthOverIqr: 1.5, p70WidthOverIqr: 0.4 }, 1.0);
    expect(d.applied).toBe(false);
    expect(d.widthOverIqr).toBe(1.5);
    expect(d.excludeReason).toBe("bootstrap_width_over_iqr=1.50 > 1");
  });

  it("🔑 943 실측 재현: Real Estate valuation(1.99) 임계1.0에서 제외 · 임계2.0에서는 포함", () => {
    const b = { p30Width: 0, p70Width: 0, iqr: 1, p30WidthOverIqr: 1.99, p70WidthOverIqr: 0.5 };
    expect(decideApplied(b, 1.0).applied).toBe(false);
    expect(decideApplied(b, 2.0).applied).toBe(true);
  });

  it("🔑 임계값을 바꾸면 applied 집합이 바뀐다(943의 7개 제외 조합 재현)", () => {
    const combos = [1.99, 1.58, 1.46, 1.27, 1.16, 1.16, 1.01]; // 943 §제외 7건의 widthOverIqr
    const under1 = combos.filter((w) => decideApplied({ p30Width: 0, p70Width: 0, iqr: 1, p30WidthOverIqr: w, p70WidthOverIqr: 0 }, 1.0).applied);
    const under2 = combos.filter((w) => decideApplied({ p30Width: 0, p70Width: 0, iqr: 1, p30WidthOverIqr: w, p70WidthOverIqr: 0 }, 2.0).applied);
    expect(under1.length).toBe(0); // 943 확정대로 임계 1.0에서 전부 제외
    expect(under2.length).toBe(7); // 임계 2.0으로 올리면 전부 포함 — 집합이 바뀜을 증명
  });
});

describe("cutIfApplied", () => {
  it("🔴 944 §5-2: applied=false면 null(시장 전체 컷 폴백 없음)", () => {
    expect(cutIfApplied({ applied: false, lo: 1, hi: 2 })).toBeNull();
  });

  it("행 자체가 없으면(undefined) null", () => {
    expect(cutIfApplied(undefined)).toBeNull();
  });

  it("applied=true면 lo·hi를 그대로 반환", () => {
    expect(cutIfApplied({ applied: true, lo: 1, hi: 2 })).toEqual({ lo: 1, hi: 2 });
  });
});

describe("toResolvedRows", () => {
  it("resolveSector Map을 us_sector_resolved 행으로 변환한다(값을 다시 계산하지 않음)", () => {
    const resolved = new Map([
      ["AAPL", { sector: "Information Technology", source: "spdr" as const, crossCheck: { nasdaq: "Information Technology", sic: null, yahoo: "Information Technology", disagree: false } }],
    ]);
    const rows = toResolvedRows("2026-08-08", ["AAPL", "NOTFOUND"], resolved);
    expect(rows).toEqual([
      { as_of: "2026-08-08", symbol: "AAPL", sector: "Information Technology", source: "spdr", cross_nasdaq: "Information Technology", cross_sic: null, cross_yahoo: "Information Technology", disagree: false },
      { as_of: "2026-08-08", symbol: "NOTFOUND", sector: null, source: null, cross_nasdaq: null, cross_sic: null, cross_yahoo: null, disagree: null },
    ]);
  });
});
