// 결정론적 "기법 렌즈" 계산 — 무료층. 가격/기본지표만으로 단기·장기 "방향 라벨"을 산출.
// 원칙: 예측(❌)이 아니라 해석(⭕). 근거 수치를 항상 함께 노출(투명). 여기선 순수 계산만(테스트 쉬움).
// 데이터(가격배열·PER·PBR)는 라우트에서 조달해 주입.

import { momentum121FromDaily, momentumLabel } from "./momentum";

export type LensRead = {
  key: string;
  name: string;
  short: string | null; // 단기 방향 라벨
  long: string | null;  // 장기 방향 라벨
  detail: Record<string, number | null>; // 근거 수치(투명 공개)
  note?: string;
};

function round(v: number | null): number | null {
  return v == null || !isFinite(v) ? null : Math.round(v * 100) / 100;
}

// daysAgo 거래일 전 종가 대비 수익률(%)
function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

function sma(closes: number[], n: number): number | null {
  if (closes.length < n) return null;
  let s = 0;
  for (let i = closes.length - n; i < closes.length; i++) s += closes[i];
  return s / n;
}

// RSI(14) — Wilder 단순화(최근 period 평균)
function rsi(closes: number[], period = 14): number | null {
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

// ── 모멘텀 렌즈 ── 단기=1·3개월 추세 / 장기=검증된 12-1 모멘텀(lib/momentum 공유, 백테스트 +).
export function momentumLens(closes: number[]): LensRead {
  const r1 = ret(closes, 21), r3 = ret(closes, 63), r6 = ret(closes, 126), r12 = ret(closes, 252);
  const m121 = momentum121FromDaily(closes);
  const avg = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const lab = (v: number | null) => (v == null ? null : v > 5 ? "강세" : v < -5 ? "약세" : "중립");
  return {
    key: "momentum",
    name: "모멘텀(12-1)",
    short: lab(avg([r1, r3])),
    long: momentumLabel(m121),
    detail: { "12-1모멘텀%": round(m121), "1개월%": round(r1), "3개월%": round(r3), "6개월%": round(r6), "12개월%": round(r12) },
    note: "12-1 모멘텀은 백테스트(2013~·미국)에서 고모멘텀군이 저모멘텀군 대비 연 +4%p — 완만하지만 검증된 방향성. 비용·생존편향 전, 보장 아님.",
  };
}

// ── 기술 렌즈 ── 단기=RSI(과열/침체), 장기=200일선 대비(추세)
export function technicalLens(closes: number[]): LensRead {
  const r = rsi(closes);
  const last = closes.length ? closes[closes.length - 1] : null;
  const ma200 = sma(closes, 200);
  const win = closes.slice(-252);
  const hi = win.length ? Math.max(...win) : null;
  const lo = win.length ? Math.min(...win) : null;
  const pos52 = last != null && hi != null && lo != null && hi > lo ? ((last - lo) / (hi - lo)) * 100 : null;
  const shortLab = r == null ? null : r > 70 ? "과열" : r < 30 ? "침체" : "중립";
  const longLab = last != null && ma200 != null ? (last >= ma200 ? "상승추세" : "하락추세") : null;
  return {
    key: "technical",
    name: "기술",
    short: shortLab,
    long: longLab,
    detail: {
      "RSI(14)": round(r),
      "200일선대비%": last != null && ma200 ? round((last / ma200 - 1) * 100) : null,
      "52주위치%": round(pos52),
    },
  };
}

// ── 밸류에이션 렌즈 ── PER 절대기준 러프 판정(장기 관점). 섹터 맥락 없이는 참고용.
export function valuationLens(pe: number | null, pb: number | null): LensRead {
  const peLab = pe == null || pe <= 0 ? null : pe < 10 ? "저평가" : pe > 25 ? "고평가" : "적정";
  return {
    key: "valuation",
    name: "밸류에이션",
    short: null,
    long: peLab,
    detail: { PER: round(pe), PBR: round(pb) },
    note: "PER 절대기준 러프 판정 — 섹터·성장성 따라 다름(참고용). 과거 밴드 비교는 다음 단계.",
  };
}
