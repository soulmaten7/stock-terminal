// STEP 985 §1 — 야후 quote 응답에서 marketCap을 얻는 순수함수. 🔴 어디에도 배선하지 않는다(크론 무접촉).
// 우선순위: 야후 원시 marketCap 필드 → sharesOutstanding × regularMarketPrice 재구성 → null.
// 원전: 시가총액 = 주가 × 발행주식수(shares outstanding, 시점값) — STEP975가 SEC 원자료로 검증한
// "외부는 기말 발행주식수" 개념과 동일(가중평균 희석주식수 아님). docs/probe_985_search.md ①-A.
// 재구성은 marketCap이 "없을 때만" 작동 — 기존 값이 있으면 그대로(값 대체 금지, STEP985 불변규칙).

export type MarketCapSource = "field" | "reconstructed" | null;

export type MarketCapResult = {
  marketCap: number | null;
  source: MarketCapSource;
  // null일 때만 채움 — 다음 규명의 재료(984 §1-2). 값은 담지 않고 키 이름만.
  availableFields?: string[];
};

function isPositiveNumber(v: unknown): v is number {
  return typeof v === "number" && isFinite(v) && v > 0;
}

export function resolveMarketCap(quote: Record<string, unknown>): MarketCapResult {
  if (isPositiveNumber(quote.marketCap)) {
    return { marketCap: quote.marketCap, source: "field" };
  }
  const shares = quote.sharesOutstanding;
  const price = quote.regularMarketPrice;
  if (isPositiveNumber(shares) && isPositiveNumber(price)) {
    return { marketCap: shares * price, source: "reconstructed" };
  }
  return { marketCap: null, source: null, availableFields: Object.keys(quote) };
}
