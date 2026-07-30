// STEP 836 — KR 데이터 오염 봉인 값 잠금(스냅샷 아님).
// §1 거래소→접미사 · §2 오염 이름 감지 · §4 상수 계열(거래정지)이 calm(강점)이 아니라 결측인지.
import { describe, it, expect } from "vitest";
import { krYahooSuffix } from "./activeMarkets";
import { isContaminatedName } from "./lensCompute";
import { realizedVol } from "./lowvol";
import { lowVol } from "./lenses";
import type { StockData } from "./lenses/types";

function sd(closes: number[]): StockData {
  return { symbol: "005930", resolved: "005930.KS", name: "T", price: closes[closes.length - 1] ?? null, closes, pe: null, pb: null, financials: [] };
}
const CUTS = { lowvol: { lo: 20, hi: 40, n: 100, asOf: "2026-01-01" } };

describe("§1 krYahooSuffix — 거래소로 접미사(추측 제거)", () => {
  it("kosdaq→.KQ · kospi/기타/null→.KS", () => {
    expect(krYahooSuffix("kosdaq")).toBe(".KQ");
    expect(krYahooSuffix("kospi")).toBe(".KS");
    expect(krYahooSuffix(null)).toBe(".KS");
    expect(krYahooSuffix(undefined)).toBe(".KS");
  });
});

describe("§2 isContaminatedName — 야후 오염 종목명 감지", () => {
  it("콤마결합·모닝스타식별자(0P…)·.KS/.KQ 포함은 오염", () => {
    expect(isContaminatedName("000300.KS,0P0000KUKB,0")).toBe(true);
    expect(isContaminatedName("0P0000KUKB")).toBe(true);
    expect(isContaminatedName("005930.KS")).toBe(true);
  });
  it("정상 종목명은 통과", () => {
    expect(isContaminatedName("엔켐")).toBe(false);
    expect(isContaminatedName("Samsung Electronics")).toBe(false);
    expect(isContaminatedName("더존비즈온")).toBe(false);
    expect(isContaminatedName(null)).toBe(false);
  });
});

describe("§4 상수 계열(거래정지·무거래) → 변동성 결측(calm 금지)", () => {
  it("realizedVol: 상수 계열(분산 0)은 0이 아니라 null", () => {
    expect(realizedVol(Array(200).fill(1000))).toBeNull(); // 200일 상수
    // 미세하나마 움직이는 저변동주는 값이 나온다(정상)
    const wiggle = Array.from({ length: 200 }, (_, i) => 1000 + (i % 2 === 0 ? 1 : -1));
    expect(realizedVol(wiggle)).toBeGreaterThan(0);
  });
  it("lowVol 렌즈: 상수 계열 → 결측(calm 아님·강점으로 안 읽음)", async () => {
    const r = await lowVol.compute(sd(Array(200).fill(5000)), "ko", CUTS);
    expect(r.value).toBeNull();          // 변동성 결측(0 날조 아님)
    expect(r.state).not.toBe("calm");     // 🔴 강점(calm)으로 판정 금지
    expect(r.state == null || r.state === "na").toBe(true); // 집계에서 결측 처리(state null/na)
  });
});
