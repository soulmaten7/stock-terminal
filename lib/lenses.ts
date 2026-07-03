// 결정론적 "기법 렌즈" 계산 — 무료층. 가격/기본지표만으로 단기·장기 "방향 라벨"을 산출.
// 원칙: 예측(❌)이 아니라 해석(⭕). 근거 수치를 항상 함께 노출(투명). 여기선 순수 계산만(테스트 쉬움).
// 데이터(가격배열·PER·PBR)는 라우트에서 조달해 주입.

import { momentum121FromDaily, momentumLabel } from "./momentum";
import { realizedVol, volLabel } from "./lowvol";
import { sma, rsi, rsiState, maTrend } from "./technical";
import { LENS_COPY, type Locale } from "./lensCopy";

export type LensRead = {
  key: string;
  nameEn: string; // 영문 정식 명칭(앵커 — 세계 공통)
  name: string;   // 한글 짧은 명칭
  summary: string; // 한 줄 요약(언제/무엇에 쓰나)
  about: string; // 이 기법이란?(개념·유래·왜 쓰나 — 쉬운 설명)
  grade: string; // 신뢰도 배지 텍스트(카드 겉면 — 얼마나 믿을 만한가)
  gradeTier: "strong" | "partial" | "ref"; // 배지 색 계열
  short: string | null; // 단기 방향 라벨
  long: string | null;  // 장기 방향 라벨
  detail: Record<string, number | null>; // 근거 수치(투명 공개)
  note?: string; // 상세 검증 근거·한계(접기)
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
export function momentumLens(closes: number[], locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].momentum;
  const r1 = ret(closes, 21), r3 = ret(closes, 63), r6 = ret(closes, 126), r12 = ret(closes, 252);
  const m121 = momentum121FromDaily(closes);
  const avg = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const lab = (v: number | null) => (v == null ? null : v > 5 ? "강세" : v < -5 ? "약세" : "중립");
  return {
    key: "momentum",
    grade: "검증",
    gradeTier: "strong",
    nameEn: "Momentum (12-1)",
    name: c.name,
    summary: c.what,
    about: "오른 주식은 한동안 더 오르는 '관성'이 시장에 있다는 아이디어예요. 1993년 제가디시·티트만이 데이터로 처음 밝혔고, 좋은 소식에 사람들이 천천히 반응하는 심리 때문이라 봐요 — 그래서 최근 강한 주식을 따라가는 추세추종에 씁니다.",
    short: lab(avg([r1, r3])),
    long: momentumLabel(m121),
    detail: { "12-1모멘텀%": round(m121), "1개월%": round(r1), "3개월%": round(r3), "6개월%": round(r6), "12개월%": round(r12) },
    note: "12-1 모멘텀(Jegadeesh-Titman): 롱숏(고−저 3분위·150개월) 백테스트에서 방향성이 통계적으로 유의(t≈2.5·샤프 0.71·양(+)의 달 67%), 거래비용 차감·시장/규모/가치(FF3) 조정 후에도 유지 — '추세 지속' 방향은 견고. 단 수익 '수준'은 생존편향·동일가중으로 부풀려져 실전 기대치 아님(방향이 맞다는 뜻이지 수익 보장 아님). 주가 $5+ 투자가능 종목 한정 — 페니스탁 포함 시 역전.",
  };
}

// ── 기술 렌즈 ── 단기=RSI(과열/침체), 장기=200일선 대비(추세)
export function technicalLens(closes: number[], locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].technical;
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
    grade: "참고용",
    gradeTier: "ref",
    nameEn: "Technical (RSI · MA)",
    name: c.name,
    summary: c.what,
    about: "차트의 가격·패턴으로 '지금 과열인지, 추세가 위인지'를 보는 전통적 기술적 분석이에요. RSI는 1978년 와일더가 만든 과열·침체 지표, 이동평균선은 일정 기간의 평균 가격이에요 — 단기 흐름을 빠르게 훑는 참고 도구예요(단독 신호로는 약함).",
    short: shortLab,
    long: longLab,
    detail: {
      "RSI(14)": round(r),
      "200일선대비%": last != null && ma200 ? round((last / ma200 - 1) * 100) : null,
      "52주위치%": round(pos52),
    },
    note: "기술 신뢰도 재검(월별 롱숏·153개월): RSI 침체매수(저RSI−고RSI)는 오히려 손실(연 −8.7%·CAPM 알파 t≈−2.0로 유의하게 음)이고 회전율 66%로 비용 최악 → 평균회귀 완전 기각(과열=모멘텀이 이김). 200일선 위−아래는 방향 +지만 통계 약함(t≈1.6)이고 모멘텀 팩터에 흡수 = 독립 신호 아님(모멘텀의 약한 사촌). → RSI·52주위치·이동평균은 '지금 상태' 표시일 뿐 매매신호 아님, 추세는 모멘텀 렌즈로. 참고용.",
  };
}

// ── 밸류(가치) 렌즈 ── 검증: 투자가능($5+)서 싼(고 E/P·B/M) 종목이 비싼 종목 대비 우위(정설이나 우리 표본선 약함).
// ⚠️ 라벨은 "저평가/고평가"(가치 판단·verdict) 대신 "낮음/보통/높음"(PER 수준 사실)로 — 절대 임계값의 verdict는 검증 밖(상대·섹터내 비교가 맞음). 중립 표시.
export function valuationLens(pe: number | null, pb: number | null, locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].valuation;
  const peLab = pe == null || pe <= 0 ? null : pe < 10 ? "낮음" : pe > 25 ? "높음" : "보통";
  return {
    key: "valuation",
    grade: "표본 약함",
    gradeTier: "partial",
    nameEn: "Value (E/P · B/M)",
    name: c.name,
    summary: c.what,
    about: "기업의 이익·순자산에 비해 주가가 싼 '가치주'를 사는 접근이에요. 벤저민 그레이엄의 가치투자에서 출발해, 파마·프렌치가 '싼 주식이 장기적으로 낫다'(가치 프리미엄)를 데이터로 정립했어요 — 시장이 인기 없는 주식을 과하게 싸게 판다는 생각이 바탕이에요.",
    short: null,
    long: peLab,
    detail: { PER: round(pe), PBR: round(pb) },
    note: "밸류(가치)는 학계 정설 팩터(Fama-French HML) — 우리 백테스트도 이를 재현(βHML≈0.71). 단 우리 표본(2010~24) 월별 롱숏에선 통계적으로 약함(E/P t≈0.9·B/M t≈1.5, 유의 미달) — 최근 ~15년 가치주 부진(성장주 우위)과 일치. 방향은 +(연 +6~9%)·연1회 리밸런스라 비용 낮으나 '지금 시기 유효'라 단정 못 함. PER·PBR은 단일종목 절대값이라 같은 업종 내 상대비교로(섹터·성장성 무시 오독). 예측·보장 아님.",
  };
}

// ── 저변동성 렌즈 ── 실현변동성(위험). 검증: 투자가능($5+) 유니버스서 저변동군이 위험 낮고 수익 우위.
export function lowVolLens(closes: number[], locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].lowvol;
  const vol = realizedVol(closes, 252);
  return {
    key: "lowvol",
    grade: "검증(방어)",
    gradeTier: "strong",
    nameEn: "Low Volatility (BAB)",
    name: c.name,
    summary: c.what,
    about: "덜 흔들리는 안정적 주식이 크게 요동치는 주식보다 위험 대비 성과가 낫다는 발견이에요(저변동성 이례현상). '대박'을 노려 변동 큰 주식에 사람이 몰려 비싸지고, 지루한 우량주는 저평가되기 때문이라 설명해요 — 방어·위험 관리에 씁니다.",
    short: null,
    long: volLabel(vol),
    detail: { "연변동성%": round(vol) },
    note: "저변동성(BAB): 백테스트(투자가능 $5+·161개월)에서 저변동군 위험이 고변동군의 ~18%로 극적으로 낮고(방어), 위험조정 알파 유의(CAPM t≈3.1·FF3 t≈2.6, 시장베타 음(−)=방어적). 회전율 낮아 거래비용에도 강함 → 위험관리·방어 렌즈로 유효. 단 '저변동이 수익도 더 높다'는 단순 수익차는 통계적으로 약함(롱숏 t≈1.6), 수준도 편향 과대 → 수익 우위 단정 아님, 위험대비가 핵심. 보장 아님.",
  };
}
