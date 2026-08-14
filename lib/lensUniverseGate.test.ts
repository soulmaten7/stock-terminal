// STEP 833 — US 유니버스 취득 완전성 순수 판정 값 잠금(스냅샷 아님).
// 잠그는 것: §1 결측 분류(조용히 안 버림) · §2 취득 게이트(커버리지·구성 → 컷 차단·🔴 핵심) · §3 정상화 churn diff 스킵.
// 🔴 STEP 1031(2026-08-14, 장은태 승인) — §2의 coverageOk 산식이 고정 97% 임계에서 "급락 탐지"(절대 하한 85%+
//   전일 대비 낙폭 상한 3%p)로 전환됐다. 기존 11개 케이스는 지우지 않고 보존 — 값이 바뀐 것은 한 케이스뿐(아래 표시),
//   나머지 10개는 이 STEP과 무관하게 그대로 통과한다(구 산식·신 산식 양쪽에서 같은 결과가 나오는 값들이라서).
//   새 산식 전용 케이스는 "§2b 새 산식(STEP1031)" 블록에 추가했다.
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
  // 🔴 STEP 1031 — 이 케이스만 기대값이 바뀐다. 구 산식(고정 97% 임계)에서 95%는 실패였다.
  //   새 산식(절대 하한 85% + 낙폭 상한, priorCoverage 없으면 부트스트랩=절대 하한만 적용)에선 95%>=85%로 통과한다.
  //   "97% 자체가 근거 없이 높았다"가 아니라 "회복 경로가 전부 소진돼 97%를 못 넘는 게 정상이 됐다"(1017~1024)는
  //   판단에 따른 의도된 변화 — 절대 하한(85%)·낙폭(3%p) 두 축은 아래 §2b에서 별도로 검증한다.
  it("[STEP1031: 구산식 실패→신산식 통과] 커버리지 95%·전일 기록 없음(부트스트랩) → 절대하한(85%) 통과", () => {
    const g = capGateDecision(0.95, priorTop200, new Set(priorTop200));
    expect(g.coverageOk).toBe(true);
    expect(g.cutGateOk).toBe(true);
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
  // 🔴 STEP 1031 — 파라미터명 coverageMin(구 산식 전용)이 absFloor로 바뀌었다(coverageMin 자체는 삭제).
  //   KR은 priorCoverage를 안 넘겨(computeKrLensScores가 fetchPriorCoverage를 호출 안 함) 항상 부트스트랩 경로를 타므로
  //   absFloor만으로 절대 비교된다 — 값(0.95)·기대값(96%통과·94%실패) 전부 구 산식과 수치상 완전히 동일(KR 전면 동결 증명).
  it("KR: absFloor 0.95 오버라이드 + 구성 스킵(priorTop=[]) — 96% 통과·94% 실패", () => {
    // KR은 우리 DB(kr_stock_snapshot·시총 100% 정상) → 구성 게이트 미적용(priorTop=[]), 커버리지 95% 임계.
    expect(capGateDecision(0.96, [], new Set(), { absFloor: 0.95 }).cutGateOk).toBe(true);
    expect(capGateDecision(0.94, [], new Set(), { absFloor: 0.95 }).cutGateOk).toBe(false);
  });
  it("경계: 정확히 95% 구성이면 통과, 94.5%면 실패", () => {
    const fresh95 = new Set(priorTop200.slice(0, 190)); // 190/200=95%
    expect(capGateDecision(0.986, priorTop200, fresh95).cutGateOk).toBe(true);
    const fresh94 = new Set(priorTop200.slice(0, 189)); // 189/200=94.5%
    expect(capGateDecision(0.986, priorTop200, fresh94).cutGateOk).toBe(false);
  });
});

// 🔴 STEP 1031 신규 — "급락 탐지" 산식(ABS_FLOOR=0.85·DROP_LIMIT=0.03) 전용 케이스.
describe("§2b capGateDecision — 새 산식(STEP1031: 절대 하한 + 낙폭 상한)", () => {
  it("절대 하한 경계(부트스트랩, priorCoverage 없음): 85.0%는 통과·84.9%는 실패", () => {
    expect(capGateDecision(0.85, [], new Set()).coverageOk).toBe(true);
    expect(capGateDecision(0.849, [], new Set()).coverageOk).toBe(false);
  });
  it("낙폭 상한 경계: 전일 90%에서 딱 3%p 빠진 87%는 통과·3.1%p 빠진 86.9%는 실패", () => {
    const passing = capGateDecision(0.87, [], new Set(), { priorCoverage: 0.90, priorSource: "history" });
    expect(passing.coverageDrop).toBeCloseTo(0.03, 5);
    expect(passing.coverageOk).toBe(true);
    const failing = capGateDecision(0.869, [], new Set(), { priorCoverage: 0.90, priorSource: "history" });
    expect(failing.coverageOk).toBe(false); // 절대 하한(85%)은 통과하지만 낙폭(3.1%p>3%p)에 걸림
  });
  it("절대 하한을 넘어도 전일 대비 낙폭이 크면 실패(832형 급락 재현: 98.6%→50%)", () => {
    const g = capGateDecision(0.50, [], new Set(), { priorCoverage: 0.986, priorSource: "history" });
    expect(g.coverageOk).toBe(false); // 50%>=85% 절대하한은 실패지만, 낙폭(48.6%p)이 더 결정적인 실패 사유
  });
  it("priorCoverage=null(부트스트랩)이면 priorSource 기본값 'none' — 낙폭 조건 자동 스킵", () => {
    const g = capGateDecision(0.90, [], new Set());
    expect(g.priorCoverage).toBeNull();
    expect(g.priorSource).toBe("none");
    expect(g.coverageOk).toBe(true); // 90%>=85%, 낙폭 비교 대상(전일값) 없음
  });
  it("coverageOk·cutGateOk는 이제 newCoverageOk·newCutGateOk와 항상 일치한다(self-check, STEP1031 전환의 핵심)", () => {
    const cases = [
      capGateDecision(0.95, priorTop200, new Set(priorTop200)),
      capGateDecision(0.986, priorTop200, new Set(priorTop200)),
      capGateDecision(0.70, [], new Set(), { priorCoverage: 0.90 }),
      capGateDecision(0.90, [], new Set()),
    ];
    for (const g of cases) {
      expect(g.coverageOk).toBe(g.newCoverageOk);
      expect(g.cutGateOk).toBe(g.newCutGateOk);
    }
  });
  it("새 산식이 통과해도 compositionOk=false면 cutGateOk는 여전히 false(구성 게이트는 무변경)", () => {
    const freshMissingMega = new Set<string>(["X1", "X2"]); // 메가캡 하나도 fresh 아님(§2 두번째 케이스와 동일 시나리오)
    const g = capGateDecision(0.95, priorTop200, freshMissingMega); // coverageOk=true(새 산식 통과)이지만
    expect(g.coverageOk).toBe(true);
    expect(g.compositionOk).toBe(false);
    expect(g.cutGateOk).toBe(false); // AND 결합 — 구성 게이트가 여전히 진짜 안전장치
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
