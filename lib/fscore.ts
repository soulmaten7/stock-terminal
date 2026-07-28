// 피오트로스키 F-Score (9점) — 첫 "제대로 정의된" 결정론 렌즈.
// 원칙: 예측 아님. 재무 9개 규칙을 정확히 계산해 통과/실패를 투명 공개.
// 입력: fundamentalsTimeSeries(annual) 연도 오름차순 행. 최신(T)·전기(P)·전전기(PP) 3년으로 Δ 판정.
// ROA·자산회전율 분모 = 기초(전기말) 총자산(Piotroski 2000 원전·STEP 801). 3년 없으면 계산 불가. 항상 근거수치 노출.

import type { Locale } from "./lensCopy";

export type FCriterion = { key: string; label: string; pass: boolean; note: string; group: string; plain: string };
export type FScore = {
  supported: boolean;
  reason?: string;
  score: number; // 0~9
  max: number; // 9
  grade: string; // 우량 / 중립 / 부실 / - (en: Strong / Neutral / Weak / -)
  criteria: FCriterion[];
  asOf?: string; // 최신 회계연도 말
};

// 표시 문자열 이중언어 맵(결정론·LLM 무). ⚠️ ko 값은 기존 리터럴과 바이트 동일 — KR 화면·스냅샷 무회귀.
// group 키(수익성/재무 안정성/효율성)는 표시가 아니라 UI가 항목을 묶는 '매칭 키'라 언어 무관하게 고정(표시는 t()).
type CText = { label: string; plain: string };
const FS_TEXT: Record<Locale, {
  needThree: string; dataMissing: string; gap: string; good: string; mid: string; weak: string;
  cash: string; net: string;
  crit: Record<string, CText>;
}> = {
  ko: {
    needThree: "재무 데이터 3개 회계연도가 부족해요 (ROA·회전율은 기초 자산이 필요해서요)",
    dataMissing: "재무 데이터가 부족해 점수를 낼 수 없어요.",
    gap: "회계연도가 연속되지 않아 점수를 낼 수 없어요 (중간에 빠진 해가 있어요).",
    good: "우량", mid: "중립", weak: "부실",
    cash: "현금", net: "순익",
    crit: {
      roa_pos: { label: "ROA 양수", plain: "돈을 벌어요·흑자" },
      cfo_pos: { label: "영업현금흐름 양수", plain: "팔아서 진짜 현금이 들어와요" },
      roa_up: { label: "ROA 개선", plain: "작년보다 더 잘 벌어요" },
      accrual: { label: "이익의 질", plain: "번 돈이 진짜 통장에 들어와요" },
      lever_dn: { label: "장기부채비율 하락", plain: "빚 부담이 줄었어요" },
      liq_up: { label: "유동비율 개선", plain: "급할 때 갚을 돈이 늘었어요" },
      no_dilute: { label: "신주발행 없음", plain: "주식을 새로 안 찍어냈어요" },
      margin_up: { label: "매출총이익률 개선", plain: "팔면 남는 게 많아졌어요" },
      turn_up: { label: "자산회전율 개선", plain: "가진 걸로 더 많이 팔아요" },
    },
  },
  en: {
    needThree: "Not enough data — this needs three fiscal years (ROA and turnover use beginning assets).",
    dataMissing: "Not enough financial data to score this one.",
    gap: "Can't score — the fiscal years aren't consecutive (a year is missing).",
    good: "Strong", mid: "Neutral", weak: "Weak",
    cash: "Cash", net: "Net income",
    crit: {
      roa_pos: { label: "Positive ROA", plain: "It makes money — profitable" },
      cfo_pos: { label: "Positive operating cash flow", plain: "Sales turn into real cash" },
      roa_up: { label: "ROA improving", plain: "Earns more than last year" },
      accrual: { label: "Earnings quality", plain: "The profit shows up as cash" },
      lever_dn: { label: "Long-term debt ratio down", plain: "Lighter debt burden" },
      liq_up: { label: "Current ratio improving", plain: "More on hand to cover bills" },
      no_dilute: { label: "No new shares issued", plain: "Didn't print new stock" },
      margin_up: { label: "Gross margin improving", plain: "Keeps more of each sale" },
      turn_up: { label: "Asset turnover improving", plain: "Sells more with what it owns" },
    },
  },
};

export type FRow = {
  date?: unknown;
  totalRevenue?: number | null;
  grossProfit?: number | null;
  costOfRevenue?: number | null;
  netIncome?: number | null;
  totalAssets?: number | null;
  currentAssets?: number | null;
  currentLiabilities?: number | null;
  longTermDebt?: number | null;
  operatingCashFlow?: number | null;
  ordinarySharesNumber?: number | null;
  stockholdersEquity?: number | null;
};

function gp(r: FRow): number | null {
  if (r.grossProfit != null) return r.grossProfit;
  if (r.totalRevenue != null && r.costOfRevenue != null) return r.totalRevenue - r.costOfRevenue;
  return null;
}

// 큰 숫자 축약(통화 무관) — 예: 120,000,000,000 → "120.0B", 24,300,000,000주 → "24.3B"
function big(v: number | null | undefined): string {
  if (v == null) return "—";
  const a = Math.abs(v);
  if (a >= 1e12) return (v / 1e12).toFixed(2) + "T";
  if (a >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (a >= 1e6) return (v / 1e6).toFixed(0) + "M";
  return String(Math.round(v));
}
function fmtDate(d: unknown): string | undefined {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return undefined;
}

export function computeFScore(rowsAsc: FRow[], locale: Locale = "ko"): FScore {
  const X = FS_TEXT[locale] ?? FS_TEXT.ko;
  const rows = (rowsAsc || []).filter(Boolean);
  // Piotroski 원전: ROA·자산회전율의 분모 = **기초(전기말) 총자산**. ΔROA·Δ회전율을 같은 기준으로 일관되게 내려면
  // T·P 두 해의 기초 자산(= P·PP의 기말 자산)이 필요 → 3개 회계연도 요구(없으면 계산 불가·기말 대체 금지·STEP 801).
  if (rows.length < 3) {
    return { supported: false, reason: X.needThree, score: 0, max: 9, grade: "-", criteria: [] };
  }
  const T = rows[rows.length - 1];
  const P = rows[rows.length - 2];
  const PP = rows[rows.length - 3]; // T·P의 기초 자산 = P·PP의 기말 자산

  // 필수 필드 — 분모는 양수까지 요구. 하나라도 없으면(데이터 결측) F-Score 계산 불가.
  // ⚠️ 결측 원인을 은행·보험으로 단정하지 않는다(직시 원칙): 실제로는 단순 데이터 누락일 수 있음(STEP 803).
  const ok = (r: FRow) =>
    r.netIncome != null &&
    r.operatingCashFlow != null &&
    r.ordinarySharesNumber != null &&
    r.currentAssets != null &&
    r.longTermDebt != null &&
    gp(r) != null &&
    (r.totalAssets ?? 0) > 0 &&
    (r.totalRevenue ?? 0) > 0 &&
    (r.currentLiabilities ?? 0) > 0;
  // T·P 유효 + PP 기말 총자산 양수(P의 기초 분모) — 셋 다 있어야 기초-자산 ROA/회전율 산출 가능.
  if (!ok(T) || !ok(P) || (PP?.totalAssets ?? 0) <= 0) {
    return {
      supported: false,
      reason: X.dataMissing,
      score: 0,
      max: 9,
      grade: "-",
      criteria: [],
    };
  }

  // STEP 803 §5: 회계연도 연속성 — T·P·PP가 인접 연도(간격 1년)여야 ΔROA·Δ회전율이 '전년 대비'로 성립.
  //   중간에 빠진 해가 있으면(예: 2021·2019·2018 — 2020 결측) 증분 비교가 왜곡되므로 계산 불가로 정직히 반환.
  const yr = (r: FRow): number | null => {
    const s = fmtDate(r.date);
    const n = s ? parseInt(s.slice(0, 4), 10) : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const yT = yr(T), yP = yr(P), yPP = yr(PP);
  if (yT != null && yP != null && yPP != null && (yT - yP !== 1 || yP - yPP !== 1)) {
    return { supported: false, reason: X.gap, score: 0, max: 9, grade: "-", criteria: [] };
  }

  const begT = P.totalAssets as number;  // T의 기초(전기말) 총자산 = P 기말
  const begP = PP.totalAssets as number; // P의 기초(전전기말) 총자산 = PP 기말
  const roaT = (T.netIncome as number) / begT;      // ROA_t = 순이익 / 기초자산(원전)
  const roaP = (P.netIncome as number) / begP;
  const atT = (T.totalRevenue as number) / begT;    // 자산회전율 = 매출 / 기초자산(원전)
  const atP = (P.totalRevenue as number) / begP;
  const cr = (r: FRow) => (r.currentAssets as number) / (r.currentLiabilities as number);
  const lev = (r: FRow) => (r.longTermDebt as number) / (r.totalAssets as number); // ΔLEVER는 비교라 기말 자산 유지(원전은 평균이나 pass/fail 취지 동일)
  const gm = (r: FRow) => (gp(r) as number) / (r.totalRevenue as number);
  const pct = (v: number) => (v * 100).toFixed(1) + "%";

  // 주식수 정수배 급변 감지 — 액면분할/병합일 수도, 100% 유상증자(실제 희석)일 수도 있다.
  //   STEP 803 §4는 분할로 보고 통과 처리했으나, STEP 806 §7: 비율이 정확히 정수배면 분할·증자를 구분할 수 없다 →
  //   회사행위 데이터가 없으므로 no_dilute를 **판정 불가로 제외**(false-pass[증자를 분할로]·false-fail[분할을 증자로] 둘 다 회피). max가 8로 줄어든다.
  const shT = T.ordinarySharesNumber as number, shP = P.ordinarySharesNumber as number;
  const ratio = shP > 0 ? shT / shP : 1;
  const nearInt = (x: number) => Math.abs(x - Math.round(x)) <= 0.01 * Math.max(1, Math.round(x));
  const ambiguousSplit = shP > 0 && ((ratio >= 1.5 && nearInt(ratio)) || (ratio <= 1 / 1.5 && nearInt(1 / ratio)));

  // 3그룹(수익성 4·재무 안정성 3·효율성 2) — GuruFocus·Stockopedia 표준 그룹핑. label=전문용어 / plain=쉬운 풀이(카드 괄호).
  const c: FCriterion[] = [
    { key: "roa_pos", group: "수익성", ...X.crit.roa_pos, pass: roaT > 0, note: `ROA ${pct(roaT)}` },
    { key: "cfo_pos", group: "수익성", ...X.crit.cfo_pos, pass: (T.operatingCashFlow as number) > 0, note: `CFO ${big(T.operatingCashFlow)}` },
    { key: "roa_up", group: "수익성", ...X.crit.roa_up, pass: roaT > roaP, note: `${pct(roaP)} → ${pct(roaT)}` },
    { key: "accrual", group: "수익성", ...X.crit.accrual, pass: (T.operatingCashFlow as number) > (T.netIncome as number), note: `${X.cash} ${big(T.operatingCashFlow)} · ${X.net} ${big(T.netIncome)}` },
    { key: "lever_dn", group: "재무 안정성", ...X.crit.lever_dn, pass: lev(T) < lev(P), note: `${pct(lev(P))} → ${pct(lev(T))}` },
    { key: "liq_up", group: "재무 안정성", ...X.crit.liq_up, pass: cr(T) > cr(P), note: `${cr(P).toFixed(2)} → ${cr(T).toFixed(2)}` },
    // no_dilute: 정수배 급변(분할·증자 구분 불가)이면 제외. 아니면 신주발행 여부로 판정.
    ...(ambiguousSplit ? [] : [{ key: "no_dilute", group: "재무 안정성", ...X.crit.no_dilute, pass: shT <= shP * 1.001, note: `${big(shP)} → ${big(shT)}` }]),
    { key: "margin_up", group: "효율성", ...X.crit.margin_up, pass: gm(T) > gm(P), note: `${pct(gm(P))} → ${pct(gm(T))}` },
    { key: "turn_up", group: "효율성", ...X.crit.turn_up, pass: atT > atP, note: `${atP.toFixed(2)} → ${atT.toFixed(2)}` },
  ];

  const score = c.filter((x) => x.pass).length;
  const max = c.length; // 정수배 급변 시 no_dilute 제외로 8
  // 등급 컷은 max에 비례(max 9→우량 7·max 8→우량 6) — 부실은 절대 3 유지(원전 하단 취지).
  const grade = score >= max - 2 ? X.good : score <= 3 ? X.weak : X.mid;
  return { supported: true, score, max, grade, criteria: c, asOf: fmtDate(T.date) };
}
