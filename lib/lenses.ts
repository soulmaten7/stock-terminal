// 결정론적 "기법 렌즈" 계산 — 무료층. 가격/기본지표만으로 단기·장기 "방향 라벨"을 산출.
// 원칙: 예측(❌)이 아니라 해석(⭕). 근거 수치를 항상 함께 노출(투명). 여기선 순수 계산만(테스트 쉬움).
// 데이터(가격배열·PER·PBR·재무)는 StockData 번들로 주입(docs/LENS_ARCHITECTURE.md §1~4).
// 각 렌즈 = { meta, compute(d, locale) } 균일 객체 → 레지스트리 플러그인·기법당 AI 교체점.

import { momentum121FromDaily } from "./momentum"; // momentumState는 STEP 805서 컷 통일로 미사용(백테스트 전용 유지)
import { realizedVol } from "./lowvol"; // volState 동일(이중컷 제거)
import { sma, rsi, rsiState, maTrendState } from "./technical";
import { LENS_COPY, LENS_READINGS, SPECTRUM_LABELS, LENS_OUTLOOK, LENS_GRADE, LEVEL_LABELS, HEADLINE_PREFIX, LENS_MISC, type Locale } from "./lensCopy";
import type { Lens, StockData, LensRead, LensDecomposition, LensTimeSeries } from "./lenses/types";
import { stateFromCut, marketOf, type CutMap, type CutMeta } from "./lensCuts";

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

// STEP 805: 분포 유도 컷 소비 유틸.
// verdictState: value + 시장컷 → state. value 없으면 null(호출부 na), 컷 없으면 'pending'(기준 준비 중).
function verdictState(lensKey: string, value: number | null, cuts: CutMap | undefined): string | null {
  return stateFromCut(lensKey, value, cuts?.[lensKey]);
}
// "기준 준비 중" 판정(컷 미존재 시) — readOf 대신 고정 문구. 톤은 중립(flat)이나 스크리닝 state는 'pending'.
function pendingRead(locale: Locale): { phrase: string; plain: string; tone: Tone } {
  return { phrase: LENS_MISC[locale].pendingPhrase, plain: LENS_MISC[locale].pendingPlain, tone: "flat" };
}
// 컷 출처(분포 유도 시장·표본·기준일) — 화면이 "KR 분포 하위/상위 30% 기준 · N · 날짜"로 포맷(STEP 805 §6).
function cutSourceOf(cut: CutMeta | undefined, market: string | undefined): { market: string; n: number; asOf: string | null } | null {
  return cut && market ? { market, n: cut.n, asOf: cut.asOf } : null;
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
// 한 재무 행의 매출총이익 — 야후 보고값 우선, 없으면 매출−원가(연도별 추이·분해 공용).
function gpOfRow(r: FRowLite | undefined): number | null {
  if (!r) return null;
  return r.grossProfit ?? (r.totalRevenue != null && r.costOfRevenue != null ? r.totalRevenue - r.costOfRevenue : null);
}
type FRowLite = { date?: unknown; totalRevenue?: number | null; grossProfit?: number | null; costOfRevenue?: number | null; totalAssets?: number | null };

// 🔴 STEP 831 §10-① GP/A 구성요소 분해 — DuPont: GP/A = 매출총이익률(GP/매출) × 자산회전율(매출/총자산).
//   원전(Novy-Marx 2013·"Good Growth" w15940)이 DuPont 분해를 명시적으로 논의(우리 발명 아님) — 단 원전 caveat:
//   분해는 GP/A 자체를 넘는 예측력을 '추가하지 않는다'(서술적 투명성이지 더 강한 신호 아님). 문구에 그 사실 명시.
//   🔴 세 값을 각각 원자료에서 계산(최종 GP/A에서 역산 금지)·항등식은 코드/테스트로 검산.
function qualityDecomposition(lr: FRowLite | undefined): LensDecomposition | null {
  if (!lr) return null;
  const rev = lr.totalRevenue ?? null;
  const cogs = lr.costOfRevenue ?? null;
  const gpDirect = lr.grossProfit ?? null;
  const at = lr.totalAssets ?? null;
  const gp = gpDirect != null ? gpDirect : (rev != null && cogs != null ? rev - cogs : null);
  if (gp == null || at == null || at <= 0) return null; // 분해 불가 → 섹션 미표시(지어내지 않음)
  const source: "direct" | "computed" = gpDirect != null ? "direct" : "computed";
  const margin = rev != null && rev > 0 ? (gp / rev) * 100 : null;   // 매출총이익률 %
  const turnover = rev != null && rev !== 0 && at > 0 ? rev / at : null; // 자산회전율 ×
  return {
    identityKey: "qualityIdentity",
    source,
    parts: [
      { key: "revenue", value: rev, unit: "money" },
      { key: "cogs", value: cogs, unit: "money" },
      { key: "grossProfit", value: gp, unit: "money" },
      { key: "totalAssets", value: at, unit: "money" },
      { key: "grossMargin", value: margin != null ? Math.round(margin * 100) / 100 : null, unit: "pct" },
      { key: "assetTurnover", value: turnover != null ? Math.round(turnover * 1000) / 1000 : null, unit: "x" },
    ],
  };
}

// 🔴 STEP 831 §10-② 연도별 GP/A(각 해 기말 총자산 분모·815 정합). 결측·불연속 연도는 건너뛰지 않고 missing으로 표시.
function qualityTimeSeries(financials: FRowLite[]): LensTimeSeries | null {
  const raw = financials
    .map((r) => ({ year: yearOfRow(r), gp: gpOfRow(r), at: r.totalAssets ?? null }))
    .filter((p): p is { year: number; gp: number | null; at: number | null } => p.year != null)
    .map((p) => ({ year: p.year, value: p.gp != null && p.at != null && p.at > 0 ? Math.round((p.gp / p.at) * 10000) / 100 : null }));
  if (raw.length < 2) return null; // 1개 연도면 추이가 아님
  if (!raw.some((p) => p.value != null)) return null; // 전 연도 산출 불가(예: 매출총이익 없는 금융사) → 추이 섹션 미표시(빈 년도 나열 금지)
  raw.sort((a, b) => a.year - b.year);
  const points: { year: number | null; value: number | null; missing?: boolean }[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (i > 0) { const gap = raw[i].year - raw[i - 1].year; for (let g = 1; g < gap; g++) points.push({ year: raw[i - 1].year + g, value: null, missing: true }); }
    points.push({ year: raw[i].year, value: raw[i].value });
  }
  return { metricKey: "gpa", unit: "pct", points };
}

// STEP 803 §5: 두 재무 행(T·P)이 인접 회계연도(연도 차 1)인지 — Δ항목(GP/A 기초자산·자산성장 전년比)이 '전년 대비'로 성립하는지 검증.
// 야후는 결측 연도를 건너뛰므로 2024·2021만 오면 3년 성장률이 '전년比'로 오표시됨 → 연도 차 ≠ 1이면 계산 불가(na)로 정직 처리.
// 두 행의 날짜를 모두 알 수 있을 때만 판정(모르면 관대하게 통과 — 없는 사실 단정 금지).
function yearOfRow(r: { date?: unknown } | undefined): number | null {
  const d = r?.date;
  const s = d instanceof Date ? d.toISOString().slice(0, 4) : typeof d === "string" ? d.slice(0, 4) : null;
  const n = s ? parseInt(s, 10) : NaN;
  return Number.isFinite(n) ? n : null;
}
function nonConsecutive(a: { date?: unknown } | undefined, b: { date?: unknown } | undefined): boolean {
  const ya = yearOfRow(a), yb = yearOfRow(b);
  return ya != null && yb != null && Math.abs(ya - yb) !== 1;
}


// ── 모멘텀 렌즈 ── 장기=검증된 12-1 모멘텀(lib/momentum 공유, 백테스트 +). 단기(short)는 STEP1083에서 폐기(아래 참조).
export const momentum: Lens = {
  meta: { key: "momentum", nameEn: "Momentum (12-1)", grade: LENS_GRADE.ko.verified, gradeTier: "strong", horizon: "mid", backtestRef: "STEP559", percentile: { dir: "high" } },
  compute(d: StockData, locale: Locale = "ko", cuts?: CutMap): LensRead {
    // 모멘텀·수익률 = 배당 조정 종가(총수익률 = Jegadeesh-Titman 학술 표준·STEP 801). 없으면 raw 폴백.
    // 기술(RSI·200일선)은 '가격 지표'라 차트와 어긋나지 않게 raw 종가 유지 — 조정은 여기(모멘텀)만.
    const closes = d.adjCloses ?? d.closes;
    const c = LENS_COPY[locale].momentum;
    const r1 = ret(closes, 21), r3 = ret(closes, 63), r6 = ret(closes, 126), r12 = ret(closes, 252);
    const m121 = momentum121FromDaily(closes);
    // STEP 805: 12-1 판정을 시장 분포 컷으로. verdict·장기라벨 단일 컷 통일(기존 verdict ±10 / label ±20 이중컷 제거).
    const cut = cuts?.momentum;
    const mState = verdictState("momentum", m121, cuts);
    const isPending = mState === "pending";
    // STEP 806 §1 절대 sanity 가드: 상위권(up)인데 12-1<0이면 "상승" 문구 금지(upNeg), 하위권(down)인데 12-1>0이면 downPos.
    const readKey = mState === "up" ? (m121 != null && m121 < 0 ? "upNeg" : "up")
      : mState === "down" ? (m121 != null && m121 > 0 ? "downPos" : "down")
      : mState;
    // 장기 라벨(trend)도 같은 컷 상태에서 파생 — up→강세·flat→중립·down→약세(momentumState 별도 임계값 미사용).
    const trendState = mState === "up" ? "strong" : mState === "down" ? "weak" : mState === "flat" ? "neutral" : null;
    // STEP1083 §7-4#2 #7: 옛 short(avg([r1,r3]) 기반 ±5% 절대추세)는 폐기 — 두 기간을 평균하는 절차가
    //   원전(Jegadeesh-Titman·Carhart·FF) 어디에도 없는 창작이었고(CLAUDE.md 창작금지), 어떤 라이브 화면도
    //   이 필드를 렌더링하지 않아(전수 grep 확인) 대체 산식을 짓지 않고 null로 제거한다. r1·r3 자체는
    //   detail에 그대로 남아 투명 공개된다. §7-4#2 #8(±5%→분포컷 전환)의 대상 코드도 이 제거로 함께 사라짐.
    const adjUsed = d.adjUsed ?? null;
    const note = adjUsed === false ? c.note + LENS_MISC[locale].momentumRawFallback : c.note;
    return {
      key: "momentum",
      grade: LENS_GRADE[locale].verified,
      gradeTier: "strong",
      nameEn: "Momentum (12-1)",
      horizon: "mid",
      name: c.name,
      summary: c.what,
      about: c.about,
      short: null, // STEP1083 — avg(r1,r3) 창작 산식 제거(원전 없음·미노출 확인). 위 주석 참조.
      long: labelOf(locale, "momrank", trendState),                 // 장기=12-1 분포 순위(상위권/하위권·STEP 808 §4)
      detail: { mom12_1: round(m121), ret1m: round(r1), ret3m: round(r3), ret6m: round(r6), ret12m: round(r12) },
      verdict: isPending ? pendingRead(locale) : readOf(locale, "momentum", readKey, mState === "up" ? "pos" : mState === "down" ? "warn" : "flat"),
      spectrum: specOf(locale, "momentum", mState === "up" ? 2 : mState === "down" ? 0 : mState === "flat" ? 1 : -1),
      headline: m121 != null ? `12-1 ${round(m121)}%` : null,
      outlook: isPending ? null : outlookOf(locale, "momentum", mState),
      value: round(m121),
      state: mState,
      note,
      cutoffs: cut ? { lo: cut.lo, hi: cut.hi } : null, // 실제 사용한 분포 컷(STEP 805 §3·§6)
      cutSource: cutSourceOf(cut, marketOf(d.symbol)),
      adjUsed, // STEP1083 §7-4#2 #9: 정직 표기용 플래그 노출(화면·note 둘 다 — 노출 안 되면 있으나 마나였다는 결함 재발 방지)
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
  compute(d: StockData, locale: Locale = "ko", cuts?: CutMap): LensRead {
    const pe = d.pe, pb = d.pb;
    const c = LENS_COPY[locale].valuation;
    // PER은 직전 연간 순이익 기준(학술 E/P). 적자·결측이면 na. 그 외는 시장 분포 컷으로 판정(STEP 805).
    const peVal = pe == null || pe <= 0 ? null : pe;
    const cut = cuts?.valuation;
    const vState = peVal == null ? "na" : verdictState("valuation", peVal, cuts) ?? "na";
    const isPending = vState === "pending";
    // 🔴 STEP 822 §2-1: na 사유 구분 — "이익 정보 없음"은 적자·우선주엔 거짓(적자는 정보가 있는 상태). 세 사유를 카드 문구로 나눈다.
    //   ① KR 우선주(6자리 끝자리≠0·lensCompute와 동일 규칙) ② 적자(pe≤0 또는 직전 순이익≤0) ③ 그 외=재무 결측.
    const isPref = /^\d{6}$/.test(d.symbol) && !d.symbol.endsWith("0");
    const lrNi = d.financials[d.financials.length - 1]?.netIncome ?? null;
    const isLoss = !isPref && ((pe != null && pe <= 0) || (pe == null && lrNi != null && lrNi <= 0));
    const naKey = isPref ? "naPreferred" : isLoss ? "naLoss" : "naMissing";
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
      verdict: isPending ? pendingRead(locale) : vState === "na" ? readOf(locale, "valuation", naKey, "flat") : readOf(locale, "valuation", vState, vState === "cheap" ? "pos" : vState === "rich" ? "warn" : "flat"),
      spectrum: specOf(locale, "valuation", vState === "cheap" ? 0 : vState === "rich" ? 2 : vState === "mid" ? 1 : -1),
      headline: pe != null && pe > 0 ? `PER ${round(pe)}` : null,
      outlook: isPending ? null : outlookOf(locale, "valuation", vState),
      value: round(peVal), // 스크리닝·컷 분포용은 양수 PER만(적자 음수 PER은 na라 분포 오염 금지)
      state: vState,
      note: c.note,
      cutoffs: cut ? { lo: cut.lo, hi: cut.hi } : null,
      cutSource: cutSourceOf(cut, marketOf(d.symbol)),
      valueBasis: d.peBasis ?? null, // PER 기준(TTM/연간) — 화면 문구 분기(STEP 809 §1)
    };
  },
};

// ── 저변동성 렌즈 ── 실현변동성(위험). 검증: 투자가능($5+) 유니버스서 저변동군이 위험 낮고 수익 우위.
export const lowVol: Lens = {
  meta: { key: "lowvol", nameEn: "Low Volatility", grade: LENS_GRADE.ko.verifiedDefensive, gradeTier: "strong", horizon: "long", backtestRef: "STEP559", percentile: { dir: "low" } },
  compute(d: StockData, locale: Locale = "ko", cuts?: CutMap): LensRead {
    const closes = d.closes;
    const c = LENS_COPY[locale].lowvol;
    const vol = realizedVol(closes, 252);
    // STEP 805: 시장 분포 컷으로 판정. verdict·장기라벨 단일 컷 통일(기존 verdict 20/40 / label 25/45 이중컷 제거).
    const cut = cuts?.lowvol;
    const lvState = verdictState("lowvol", vol, cuts);
    const isPending = lvState === "pending";
    // STEP 806 §1: 시장 대비 차분(calm)이라도 절대 변동성이 높으면(>40% 연율) 그 사실 병기(calmHigh).
    const readKey = lvState === "calm" && vol != null && vol > 40 ? "calmHigh" : lvState;
    // 장기 라벨(vol)도 같은 컷 상태에서 파생 — calm→낮음·mid→중간·jumpy→높음(volState 별도 임계값 미사용).
    const volLab = lvState === "calm" ? "low" : lvState === "jumpy" ? "high" : lvState === "mid" ? "mid" : null;
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
      long: labelOf(locale, "vol", volLab),
      detail: { vol: round(vol) },
      verdict: isPending ? pendingRead(locale) : readOf(locale, "lowvol", readKey, lvState === "calm" ? "pos" : lvState === "jumpy" ? "warn" : "flat"),
      spectrum: specOf(locale, "lowvol", lvState === "calm" ? 0 : lvState === "jumpy" ? 2 : lvState === "mid" ? 1 : -1),
      headline: vol != null ? `${HEADLINE_PREFIX[locale].lowvol} ${round(vol)}%` : null,
      outlook: isPending ? null : outlookOf(locale, "lowvol", readKey), // calmHigh면 "절대론 큼" 반영(STEP 808 §4)
      value: round(vol),
      state: lvState,
      note: c.note,
      cutoffs: cut ? { lo: cut.lo, hi: cut.hi } : null,
      cutSource: cutSourceOf(cut, marketOf(d.symbol)),
    };
  },
};

// ── 퀄리티(Quality) 렌즈 ── Gross Profitability(GP/A, Novy-Marx). 검증: 고 GP/A가 저 GP/A 대비 우위(FF3 알파 유의).
// GP/A = 매출총이익/총자산. 라벨은 수준 서술(높음/보통/낮음 · verdict 아님). 은행은 매출총이익 없어 미적용(null).
export const quality: Lens = {
  meta: { key: "quality", nameEn: "Quality (GP/A)", grade: LENS_GRADE.ko.verified, gradeTier: "strong", horizon: "long", backtestRef: "STEP560", percentile: { dir: "high" } },
  compute(d: StockData, locale: Locale = "ko", cuts?: CutMap): LensRead {
    // GP/A = 최신연도 매출총이익 ÷ **같은 회계연도 기말 총자산**(Novy-Marx 2013 원전 = (REVT−COGS)/AT, 분자·분모 동일 재무제표).
    // 🔴 STEP 815 원문 정정: 801이 분모를 '전기말(기초)'로 바꿨으나 그건 Piotroski F-Score ROA 관행이지 Novy-Marx GP/A 원전이 아님(원문 JFE 2013·Table2 "(REVT−COGS)/AT" = 당해 기말 AT, 논문 내 'average assets' 언급은 별개 변수). 백테스트도 당해 기말 AT라 라이브·검증 정합.
    const lrRow = d.financials[d.financials.length - 1];
    const grossProfit = latestGrossProfit(d.financials);
    const lrAssets = lrRow?.totalAssets ?? null;
    const c = LENS_COPY[locale].quality;
    const gpa = grossProfit != null && lrAssets != null && lrAssets > 0 ? (grossProfit / lrAssets) * 100 : null;
    // STEP 805: 시장 분포 컷으로 판정(기존 상수 15/40 대신).
    const cut = cuts?.quality;
    const qState = gpa == null ? "na" : verdictState("quality", gpa, cuts) ?? "na";
    const isPending = qState === "pending";
    // 🔴 STEP 825 §2-1: na 사유 구분(822 밸류와 동일 원칙) — "매출총이익 데이터 없음"으로 뭉치지 않는다.
    //   재무는 있는데 매출총이익(매출−매출원가)만 없으면 = 이 지표를 보고하지 않는 회사(금융사 등). 은행이라 단정 금지(803) — 사실만.
    const naKey = grossProfit == null && d.financials[d.financials.length - 1] != null ? "naNoGrossProfit" : "naMissing";
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
      verdict: isPending ? pendingRead(locale) : qState === "na" ? readOf(locale, "quality", naKey, "flat") : readOf(locale, "quality", qState, qState === "high" ? "pos" : qState === "low" ? "warn" : "flat"),
      spectrum: specOf(locale, "quality", qState === "high" ? 2 : qState === "low" ? 0 : qState === "mid" ? 1 : -1),
      headline: gpa != null ? `GP/A ${round(gpa)}%` : null,
      outlook: isPending ? null : outlookOf(locale, "quality", qState),
      value: round(gpa),
      state: qState,
      note: c.note,
      cutoffs: cut ? { lo: cut.lo, hi: cut.hi } : null,
      cutSource: cutSourceOf(cut, marketOf(d.symbol)),
      // STEP 831 §10: 근거 상세 4축 — ①분해 ②시계열은 compute()가(원자료), ③분포는 /api/lens 주입, ④이력은 미구현(컷 이력 없음).
      decomposition: qualityDecomposition(lrRow),
      timeSeries: qualityTimeSeries(d.financials),
    };
  },
};

// ── 자산성장(Asset Growth·투자팩터) 렌즈 ── 총자산 전년比 증가율. 표본 약함: 방향·독립성은 진짜(βHML낮음=밸류와 별개)이나 우리 표본 유의 미달.
// 라벨=확장 강도(공격적/보통/보수적 · verdict 아님). 고성장=역사적으로 이후 수익 약세 경향(과잉투자 경계).
export const assetGrowth: Lens = {
  meta: { key: "assetgrowth", nameEn: "Asset Growth (CMA)", grade: LENS_GRADE.ko.weakSignal, gradeTier: "partial", horizon: "long", backtestRef: "STEP560", percentile: { dir: "low" } },
  compute(d: StockData, locale: Locale = "ko", cuts?: CutMap): LensRead {
    const lr = d.financials[d.financials.length - 1];
    const prev = d.financials[d.financials.length - 2];
    // 자산성장은 '전년比' 증가율 → 두 행이 인접 연도가 아니면(결측 연도) 계산 불가(STEP 803 §5).
    const gap = nonConsecutive(lr, prev);
    const assetGrowthPct = !gap && lr?.totalAssets != null && prev?.totalAssets != null && prev.totalAssets > 0 ? (lr.totalAssets / prev.totalAssets - 1) * 100 : null;
    const c = LENS_COPY[locale].assetgrowth;
    // STEP 805: 시장 분포 컷으로 판정(기존 상수 5/20 대신·낮을수록 우호).
    const cut = cuts?.assetgrowth;
    const agState = assetGrowthPct == null ? "na" : verdictState("assetgrowth", assetGrowthPct, cuts) ?? "na";
    const isPending = agState === "pending";
    // 🔴 STEP 826 §2-1: na 사유 구분(822·825 원칙) — 전년比라 2개 회계연도 필요 → ① 재무 없음 ② 1년치만 ③ 연도 불연속. 업종 단정 금지(803).
    const naKey = !lr ? "naMissing" : !prev ? "naOneYear" : gap ? "naGap" : "naMissing";
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
      verdict: isPending ? pendingRead(locale) : agState === "na" ? readOf(locale, "assetgrowth", naKey, "flat") : readOf(locale, "assetgrowth", agState, agState === "conservative" ? "pos" : agState === "aggressive" ? "warn" : "flat"),
      spectrum: specOf(locale, "assetgrowth", agState === "conservative" ? 0 : agState === "aggressive" ? 2 : agState === "mid" ? 1 : -1),
      headline: assetGrowthPct != null ? `${HEADLINE_PREFIX[locale].assetgrowth} ${round(assetGrowthPct)}%` : null,
      outlook: isPending ? null : outlookOf(locale, "assetgrowth", agState),
      value: round(assetGrowthPct),
      state: agState,
      note: c.note,
      cutoffs: cut ? { lo: cut.lo, hi: cut.hi } : null,
      cutSource: cutSourceOf(cut, marketOf(d.symbol)),
    };
  },
};
