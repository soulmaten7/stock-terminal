// 저변동성(low-volatility anomaly) — 저변동 종목이 위험 대비(때로 절대) 성과가 나았던 이례현상.
// 실현변동성 = 최근 N거래일 일간수익률 표준편차 × √252 (연율화, %). 가격만 필요.
// 백테스트(scripts/backtest_lowvol)와 렌즈가 공유 → 구현·검증 일치.

// STEP 803 §6: 최소 표본 = 수익률 120개(≈6개월). 미달이면 표준오차가 커 252일 종목들과 한 줄로 백분위 비교할 수 없다 → null(계산 불가·백분위 제외).
const MIN_RETS = 120;
export function realizedVol(closes: number[], days = 252): number | null {
  if (closes.length < MIN_RETS + 1) return null;
  const seg = closes.slice(-(days + 1));
  const rets: number[] = [];
  for (let i = 1; i < seg.length; i++) if (seg[i - 1] > 0) rets.push(seg[i] / seg[i - 1] - 1);
  if (rets.length < MIN_RETS) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varc = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (rets.length - 1);
  return Math.sqrt(varc) * Math.sqrt(252) * 100;
}

// 연율 변동성 "상태"(언어중립). 표시 라벨은 언어별(lib/lensCopy LEVEL_LABELS.vol).
// ⚠️ 임계값(25/45%)은 렌즈 카드의 verdict 상태(20/40%)와 일부러 다름 — 기존 동작이라 통일하지 말 것.
export type VolState = "low" | "high" | "mid";
export function volState(v: number | null): VolState | null {
  if (v == null) return null;
  return v < 25 ? "low" : v > 45 ? "high" : "mid";
}
