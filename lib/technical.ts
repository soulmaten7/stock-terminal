// 기술 지표(RSI·이동평균) 순수 계산 — 렌즈 표시와 백테스트가 "같은 함수"를 쓰게 공유(플레이북 §0-3: 엔진=검증 일치).
// 데이터(종가 배열)는 호출부에서 주입. 시점정합 백테스트는 D시점까지 slice해서 넣으면 됨.

export function sma(closes: number[], n: number): number | null {
  if (closes.length < n) return null;
  let s = 0;
  for (let i = closes.length - n; i < closes.length; i++) s += closes[i];
  return s / n;
}

// RSI(14) — Wilder 재귀 평활(α = 1/period). STEP 801: 예전엔 최근 period 단순평균(=Cutler's RSI·별개 지표)이라
// 라벨("와일더가 만든 RSI")·증권사 HTS·TradingView 값과 어긋났음. 이제 원전(Wilder 1978) 정의로 교정.
//   1) 첫 period 변화량을 단순평균으로 시드 → 2) 이후 봉마다 avg = (avg*(period-1) + current) / period 로 평활.
// ⚠️ 전체 종가 계열을 써야 정확(마지막 period만 보면 안 됨) — 시드 후 처음부터 끝까지 평활.
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  // 1) 시드: 첫 period 변화량(closes[1..period])의 단순평균
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgG = gain / period, avgL = loss / period;
  // 2) 이후 봉: 와일더 재귀 평활
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

// RSI 상태(과열/침체/중립) — 렌즈·백테스트 공용. 언어중립 상태키(표시 라벨 = lib/lensCopy LEVEL_LABELS.rsi).
export function rsiState(r: number | null): "hot" | "cold" | "neutral" | null {
  return r == null ? null : r > 70 ? "hot" : r < 30 ? "cold" : "neutral";
}

// 200일선 대비 추세 상태 — 렌즈·백테스트 공용. 언어중립 상태키(표시 라벨 = lib/lensCopy LEVEL_LABELS.ma).
// ⚠️ 동가(last == ma200)는 up — 렌즈 카드의 verdict 상태(flat 존재)와 다름. 기존 동작이라 통일하지 말 것.
export function maTrendState(last: number | null, ma200: number | null): "up" | "down" | null {
  return last != null && ma200 != null ? (last >= ma200 ? "up" : "down") : null;
}
