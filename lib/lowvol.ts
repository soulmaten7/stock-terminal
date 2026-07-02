// 저변동성(low-volatility anomaly) — 저변동 종목이 위험 대비(때로 절대) 성과가 나았던 이례현상.
// 실현변동성 = 최근 N거래일 일간수익률 표준편차 × √252 (연율화, %). 가격만 필요.
// 백테스트(scripts/backtest_lowvol)와 렌즈가 공유 → 구현·검증 일치.

export function realizedVol(closes: number[], days = 252): number | null {
  if (closes.length < 30) return null;
  const seg = closes.slice(-(days + 1));
  const rets: number[] = [];
  for (let i = 1; i < seg.length; i++) if (seg[i - 1] > 0) rets.push(seg[i] / seg[i - 1] - 1);
  if (rets.length < 20) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varc = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (rets.length - 1);
  return Math.sqrt(varc) * Math.sqrt(252) * 100;
}

// 연율 변동성 라벨. 임계값(25/45%)은 첫 버전 — 분포·백테스트로 튜닝 여지.
export function volLabel(v: number | null): string | null {
  if (v == null) return null;
  return v < 25 ? "저변동" : v > 45 ? "고변동" : "보통";
}
