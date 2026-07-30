// STEP 833 — US 유니버스 취득 완전성 순수 판정 값 잠금(스냅샷 아님).
// 잠그는 것: §1 결측 분류(조용히 안 버림) · §2 취득 게이트(커버리지·구성 → 컷 차단·🔴 핵심) · §3 정상화 churn diff 스킵.
import { describe, it, expect } from "vitest";
import { classifyCaps, capGateDecision, churnDecision } from "./lensPrecompute";

describe("§1 classifyCaps — 결측을 조용히 안 버린다", () => {
  it("cap 있음→capOf · 응답엔 있으나 cap 없음/0→noCapField · 응답에 없음→noResponse", () => {
    const { capOf, noCapField, noResponse } = classifyCaps(
      ["A", "B", "C", "D"],
      [{ symbol: "A", marketCap: 100 }, { symbol: "B", marketCap: 0 }, { symbol: "C" }],
    );
    expect(capOf.get("A")).toBe(100);
    expect([...capOf.keys()]).toEqual(["A"]);
    expect(noCapField.sort()).toEqual(["B", "C"]); // B=cap0, C=필드없음(둘 다 응답엔 있음)
    expect(noResponse).toEqual(["D"]);             // 요청했으나 응답에 없음
  });
});

// 헬퍼: 상위 200 메가캡 티어 + freshSet 구성
const priorTop200 = Array.from({ length: 200 }, (_, i) => `MEGA${i}`);

describe("§2 capGateDecision — 편향 표본으로 컷 만들기 차단(🔴 핵심)", () => {
  it("커버리지 < 97%면 게이트 실패(컷 차단)", () => {
    const g = capGateDecision(0.95, priorTop200, new Set(priorTop200));
    expect(g.coverageOk).toBe(false);
    expect(g.cutGateOk).toBe(false);
  });
  it("구성: 직전 상위 200 메가캡이 오늘 fresh서 대량 소실(832)이면 게이트 실패", () => {
    const freshMissingMega = new Set<string>(["X1", "X2"]); // 메가캡 하나도 fresh 아님
    const g = capGateDecision(0.986, priorTop200, freshMissingMega);
    expect(g.compRatio).toBe(0); // 200 중 0
    expect(g.compositionOk).toBe(false);
    expect(g.cutGateOk).toBe(false);
  });
  it("정상: 커버·구성 모두 통과면 cutGateOk", () => {
    const g = capGateDecision(0.986, priorTop200, new Set(priorTop200));
    expect(g.cutGateOk).toBe(true);
    expect(g.compRatio).toBe(1);
  });
  it("정상화(ADD): freshSet이 상위 200을 '포함'하면 오탐 없음(추가는 reference를 안 지움)", () => {
    const superset = new Set([...priorTop200, ...Array.from({ length: 300 }, (_, i) => `NEW${i}`)]);
    const g = capGateDecision(0.986, priorTop200, superset);
    expect(g.cutGateOk).toBe(true);
  });
  it("부트스트랩(기록 <100)이면 구성 게이트 스킵 → 커버리지만", () => {
    const g = capGateDecision(0.986, ["ONLY", "TWO"], new Set());
    expect(g.compositionOk).toBe(true); // 스킵
    expect(g.cutGateOk).toBe(true);
  });
  it("KR: coverageMin 0.95 오버라이드 + 구성 스킵(priorTop=[]) — 96% 통과·94% 실패", () => {
    // KR은 우리 DB(kr_stock_snapshot·시총 100% 정상) → 구성 게이트 미적용(priorTop=[]), 커버리지 95% 임계.
    expect(capGateDecision(0.96, [], new Set(), { coverageMin: 0.95 }).cutGateOk).toBe(true);
    expect(capGateDecision(0.94, [], new Set(), { coverageMin: 0.95 }).cutGateOk).toBe(false);
  });
  it("경계: 정확히 95% 구성이면 통과, 94.5%면 실패", () => {
    const fresh95 = new Set(priorTop200.slice(0, 190)); // 190/200=95%
    expect(capGateDecision(0.986, priorTop200, fresh95).cutGateOk).toBe(true);
    const fresh94 = new Set(priorTop200.slice(0, 189)); // 189/200=94.5%
    expect(capGateDecision(0.986, priorTop200, fresh94).cutGateOk).toBe(false);
  });
});

describe("§3 churnDecision — 정상화(구성 대폭 변화) 시 diff 스킵", () => {
  const universe = Array.from({ length: 1000 }, (_, i) => `U${i}`);
  it("churn > 10%(정상화·202 복귀 ~20%)면 diff 스킵", () => {
    const prior = new Set([...universe.slice(0, 800), ...Array.from({ length: 200 }, (_, i) => `OLD${i}`)]); // 800 겹침·200 다름
    const { churn, skipChangeDiff } = churnDecision(universe, prior);
    expect(churn).toBeCloseTo(0.2, 5);
    expect(skipChangeDiff).toBe(true);
  });
  it("churn < 10%(정상일)면 diff 기록", () => {
    const prior = new Set([...universe.slice(0, 980), ...Array.from({ length: 20 }, (_, i) => `OLD${i}`)]);
    const { churn, skipChangeDiff } = churnDecision(universe, prior);
    expect(churn).toBeCloseTo(0.02, 5);
    expect(skipChangeDiff).toBe(false);
  });
  it("직전 유니버스 없음(부트스트랩)이면 churn 0·기록", () => {
    expect(churnDecision(universe, new Set()).skipChangeDiff).toBe(false);
  });
});
