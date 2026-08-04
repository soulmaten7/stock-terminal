// STEP 899 §3 — lossMaking 판정이 모든 표면(종목상세·보드)에서 같아지도록 공유 규칙을 단위 테스트한다.
import { describe, it, expect } from "vitest";
import { isLossMaking } from "./lossMaking";

describe("isLossMaking — 899 (모든 표면 공유 규칙)", () => {
  it("영업이익률이 0 이하이면 적자다(0 포함)", () => {
    expect(isLossMaking(0)).toBe(true);
    expect(isLossMaking(-0.0996)).toBe(true); // AAL 실측값(2026-08-03)
    expect(isLossMaking(-0.021961214969669584)).toBe(true); // WBD 실측값 — years 판정인데 적자
  });

  it("영업이익률이 양수면 적자가 아니다", () => {
    expect(isLossMaking(0.0001)).toBe(false);
    expect(isLossMaking(0.15)).toBe(false);
  });

  it("null·undefined는 적자로 단정하지 않는다(계산 불가와 적자는 다른 상태)", () => {
    expect(isLossMaking(null)).toBe(false);
    expect(isLossMaking(undefined)).toBe(false);
  });
});
