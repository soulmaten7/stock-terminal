// 결정론적 "기법 렌즈" 계산 — 무료층. 가격/기본지표만으로 단기·장기 "방향 라벨"을 산출.
// 원칙: 예측(❌)이 아니라 해석(⭕). 근거 수치를 항상 함께 노출(투명). 여기선 순수 계산만(테스트 쉬움).
// 데이터(가격배열·PER·PBR)는 라우트에서 조달해 주입.

import { momentum121FromDaily, momentumLabel } from "./momentum";
import { realizedVol, volLabel } from "./lowvol";
import { sma, rsi, rsiState, maTrend } from "./technical";

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
    note: "12-1 모멘텀(Jegadeesh-Titman): 롱숏(고−저 3분위·150개월) 백테스트에서 방향성이 통계적으로 유의(t≈2.5·샤프 0.71·양(+)의 달 67%), 거래비용 차감·시장/규모/가치(FF3) 조정 후에도 유지 — '추세 지속' 방향은 견고. 단 수익 '수준'은 생존편향·동일가중으로 부풀려져 실전 기대치 아님(방향이 맞다는 뜻이지 수익 보장 아님). 주가 $5+ 투자가능 종목 한정 — 페니스탁 포함 시 역전.",
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
  const shortLab = rsiState(r);
  const longLab = maTrend(last, ma200);
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
    note: "검증 결과(투자가능 $5+·2014~24): RSI 침체/과열의 '평균회귀'는 미작동 — 오히려 과열 종목이 이후 3개월 더 나았음(+1.14% vs 침체 +0.23%). 추세 지속(모멘텀)이 평균회귀를 압도하기 때문. 200일선 위 종목은 아래보다 +0.76%p/3M(연 ~3%) 우위지만 완만·단독 신호로는 약함. → RSI·52주위치는 '지금 상태' 표시일 뿐 매매신호 아님, 추세는 모멘텀 렌즈로 보는 게 나음. 참고용.",
  };
}

// ── 밸류(가치) 렌즈 ── 검증: 투자가능($5+)서 싼(고 E/P·B/M) 종목이 비싼 종목 대비 이후수익 우위(E/P 강함·B/M 조건부).
// 표시는 단일종목 절대 PER·PBR(러프) — 검증된 건 "상대적으로 싼 것"의 우위지 절대 임계값이 아님. 섹터내 상대비교로.
export function valuationLens(pe: number | null, pb: number | null): LensRead {
  const peLab = pe == null || pe <= 0 ? null : pe < 10 ? "저평가" : pe > 25 ? "고평가" : "적정";
  return {
    key: "valuation",
    name: "밸류(가치)",
    short: null,
    long: peLab,
    detail: { PER: round(pe), PBR: round(pb) },
    note: "가치 프리미엄 검증됨: 투자가능($5+) 종목에서 E/P(순이익/시총=1/PER) 상위(싼)군이 하위(비싼)군 대비 이후 12개월 +10.2%p/년(13년 중 11년 우위). B/M(장부/시총=1/PBR)은 +5.5%p·조건부(성장주 강세기 2018~19엔 역전). 단 이 카드의 PER·PBR은 단일종목 절대값 — 같은 업종 내 상대비교로 볼 것(섹터·성장성 무시하면 오독). 예측·보장 아님.",
  };
}

// ── 저변동성 렌즈 ── 실현변동성(위험). 검증: 투자가능($5+) 유니버스서 저변동군이 위험 낮고 수익 우위.
export function lowVolLens(closes: number[]): LensRead {
  const vol = realizedVol(closes, 252);
  return {
    key: "lowvol",
    name: "저변동성(위험)",
    short: null,
    long: volLabel(vol),
    detail: { "연변동성%": round(vol) },
    note: "실현변동성=위험. 백테스트(투자가능 종목)서 저변동군이 고변동 대비 위험 낮고 수익도 우위(위험대비 우수) — 방어·위험관리 관점. 수익 보장 아님.",
  };
}
