// 결정론적 "기법 렌즈" 계산 — 무료층. 가격/기본지표만으로 단기·장기 "방향 라벨"을 산출.
// 원칙: 예측(❌)이 아니라 해석(⭕). 근거 수치를 항상 함께 노출(투명). 여기선 순수 계산만(테스트 쉬움).
// 데이터(가격배열·PER·PBR)는 라우트에서 조달해 주입.

import { momentum121FromDaily, momentumLabel } from "./momentum";
import { realizedVol, volLabel } from "./lowvol";
import { sma, rsi, rsiState, maTrend } from "./technical";
import { LENS_COPY, LENS_READINGS, SPECTRUM_LABELS, LENS_OUTLOOK, type Locale } from "./lensCopy";

type Tone = "pos" | "warn" | "flat";
type Spectrum = { labels: [string, string, string]; active: number };
// 스펙트럼 3구간 — active(0~2)면 해당 칸 켜짐, -1이면 없음(데이터 없음/미적용).
function specOf(locale: Locale, key: keyof (typeof SPECTRUM_LABELS)["ko"], active: number): Spectrum | null {
  return active < 0 ? null : { labels: SPECTRUM_LABELS[locale][key], active };
}

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
  detail: Record<string, number | null>; // 근거 수치(투명 공개 — 카드에 그대로 노출)
  note?: string; // 상세 검증 근거·한계(접기)
  verdict?: { phrase: string; plain: string; tone: Tone } | null; // 직관 판정: 이 렌즈가 이 종목을 어떻게 읽는지(문장+쉬운해석+색조)
  spectrum?: Spectrum | null; // 3구간 스펙트럼(이 종목이 어디쯤인지) — 켜지는 칸=상태
  headline?: string | null;   // 판정 옆 핵심 숫자 한 개(12-1 +37% 등)
  outlook?: string | null;    // "이 기법 방향": 그 기법 방법대로의 시간축+유리/불리+정직 꼬리표(예측 아님·base-rate)
  value?: number | null;      // 스크리닝용 언어중립 대표 숫자(모멘텀=12-1%·저변동=연변동성%·밸류=PER·퀄리티=GP/A%·자산성장=성장%·기술=200일선대비%)
  state?: string | null;      // 스크리닝용 언어중립 상태키(up/down/flat · cheap/rich/mid/na · high/low · calm/jumpy · aggressive/conservative 등)
};

// "이 기법 방향" 문자열 — 상태 없으면 null.
function outlookOf(locale: Locale, key: keyof (typeof LENS_OUTLOOK)["ko"], state: string | null): string | null {
  return state ? LENS_OUTLOOK[locale][key][state] ?? null : null;
}

// 상태키 → reading(문장·해석) + 색조. 데이터 없으면 null.
function readOf(locale: Locale, key: keyof (typeof LENS_READINGS)["ko"], state: string | null, tone: Tone): { phrase: string; plain: string; tone: Tone } | null {
  if (!state) return null;
  const r = LENS_READINGS[locale][key][state];
  return r ? { phrase: r.phrase, plain: r.plain, tone } : null;
}

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
  const mState = m121 == null ? null : m121 > 10 ? "up" : m121 < -10 ? "down" : "flat";
  return {
    key: "momentum",
    grade: "검증",
    gradeTier: "strong",
    nameEn: "Momentum (12-1)",
    name: c.name,
    summary: c.what,
    about: c.about,
    short: lab(avg([r1, r3])),
    long: momentumLabel(m121),
    detail: { "12-1모멘텀%": round(m121), "1개월%": round(r1), "3개월%": round(r3), "6개월%": round(r6), "12개월%": round(r12) },
    verdict: readOf(locale, "momentum", mState, mState === "up" ? "pos" : mState === "down" ? "warn" : "flat"),
    spectrum: specOf(locale, "momentum", mState === "up" ? 2 : mState === "down" ? 0 : mState === "flat" ? 1 : -1),
    headline: m121 != null ? `12-1 ${round(m121)}%` : null,
    outlook: outlookOf(locale, "momentum", mState),
    value: round(m121),
    state: mState,
    note: "12-1 모멘텀(Jegadeesh-Titman): 롱숏(고−저 3분위·150개월) 백테스트에서 방향성이 통계적으로 유의(t≈2.5·샤프 0.71·양(+)의 달 67%), 거래비용 차감·시장/규모/가치(FF3) 조정 후에도 유지 — '추세 지속' 방향은 견고. 단 수익 '수준'은 생존편향·동일가중으로 부풀려져 실전 기대치 아님(방향이 맞다는 뜻이지 수익 보장 아님). 주가 $5+ 투자가능 종목 한정 — 페니스탁 포함 시 역전. · 3중 교차검증(초·중·후반 3구간·STEP559): 3구간 모두 +방향(전체 t≈3.6), 성장주 강세기(fold2)만 약화되나 부호 유지 = 시기 무관 단단.",
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
  const tState = last == null || ma200 == null ? null : last > ma200 ? "up" : last < ma200 ? "down" : "flat";
  return {
    key: "technical",
    grade: "참고용",
    gradeTier: "ref",
    nameEn: "Technical (RSI · MA)",
    name: c.name,
    summary: c.what,
    about: c.about,
    short: shortLab,
    long: longLab,
    detail: {
      "RSI(14)": round(r),
      "200일선대비%": last != null && ma200 ? round((last / ma200 - 1) * 100) : null,
      "52주위치%": round(pos52),
    },
    verdict: readOf(locale, "technical", tState, tState === "up" ? "pos" : tState === "down" ? "warn" : "flat"),
    spectrum: specOf(locale, "technical", tState === "up" ? 2 : tState === "down" ? 0 : tState === "flat" ? 1 : -1),
    headline: last != null && ma200 ? `200일선 ${round((last / ma200 - 1) * 100)}%` : null,
    outlook: outlookOf(locale, "technical", tState),
    value: last != null && ma200 ? round((last / ma200 - 1) * 100) : null,
    state: tState,
    note: "기술 신뢰도 재검(월별 롱숏·153개월): RSI 침체매수(저RSI−고RSI)는 오히려 손실(연 −8.7%·CAPM 알파 t≈−2.0로 유의하게 음)이고 회전율 66%로 비용 최악 → 평균회귀 완전 기각(과열=모멘텀이 이김). 200일선 위−아래는 방향 +지만 통계 약함(t≈1.6)이고 모멘텀 팩터에 흡수 = 독립 신호 아님(모멘텀의 약한 사촌). → RSI·52주위치·이동평균은 '지금 상태' 표시일 뿐 매매신호 아님, 추세는 모멘텀 렌즈로. 참고용. · 3중 교차검증(STEP559): 200일선 추세 성분은 3구간 견고(t≈2.7)하나 FF3는 모멘텀을 통제하지 못함 — 이 견고함은 모멘텀과 겹치는 신호일 뿐(독립 아님). 이미 모멘텀으로 검증된 방향이라 여기선 참고용 유지.",
  };
}

// ── 밸류(가치) 렌즈 ── 검증: 투자가능($5+)서 싼(고 E/P·B/M) 종목이 비싼 종목 대비 우위(정설이나 우리 표본선 약함).
// ⚠️ 라벨은 "저평가/고평가"(가치 판단·verdict) 대신 "낮음/보통/높음"(PER 수준 사실)로 — 절대 임계값의 verdict는 검증 밖(상대·섹터내 비교가 맞음). 중립 표시.
export function valuationLens(pe: number | null, pb: number | null, locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].valuation;
  const peLab = pe == null || pe <= 0 ? null : pe < 10 ? "낮음" : pe > 25 ? "높음" : "보통";
  const vState = pe == null || pe <= 0 ? "na" : pe < 10 ? "cheap" : pe > 25 ? "rich" : "mid";
  return {
    key: "valuation",
    grade: "표본 약함",
    gradeTier: "partial",
    nameEn: "Value (E/P · B/M)",
    name: c.name,
    summary: c.what,
    about: c.about,
    short: null,
    long: peLab,
    detail: { PER: round(pe), PBR: round(pb) },
    verdict: readOf(locale, "valuation", vState, vState === "cheap" ? "pos" : vState === "rich" ? "warn" : "flat"),
    spectrum: specOf(locale, "valuation", vState === "cheap" ? 0 : vState === "rich" ? 2 : vState === "mid" ? 1 : -1),
    headline: pe != null && pe > 0 ? `PER ${round(pe)}` : null,
    outlook: outlookOf(locale, "valuation", vState),
    value: round(pe),
    state: vState,
    note: "밸류(가치)는 학계 정설 팩터(Fama-French HML) — 우리 백테스트도 이를 재현(βHML≈0.71). 단 우리 표본(2010~24) 월별 롱숏에선 통계적으로 약함(E/P t≈0.9·B/M t≈1.5, 유의 미달) — 최근 ~15년 가치주 부진(성장주 우위)과 일치. 방향은 +(연 +6~9%)·연1회 리밸런스라 비용 낮으나 '지금 시기 유효'라 단정 못 함. PER·PBR은 단일종목 절대값이라 같은 업종 내 상대비교로(섹터·성장성 무시 오독). 예측·보장 아님. · 3중 교차검증(코호트 3분할·STEP560): fold2(2016~20 성장주 강세기) 방향 역전 = 표본 약함 + 시기 의존(가치주 부진기엔 안 됨). βHML0.72로 학계 HML은 재확인.",
  };
}

// ── 저변동성 렌즈 ── 실현변동성(위험). 검증: 투자가능($5+) 유니버스서 저변동군이 위험 낮고 수익 우위.
export function lowVolLens(closes: number[], locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].lowvol;
  const vol = realizedVol(closes, 252);
  const lvState = vol == null ? null : vol < 20 ? "calm" : vol > 40 ? "jumpy" : "mid";
  return {
    key: "lowvol",
    grade: "검증(방어)",
    gradeTier: "strong",
    nameEn: "Low Volatility (BAB)",
    name: c.name,
    summary: c.what,
    about: c.about,
    short: null,
    long: volLabel(vol),
    detail: { "연변동성%": round(vol) },
    verdict: readOf(locale, "lowvol", lvState, lvState === "calm" ? "pos" : lvState === "jumpy" ? "warn" : "flat"),
    spectrum: specOf(locale, "lowvol", lvState === "calm" ? 0 : lvState === "jumpy" ? 2 : lvState === "mid" ? 1 : -1),
    headline: vol != null ? `연변동성 ${round(vol)}%` : null,
    outlook: outlookOf(locale, "lowvol", lvState),
    value: round(vol),
    state: lvState,
    note: "저변동성(BAB): 백테스트(투자가능 $5+·161개월)에서 저변동군 위험이 고변동군의 ~18%로 극적으로 낮고(방어), 위험조정 알파 유의(CAPM t≈3.1·FF3 t≈2.6, 시장베타 음(−)=방어적). 회전율 낮아 거래비용에도 강함 → 위험관리·방어 렌즈로 유효. 단 '저변동이 수익도 더 높다'는 단순 수익차는 통계적으로 약함(롱숏 t≈1.6), 수준도 편향 과대 → 수익 우위 단정 아님, 위험대비가 핵심. 보장 아님. · 3중 교차검증(STEP559): 단순 저−고 수익 롱숏은 3구간서 음수·부호 뒤집힘 = '저변동이 수익도 더 높다'는 아님 재확인. 이 렌즈 근거는 raw 수익이 아니라 위험대비 방어(BAB 알파·낮은 위험)임.",
  };
}

// ── 퀄리티(Quality) 렌즈 ── Gross Profitability(GP/A, Novy-Marx). 검증: 고 GP/A가 저 GP/A 대비 우위(FF3 알파 유의).
// GP/A = 매출총이익/총자산. 라벨은 수준 서술(높음/보통/낮음 · verdict 아님). 은행은 매출총이익 없어 미적용(null).
export function qualityLens(grossProfit: number | null, totalAssets: number | null, locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].quality;
  const gpa = grossProfit != null && totalAssets != null && totalAssets > 0 ? (grossProfit / totalAssets) * 100 : null;
  const lab = gpa == null ? null : gpa > 40 ? "높음" : gpa < 15 ? "낮음" : "보통";
  const qState = gpa == null ? "na" : gpa > 40 ? "high" : gpa < 15 ? "low" : "mid";
  return {
    key: "quality",
    grade: "검증",
    gradeTier: "strong",
    nameEn: "Quality (GP/A)",
    name: c.name,
    summary: c.what,
    about: c.about,
    short: null,
    long: lab,
    detail: { "GP/A%": round(gpa) },
    verdict: readOf(locale, "quality", qState, qState === "high" ? "pos" : qState === "low" ? "warn" : "flat"),
    spectrum: specOf(locale, "quality", qState === "high" ? 2 : qState === "low" ? 0 : qState === "mid" ? 1 : -1),
    headline: gpa != null ? `GP/A ${round(gpa)}%` : null,
    outlook: outlookOf(locale, "quality", qState),
    value: round(gpa),
    state: qState,
    note: "퀄리티(Gross Profitability, Novy-Marx): 매출총이익/총자산. 백테스트(투자가능 $5+·13코호트) 고−저 롱숏 t≈2.9·샤프 0.78·FF3 알파 t≈2.5(시장/규모/가치 넘는 독립 프리미엄)·회전율 낮아 비용 강건 → 검증. 단 수익 '수준'은 생존편향·동일가중으로 과대(방향·유의만 신뢰). ROE는 별도 검증서 유의 미달(대형주 편중)이라 제외. 은행은 매출총이익 구조상 미적용. · 3중 교차검증(코호트 3분할·STEP560): 3/3 구간 +방향·전체 t≈3.2·FF3 알파 t≈2.75(βHML−0.22 독립) = 검증 재확인, 7렌즈 중 가장 단단.",
  };
}

// ── 자산성장(Asset Growth·투자팩터) 렌즈 ── 총자산 전년比 증가율. 표본 약함: 방향·독립성은 진짜(βHML낮음=밸류와 별개)이나 우리 표본 유의 미달.
// 라벨=확장 강도(공격적/보통/보수적 · verdict 아님). 고성장=역사적으로 이후 수익 약세 경향(과잉투자 경계).
export function assetGrowthLens(assetGrowthPct: number | null, locale: Locale = "ko"): LensRead {
  const c = LENS_COPY[locale].assetgrowth;
  const lab = assetGrowthPct == null ? null : assetGrowthPct > 20 ? "공격적" : assetGrowthPct < 5 ? "보수적" : "보통";
  const agState = assetGrowthPct == null ? "na" : assetGrowthPct > 20 ? "aggressive" : assetGrowthPct < 5 ? "conservative" : "mid";
  return {
    key: "assetgrowth",
    grade: "표본 약함",
    gradeTier: "partial",
    nameEn: "Asset Growth (CMA)",
    name: c.name,
    summary: c.what,
    about: c.about,
    short: null,
    long: lab,
    detail: { "자산성장%": round(assetGrowthPct) },
    verdict: readOf(locale, "assetgrowth", agState, agState === "conservative" ? "pos" : agState === "aggressive" ? "warn" : "flat"),
    spectrum: specOf(locale, "assetgrowth", agState === "conservative" ? 0 : agState === "aggressive" ? 2 : agState === "mid" ? 1 : -1),
    headline: assetGrowthPct != null ? `자산성장 ${round(assetGrowthPct)}%` : null,
    outlook: outlookOf(locale, "assetgrowth", agState),
    value: round(assetGrowthPct),
    state: agState,
    note: "자산성장(Asset Growth·투자팩터 — Cooper-Gulen-Schill 2008 / Fama-French 5팩터 CMA): 총자산 전년比 증가율. 백테스트(투자가능 $5+·13코호트) 저−고(보수−공격) 롱숏 방향은 +(연 ~+8%)이고 시장·규모·가치(FF3)와 독립적(βHML≈0.17 — 밸류의 재포장이 아닌 별개의 '자본 규율' 축)이나, 우리 표본선 통계적으로 유의 미달(t≈1.6). → '자산을 공격적으로 키운 회사가 이후 수익이 약한 편'이라는 방향은 학계 정설(과잉투자 경계)이나 우리 데이터론 확신 못 함(표본 약함). 자본 규율의 참고 축으로 보세요. 예측·보장 아님. 은행 등은 자산 성격이 달라 해석 주의. · 3중 교차검증(코호트 3분할·STEP560): 3구간 방향 3/3 일관(단 각 구간 t<2) — 표본약함이나 방향은 시기 무관 일관(밸류보다 견고).",
  };
}
