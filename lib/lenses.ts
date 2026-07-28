// 결정론적 "기법 렌즈" 계산 — 무료층. 가격/기본지표만으로 단기·장기 "방향 라벨"을 산출.
// 원칙: 예측(❌)이 아니라 해석(⭕). 근거 수치를 항상 함께 노출(투명). 여기선 순수 계산만(테스트 쉬움).
// 데이터(가격배열·PER·PBR·재무)는 StockData 번들로 주입(docs/LENS_ARCHITECTURE.md §1~4).
// 각 렌즈 = { meta, compute(d, locale) } 균일 객체 → 레지스트리 플러그인·기법당 AI 교체점.

import { momentum121FromDaily, momentumState } from "./momentum";
import { realizedVol, volState } from "./lowvol";
import { sma, rsi, rsiState, maTrendState } from "./technical";
import { LENS_COPY, LENS_READINGS, SPECTRUM_LABELS, LENS_OUTLOOK, LENS_GRADE, LEVEL_LABELS, HEADLINE_PREFIX, type Locale } from "./lensCopy";
import type { Lens, StockData, LensRead } from "./lenses/types";

export type { LensRead } from "./lenses/types";

type Tone = "pos" | "warn" | "flat";
type Spectrum = { labels: [string, string, string]; active: number };
// 스펙트럼 3구간 — active(0~2)면 해당 칸 켜짐, -1이면 없음(데이터 없음/미적용).
function specOf(locale: Locale, key: keyof (typeof SPECTRUM_LABELS)["ko"], active: number): Spectrum | null {
  return active < 0 ? null : { labels: SPECTRUM_LABELS[locale][key], active };
}

// "이 기법 방향" 문자열 — 상태 없으면 null.
function outlookOf(locale: Locale, key: keyof (typeof LENS_OUTLOOK)["ko"], state: string | null): string | null {
  return state ? LENS_OUTLOOK[locale][key][state] ?? null : null;
}

// 상태키 → short/long 표시 라벨(언어별). 상태 없거나 그 그룹에 없는 키("na")면 null = 미표시(기존 동작).
function labelOf<K extends keyof (typeof LEVEL_LABELS)["ko"]>(locale: Locale, group: K, state: string | null): string | null {
  if (!state) return null;
  return (LEVEL_LABELS[locale][group] as Record<string, string>)[state] ?? null;
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

// 퀄리티(GP/A)용 최신연도 매출총이익 — grossProfit 없으면 매출-매출원가. (오케스트레이터 로직 이관)
function latestGrossProfit(financials: StockData["financials"]): number | null {
  const lr = financials[financials.length - 1];
  if (!lr) return null;
  return lr.grossProfit ?? (lr.totalRevenue != null && lr.costOfRevenue != null ? lr.totalRevenue - lr.costOfRevenue : null);
}


// ── 모멘텀 렌즈 ── 단기=1·3개월 추세 / 장기=검증된 12-1 모멘텀(lib/momentum 공유, 백테스트 +).
export const momentum: Lens = {
  meta: { key: "momentum", nameEn: "Momentum (12-1)", grade: LENS_GRADE.ko.verified, gradeTier: "strong", horizon: "mid", backtestRef: "STEP559", percentile: { dir: "high" } },
  compute(d: StockData, locale: Locale = "ko"): LensRead {
    // 모멘텀·수익률 = 배당 조정 종가(총수익률 = Jegadeesh-Titman 학술 표준·STEP 801). 없으면 raw 폴백.
    // 기술(RSI·200일선)은 '가격 지표'라 차트와 어긋나지 않게 raw 종가 유지 — 조정은 여기(모멘텀)만.
    const closes = d.adjCloses ?? d.closes;
    const c = LENS_COPY[locale].momentum;
    const r1 = ret(closes, 21), r3 = ret(closes, 63), r6 = ret(closes, 126), r12 = ret(closes, 252);
    const m121 = momentum121FromDaily(closes);
    const avg = (xs: (number | null)[]) => {
      const v = xs.filter((x): x is number => x != null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    // 단기(1·3개월 평균)용 상태 — 임계값 ±5%는 장기 12-1(±20%·momentumState)과 일부러 다름(기존 동작).
    const shortState = (v: number | null) => (v == null ? null : v > 5 ? "strong" : v < -5 ? "weak" : "neutral");
    const mState = m121 == null ? null : m121 > 10 ? "up" : m121 < -10 ? "down" : "flat";
    return {
      key: "momentum",
      grade: LENS_GRADE[locale].verified,
      gradeTier: "strong",
      nameEn: "Momentum (12-1)",
      horizon: "mid",
      name: c.name,
      summary: c.what,
      about: c.about,
      short: labelOf(locale, "trend", shortState(avg([r1, r3]))),
      long: labelOf(locale, "trend", momentumState(m121)),
      detail: { mom12_1: round(m121), ret1m: round(r1), ret3m: round(r3), ret6m: round(r6), ret12m: round(r12) },
      verdict: readOf(locale, "momentum", mState, mState === "up" ? "pos" : mState === "down" ? "warn" : "flat"),
      spectrum: specOf(locale, "momentum", mState === "up" ? 2 : mState === "down" ? 0 : mState === "flat" ? 1 : -1),
      headline: m121 != null ? `12-1 ${round(m121)}%` : null,
      outlook: outlookOf(locale, "momentum", mState),
      value: round(m121),
      state: mState,
      note: c.note,
      cutoffs: { lo: -10, hi: 10 }, // 판정 컷(위 mState 분기와 동일 상수) — 3단 계산 서사 노출용(STEP 782)
    };
  },
};

// ── 기술 렌즈 ── 단기=RSI(과열/침체), 장기=200일선 대비(추세)
export const technical: Lens = {
  meta: { key: "technical", nameEn: "Technical (RSI · MA)", grade: LENS_GRADE.ko.reference, gradeTier: "ref", horizon: "short", backtestRef: "STEP559", percentile: null },
  compute(d: StockData, locale: Locale = "ko"): LensRead {
    const closes = d.closes;
    const c = LENS_COPY[locale].technical;
    const r = rsi(closes);
    const last = closes.length ? closes[closes.length - 1] : null;
    const ma200 = sma(closes, 200);
    const win = closes.slice(-252);
    const hi = win.length ? Math.max(...win) : null;
    const lo = win.length ? Math.min(...win) : null;
    const pos52 = last != null && hi != null && lo != null && hi > lo ? ((last - lo) / (hi - lo)) * 100 : null;
    const shortLab = labelOf(locale, "rsi", rsiState(r));
    const longLab = labelOf(locale, "ma", maTrendState(last, ma200));
    const tState = last == null || ma200 == null ? null : last > ma200 ? "up" : last < ma200 ? "down" : "flat";
    return {
      key: "technical",
      grade: LENS_GRADE[locale].reference,
      gradeTier: "ref",
      nameEn: "Technical (RSI · MA)",
      horizon: "short",
      name: c.name,
      summary: c.what,
      about: c.about,
      short: shortLab,
      long: longLab,
      detail: {
        rsi14: round(r),
        ma200vs: last != null && ma200 ? round((last / ma200 - 1) * 100) : null,
        pos52w: round(pos52),
      },
      verdict: readOf(locale, "technical", tState, tState === "up" ? "pos" : tState === "down" ? "warn" : "flat"),
      spectrum: specOf(locale, "technical", tState === "up" ? 2 : tState === "down" ? 0 : tState === "flat" ? 1 : -1),
      headline: last != null && ma200 ? `${HEADLINE_PREFIX[locale].technical} ${round((last / ma200 - 1) * 100)}%` : null,
      outlook: outlookOf(locale, "technical", tState),
      value: last != null && ma200 ? round((last / ma200 - 1) * 100) : null,
      state: tState,
      note: c.note,
      cutoffs: { lo: 30, hi: 70 }, // RSI 침체/과열 컷(위 rsiState와 동일 상수) — 3단 계산 서사용(STEP 783)
    };
  },
};

// ── 밸류(가치) 렌즈 ── 검증: 투자가능($5+)서 싼(고 E/P·B/M) 종목이 비싼 종목 대비 우위(정설이나 우리 표본선 약함).
// ⚠️ 라벨은 "저평가/고평가"(가치 판단·verdict) 대신 "낮음/보통/높음"(PER 수준 사실)로 — 절대 임계값의 verdict는 검증 밖(상대·섹터내 비교가 맞음). 중립 표시.
export const valuation: Lens = {
  meta: { key: "valuation", nameEn: "Value (E/P · B/M)", grade: LENS_GRADE.ko.weakSignal, gradeTier: "partial", horizon: "long", backtestRef: "STEP560", percentile: { dir: "low" } },
  compute(d: StockData, locale: Locale = "ko"): LensRead {
    const pe = d.pe, pb = d.pb;
    const c = LENS_COPY[locale].valuation;
    const vState = pe == null || pe <= 0 ? "na" : pe < 10 ? "cheap" : pe > 25 ? "rich" : "mid";
    return {
      key: "valuation",
      grade: LENS_GRADE[locale].weakSignal,
      gradeTier: "partial",
      nameEn: "Value (E/P · B/M)",
      horizon: "long",
      name: c.name,
      summary: c.what,
      about: c.about,
      short: null,
      long: labelOf(locale, "per", vState),
      detail: { per: round(pe), pbr: round(pb) },
      verdict: readOf(locale, "valuation", vState, vState === "cheap" ? "pos" : vState === "rich" ? "warn" : "flat"),
      spectrum: specOf(locale, "valuation", vState === "cheap" ? 0 : vState === "rich" ? 2 : vState === "mid" ? 1 : -1),
      headline: pe != null && pe > 0 ? `PER ${round(pe)}` : null,
      outlook: outlookOf(locale, "valuation", vState),
      value: round(pe),
      state: vState,
      note: c.note,
      cutoffs: { lo: 10, hi: 25 }, // PER 저평가/고평가 컷(위 vState와 동일 상수) — 3단 계산 서사용(STEP 783)
    };
  },
};

// ── 저변동성 렌즈 ── 실현변동성(위험). 검증: 투자가능($5+) 유니버스서 저변동군이 위험 낮고 수익 우위.
export const lowVol: Lens = {
  meta: { key: "lowvol", nameEn: "Low Volatility", grade: LENS_GRADE.ko.verifiedDefensive, gradeTier: "strong", horizon: "long", backtestRef: "STEP559", percentile: { dir: "low" } },
  compute(d: StockData, locale: Locale = "ko"): LensRead {
    const closes = d.closes;
    const c = LENS_COPY[locale].lowvol;
    const vol = realizedVol(closes, 252);
    const lvState = vol == null ? null : vol < 20 ? "calm" : vol > 40 ? "jumpy" : "mid";
    return {
      key: "lowvol",
      grade: LENS_GRADE[locale].verifiedDefensive,
      gradeTier: "strong",
      nameEn: "Low Volatility",
      horizon: "long",
      name: c.name,
      summary: c.what,
      about: c.about,
      short: null,
      long: labelOf(locale, "vol", volState(vol)),
      detail: { vol: round(vol) },
      verdict: readOf(locale, "lowvol", lvState, lvState === "calm" ? "pos" : lvState === "jumpy" ? "warn" : "flat"),
      spectrum: specOf(locale, "lowvol", lvState === "calm" ? 0 : lvState === "jumpy" ? 2 : lvState === "mid" ? 1 : -1),
      headline: vol != null ? `${HEADLINE_PREFIX[locale].lowvol} ${round(vol)}%` : null,
      outlook: outlookOf(locale, "lowvol", lvState),
      value: round(vol),
      state: lvState,
      note: c.note,
      cutoffs: { lo: 20, hi: 40 }, // 연변동성 차분/출렁 컷(위 lvState와 동일 상수) — 3단 계산 서사용(STEP 783)
    };
  },
};

// ── 퀄리티(Quality) 렌즈 ── Gross Profitability(GP/A, Novy-Marx). 검증: 고 GP/A가 저 GP/A 대비 우위(FF3 알파 유의).
// GP/A = 매출총이익/총자산. 라벨은 수준 서술(높음/보통/낮음 · verdict 아님). 은행은 매출총이익 없어 미적용(null).
export const quality: Lens = {
  meta: { key: "quality", nameEn: "Quality (GP/A)", grade: LENS_GRADE.ko.verified, gradeTier: "strong", horizon: "long", backtestRef: "STEP560", percentile: { dir: "high" } },
  compute(d: StockData, locale: Locale = "ko"): LensRead {
    // GP/A = 최신연도 매출총이익 ÷ **기초(전기말) 총자산**(Novy-Marx 2013 원전·STEP 801). 전기 자산 없으면 산출 불가(null) — 기말로 대체 금지.
    const grossProfit = latestGrossProfit(d.financials);
    const priorAssets = d.financials[d.financials.length - 2]?.totalAssets ?? null;
    const c = LENS_COPY[locale].quality;
    const gpa = grossProfit != null && priorAssets != null && priorAssets > 0 ? (grossProfit / priorAssets) * 100 : null;
    const qState = gpa == null ? "na" : gpa > 40 ? "high" : gpa < 15 ? "low" : "mid";
    return {
      key: "quality",
      grade: LENS_GRADE[locale].verified,
      gradeTier: "strong",
      nameEn: "Quality (GP/A)",
      horizon: "long",
      name: c.name,
      summary: c.what,
      about: c.about,
      short: null,
      long: labelOf(locale, "gpa", qState),
      detail: { gpa: round(gpa) },
      verdict: readOf(locale, "quality", qState, qState === "high" ? "pos" : qState === "low" ? "warn" : "flat"),
      spectrum: specOf(locale, "quality", qState === "high" ? 2 : qState === "low" ? 0 : qState === "mid" ? 1 : -1),
      headline: gpa != null ? `GP/A ${round(gpa)}%` : null,
      outlook: outlookOf(locale, "quality", qState),
      value: round(gpa),
      state: qState,
      note: c.note,
      cutoffs: { lo: 15, hi: 40 }, // GP/A 낮음/높음 컷(위 qState와 동일 상수) — 3단 계산 서사용(STEP 783)
    };
  },
};

// ── 자산성장(Asset Growth·투자팩터) 렌즈 ── 총자산 전년比 증가율. 표본 약함: 방향·독립성은 진짜(βHML낮음=밸류와 별개)이나 우리 표본 유의 미달.
// 라벨=확장 강도(공격적/보통/보수적 · verdict 아님). 고성장=역사적으로 이후 수익 약세 경향(과잉투자 경계).
export const assetGrowth: Lens = {
  meta: { key: "assetgrowth", nameEn: "Asset Growth (CMA)", grade: LENS_GRADE.ko.weakSignal, gradeTier: "partial", horizon: "long", backtestRef: "STEP560", percentile: { dir: "low" } },
  compute(d: StockData, locale: Locale = "ko"): LensRead {
    const lr = d.financials[d.financials.length - 1];
    const prev = d.financials[d.financials.length - 2];
    const assetGrowthPct = lr?.totalAssets != null && prev?.totalAssets != null && prev.totalAssets > 0 ? (lr.totalAssets / prev.totalAssets - 1) * 100 : null;
    const c = LENS_COPY[locale].assetgrowth;
    const agState = assetGrowthPct == null ? "na" : assetGrowthPct > 20 ? "aggressive" : assetGrowthPct < 5 ? "conservative" : "mid";
    return {
      key: "assetgrowth",
      grade: LENS_GRADE[locale].weakSignal,
      gradeTier: "partial",
      nameEn: "Asset Growth (CMA)",
      horizon: "long",
      name: c.name,
      summary: c.what,
      about: c.about,
      short: null,
      long: labelOf(locale, "growth", agState),
      detail: { ag: round(assetGrowthPct) },
      verdict: readOf(locale, "assetgrowth", agState, agState === "conservative" ? "pos" : agState === "aggressive" ? "warn" : "flat"),
      spectrum: specOf(locale, "assetgrowth", agState === "conservative" ? 0 : agState === "aggressive" ? 2 : agState === "mid" ? 1 : -1),
      headline: assetGrowthPct != null ? `${HEADLINE_PREFIX[locale].assetgrowth} ${round(assetGrowthPct)}%` : null,
      outlook: outlookOf(locale, "assetgrowth", agState),
      value: round(assetGrowthPct),
      state: agState,
      note: c.note,
      cutoffs: { lo: 5, hi: 20 }, // 자산성장 보수적/공격적 컷(위 agState와 동일 상수) — 3단 계산 서사용(STEP 783)
    };
  },
};
