// STEP 985 §1-3 — resolveMarketCap 단위테스트.
import { describe, it, expect } from "vitest";
import { resolveMarketCap } from "./marketCapReconstruct";

describe("resolveMarketCap", () => {
  it("marketCap 있으면 그대로, source=field", () => {
    const r = resolveMarketCap({ marketCap: 634342670336, sharesOutstanding: 4144947162, regularMarketPrice: 153.04 });
    expect(r).toEqual({ marketCap: 634342670336, source: "field" });
  });

  it("marketCap 없고 원재료 있으면 재구성, source=reconstructed", () => {
    const r = resolveMarketCap({ sharesOutstanding: 100, regularMarketPrice: 10 });
    expect(r).toEqual({ marketCap: 1000, source: "reconstructed" });
  });

  it("marketCap 있으면 재구성값이 달라도 원본을 덮지 않는다(값 대체 금지)", () => {
    const r = resolveMarketCap({ marketCap: 999, sharesOutstanding: 100, regularMarketPrice: 10 });
    expect(r).toEqual({ marketCap: 999, source: "field" });
  });

  it("둘 다 없으면 null + 필드목록(값은 안 담음)", () => {
    const r = resolveMarketCap({ symbol: "X", regularMarketVolume: 123 });
    expect(r.marketCap).toBeNull();
    expect(r.source).toBeNull();
    expect(r.availableFields).toEqual(["symbol", "regularMarketVolume"]);
  });

  it("sharesOutstanding이 0이면 재구성하지 않는다(지어내지 않음)", () => {
    const r = resolveMarketCap({ sharesOutstanding: 0, regularMarketPrice: 10 });
    expect(r.marketCap).toBeNull();
    expect(r.source).toBeNull();
  });

  it("sharesOutstanding이 음수면 재구성하지 않는다", () => {
    const r = resolveMarketCap({ sharesOutstanding: -5, regularMarketPrice: 10 });
    expect(r.marketCap).toBeNull();
    expect(r.source).toBeNull();
  });

  it("regularMarketPrice 결측이면 재구성하지 않는다", () => {
    const r = resolveMarketCap({ sharesOutstanding: 100 });
    expect(r.marketCap).toBeNull();
    expect(r.source).toBeNull();
    expect(r.availableFields).toEqual(["sharesOutstanding"]);
  });

  it("marketCap이 0이나 음수면 원시필드를 신뢰하지 않고 재구성을 시도한다", () => {
    const r = resolveMarketCap({ marketCap: 0, sharesOutstanding: 100, regularMarketPrice: 10 });
    expect(r).toEqual({ marketCap: 1000, source: "reconstructed" });
  });
});
