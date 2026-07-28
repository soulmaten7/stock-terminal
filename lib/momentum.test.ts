import { describe, it, expect } from "vitest";
import { momentum121, momentum121FromDaily, momentumState } from "./momentum";

// STEP 801 — 값 검증(스냅샷 아님). 12-1 = (1개월 전 / 12개월 전 − 1)·100, 룩백 [t-252, t-21].
describe("momentum121", () => {
  it("(p1/p12 − 1)·100", () => {
    expect(momentum121(100, 130)!).toBeCloseTo(30, 9);
    expect(momentum121(120, 90)!).toBeCloseTo(-25, 9);
  });
  it("결측·0·음수 분모/분자 → null", () => {
    expect(momentum121(null, 100)).toBeNull();
    expect(momentum121(100, null)).toBeNull();
    expect(momentum121(0, 100)).toBeNull();
    expect(momentum121(100, 0)).toBeNull();
    expect(momentum121(-5, 100)).toBeNull();
  });
});

describe("momentum121FromDaily — 룩백이 정확히 [len-252, len-21]", () => {
  it("252 길이: index 0(p12)·231(p1)만 사용", () => {
    const closes = Array.from({ length: 252 }, () => 999);
    closes[0] = 100;   // len-252
    closes[231] = 120; // len-21
    expect(momentum121FromDaily(closes)!).toBeCloseTo(20, 9);
  });
  it("300 길이: 맨 뒤 기준 [48, 279]만 사용", () => {
    const closes = Array.from({ length: 300 }, () => 7);
    closes[300 - 252] = 200;
    closes[300 - 21] = 260;
    expect(momentum121FromDaily(closes)!).toBeCloseTo(30, 9);
  });
  it("p12·p1 외 인덱스 변조는 결과 불변", () => {
    const base = Array.from({ length: 252 }, () => 50);
    base[0] = 100; base[231] = 150;
    const m = momentum121FromDaily(base)!;
    const mutated = [...base];
    mutated[100] = 9999; mutated[200] = 1; mutated[251] = 42; // 룩백 밖
    expect(momentum121FromDaily(mutated)!).toBeCloseTo(m, 9);
  });
  it("252 미만 → null", () => {
    expect(momentum121FromDaily(Array(251).fill(100))).toBeNull();
    expect(momentum121FromDaily([])).toBeNull();
  });
});

describe("momentumState — ±20% 컷", () => {
  it("경계", () => {
    expect(momentumState(21)).toBe("strong");
    expect(momentumState(20)).toBe("neutral"); // >20이라야 strong
    expect(momentumState(-21)).toBe("weak");
    expect(momentumState(0)).toBe("neutral");
    expect(momentumState(null)).toBeNull();
  });
});
