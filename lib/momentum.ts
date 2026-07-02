// 12-1 모멘텀 (Jegadeesh-Titman) — 팩터 중 대형주에서도 실증 근거가 비교적 견고한 신호.
// 정의: (1개월 전 종가 / 12개월 전 종가 − 1). 최근 1개월 제외 = 단기 반전(reversal) 회피.
// 백테스트(scripts/backtest_momentum)와 렌즈가 이 함수를 공유 → 구현·검증 일치.

export function momentum121(price12moAgo: number | null, price1moAgo: number | null): number | null {
  if (price12moAgo == null || price1moAgo == null || price12moAgo <= 0 || price1moAgo <= 0) return null;
  return (price1moAgo / price12moAgo - 1) * 100;
}

// 12개월 기준 강세/중립/약세 라벨. 임계값(±20%)은 첫 버전 — 백테스트/분포로 튜닝 여지.
export function momentumLabel(mom: number | null): string | null {
  if (mom == null) return null;
  return mom > 20 ? "강세" : mom < -20 ? "약세" : "중립";
}

// 일봉 종가 배열에서 12-1 모멘텀 계산(대략 거래일: 12개월≈252, 1개월≈21 전).
export function momentum121FromDaily(closes: number[]): number | null {
  if (closes.length < 252) return null;
  const p12 = closes[closes.length - 252];
  const p1 = closes[closes.length - 21];
  return momentum121(p12, p1);
}
