import { describe, it, expect } from "vitest";
import { pct } from "./returns";

describe("pct — 기간 수익률(%)", () => {
  it("정상 계산", () => {
    expect(pct(110, 100)).toBeCloseTo(10);
    expect(pct(90, 100)).toBeCloseTo(-10);
    expect(pct(100, 100)).toBe(0);
  });

  it("대세 상승장의 큰 수익률도 그대로 (clamp/가드 금지 — LENS_DEV #28)", () => {
    // 2026 반도체 랠리: 삼성전자 ~61,000 → 278,000 ≈ +355% (실측·진짜 데이터)
    expect(pct(278000, 61000)).toBeCloseTo(355.7, 0);
    // SK하이닉스류 대형주 +600%대도 오류 아님
    expect(pct(2186000, 297000)).toBeGreaterThan(600);
  });

  it("기준가 없음/0 또는 현재가 0 → null (신규상장 등은 '—')", () => {
    expect(pct(100, undefined)).toBeNull();
    expect(pct(100, null)).toBeNull();
    expect(pct(100, 0)).toBeNull();
    expect(pct(0, 100)).toBeNull();
  });
});
