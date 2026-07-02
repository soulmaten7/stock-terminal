// 기술 지표(RSI·이동평균) 순수 계산 — 렌즈 표시와 백테스트가 "같은 함수"를 쓰게 공유(플레이북 §0-3: 엔진=검증 일치).
// 데이터(종가 배열)는 호출부에서 주입. 시점정합 백테스트는 D시점까지 slice해서 넣으면 됨.

export function sma(closes: number[], n: number): number | null {
  if (closes.length < n) return null;
  let s = 0;
  for (let i = closes.length - n; i < closes.length; i++) s += closes[i];
  return s / n;
}

// RSI(14) — Wilder 단순화(최근 period 평균).
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  const avgG = gain / period, avgL = loss / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

// RSI 상태 라벨(과열/침체/중립) — 렌즈·백테스트 공용.
export function rsiState(r: number | null): "과열" | "침체" | "중립" | null {
  return r == null ? null : r > 70 ? "과열" : r < 30 ? "침체" : "중립";
}

// 200일선 대비 추세 라벨 — 렌즈·백테스트 공용.
export function maTrend(last: number | null, ma200: number | null): "상승추세" | "하락추세" | null {
  return last != null && ma200 != null ? (last >= ma200 ? "상승추세" : "하락추세") : null;
}
