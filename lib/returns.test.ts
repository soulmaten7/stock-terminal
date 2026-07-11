import { describe, it, expect } from "vitest";
import { pct, marketCap, perFrom, pbrFrom } from "./returns";

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

describe("밸류 파생 — 야후 PER/PBR 없을 때(한국 .KS) 재무로 산출", () => {
  it("marketCap = 가격 × 주식수", () => {
    expect(marketCap(285000, 6_630_180_138)).toBeCloseTo(285000 * 6_630_180_138);
    expect(marketCap(null, 100)).toBeNull();
    expect(marketCap(100, 0)).toBeNull();
    expect(marketCap(100, undefined)).toBeNull();
  });

  it("PER = 시총 / 순이익 (적자·0이면 null)", () => {
    expect(perFrom(1_000_000, 100_000)).toBeCloseTo(10);
    expect(perFrom(1_000_000, -5)).toBeNull(); // 적자 → PER 없음
    expect(perFrom(1_000_000, 0)).toBeNull();
    expect(perFrom(null, 100)).toBeNull();
  });

  it("PBR = 시총 / 자기자본 (0·음수면 null)", () => {
    expect(pbrFrom(1_000_000, 250_000)).toBeCloseTo(4);
    expect(pbrFrom(1_000_000, 0)).toBeNull();
    expect(pbrFrom(null, 100)).toBeNull();
  });

  it("삼성전자 실측 근사: PER·PBR이 양수로 산출된다 (야후 null이던 것)", () => {
    const mc = marketCap(285000, 6_630_180_138);
    expect(perFrom(mc, 44_260_956_000_000)).toBeGreaterThan(0); // ~42
    expect(pbrFrom(mc, 424_313_255_000_000)).toBeGreaterThan(0); // ~4.5
  });
});
