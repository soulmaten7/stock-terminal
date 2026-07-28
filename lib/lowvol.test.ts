import { describe, it, expect } from "vitest";
import { realizedVol, volState } from "./lowvol";

// STEP 801 — 실현변동성 = 일간수익률 표준편차 × √252 × 100. 값 검증(스냅샷 아님).
// 종가를 수익률로부터 곱셈 생성 → realizedVol이 재계산한 수익률이 정확히 원래 수익률과 일치.
function closesFromReturns(start: number, rets: number[]): number[] {
  const out = [start];
  for (const r of rets) out.push(out[out.length - 1] * (1 + r));
  return out;
}

describe("realizedVol — √252 연율화 (STEP 803: 최소 수익률 120개)", () => {
  it("독립 계산과 일치(표본표준편차 × √252 × 100)", () => {
    // 결정론 패턴으로 130개 수익률 생성(≥120) — Math.random 없이 재현 가능.
    const rets = Array.from({ length: 130 }, (_, i) => (i % 2 === 0 ? 1 : -1) * (0.002 + (i % 7) * 0.0015));
    const closes = closesFromReturns(100, rets);
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const varc = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (rets.length - 1);
    const expected = Math.sqrt(varc) * Math.sqrt(252) * 100;
    expect(realizedVol(closes)!).toBeCloseTo(expected, 6);
  });
  it("변동 없음(상수 수익률) → 0", () => {
    const closes = closesFromReturns(100, Array(130).fill(0.001));
    expect(realizedVol(closes)!).toBeCloseTo(0, 9);
  });
  it("종가 120개 미만 → null (표본 부족·백분위 제외)", () => {
    expect(realizedVol(Array(60).fill(100))).toBeNull();
  });
  it("유효 수익률 120개 미만 → null", () => {
    // 총 130개지만 앞 100개가 0이라 seg[i-1]>0 필터로 유효 수익률이 120 미만
    const closes = [...Array(100).fill(0), ...Array(30).fill(100)];
    expect(realizedVol(closes)).toBeNull();
  });
});

describe("volState — 25/45 컷", () => {
  it("경계", () => {
    expect(volState(24)).toBe("low");
    expect(volState(25)).toBe("mid"); // <25라야 low
    expect(volState(46)).toBe("high");
    expect(volState(45)).toBe("mid"); // >45라야 high
    expect(volState(null)).toBeNull();
  });
});
