// 피오트로스키 F-Score (9점) — 첫 "제대로 정의된" 결정론 렌즈.
// 원칙: 예측 아님. 재무 9개 규칙을 정확히 계산해 통과/실패를 투명 공개.
// 입력: fundamentalsTimeSeries(annual) 연도 오름차순 행. 최신(T)·전기(P) 2년으로 Δ 판정.
// ROA는 단순화(NI/기말총자산) — 원논문(기초자산) 대비 편의버전, 신호 취지 동일. 항상 근거수치 노출.

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
  needTwo: string; bank: string; good: string; mid: string; weak: string;
  cash: string; net: string;
  crit: Record<string, CText>;
}> = {
  ko: {
    needTwo: "재무 데이터 2년치가 부족해요",
    bank: "이 종목은 은행·보험이라 점수를 낼 수 없어요 — 그런 회사는 재무 구조가 보통 기업과 달라서요.",
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
    needTwo: "Not enough data — this needs two years of financials.",
    bank: "Can't score this one — it's a bank or insurer, and their financials are built differently.",
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
  if (rows.length < 2) {
    return { supported: false, reason: X.needTwo, score: 0, max: 9, grade: "-", criteria: [] };
  }
  const T = rows[rows.length - 1];
  const P = rows[rows.length - 2];

  // 필수 필드 — 분모는 양수까지 요구. 하나라도 없으면(예: 은행) F-Score 미적용.
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
  if (!ok(T) || !ok(P)) {
    return {
      supported: false,
      reason: X.bank,
      score: 0,
      max: 9,
      grade: "-",
      criteria: [],
    };
  }

  const roa = (r: FRow) => (r.netIncome as number) / (r.totalAssets as number);
  const cr = (r: FRow) => (r.currentAssets as number) / (r.currentLiabilities as number);
  const lev = (r: FRow) => (r.longTermDebt as number) / (r.totalAssets as number);
  const gm = (r: FRow) => (gp(r) as number) / (r.totalRevenue as number);
  const at = (r: FRow) => (r.totalRevenue as number) / (r.totalAssets as number);
  const pct = (v: number) => (v * 100).toFixed(1) + "%";

  // 3그룹(수익성 4·재무 안정성 3·효율성 2) — GuruFocus·Stockopedia 표준 그룹핑. label=전문용어 / plain=쉬운 풀이(카드 괄호).
  const c: FCriterion[] = [
    { key: "roa_pos", group: "수익성", ...X.crit.roa_pos, pass: roa(T) > 0, note: `ROA ${pct(roa(T))}` },
    { key: "cfo_pos", group: "수익성", ...X.crit.cfo_pos, pass: (T.operatingCashFlow as number) > 0, note: `CFO ${big(T.operatingCashFlow)}` },
    { key: "roa_up", group: "수익성", ...X.crit.roa_up, pass: roa(T) > roa(P), note: `${pct(roa(P))} → ${pct(roa(T))}` },
    { key: "accrual", group: "수익성", ...X.crit.accrual, pass: (T.operatingCashFlow as number) > (T.netIncome as number), note: `${X.cash} ${big(T.operatingCashFlow)} · ${X.net} ${big(T.netIncome)}` },
    { key: "lever_dn", group: "재무 안정성", ...X.crit.lever_dn, pass: lev(T) < lev(P), note: `${pct(lev(P))} → ${pct(lev(T))}` },
    { key: "liq_up", group: "재무 안정성", ...X.crit.liq_up, pass: cr(T) > cr(P), note: `${cr(P).toFixed(2)} → ${cr(T).toFixed(2)}` },
    { key: "no_dilute", group: "재무 안정성", ...X.crit.no_dilute, pass: (T.ordinarySharesNumber as number) <= (P.ordinarySharesNumber as number) * 1.001, note: `${big(P.ordinarySharesNumber)} → ${big(T.ordinarySharesNumber)}` },
    { key: "margin_up", group: "효율성", ...X.crit.margin_up, pass: gm(T) > gm(P), note: `${pct(gm(P))} → ${pct(gm(T))}` },
    { key: "turn_up", group: "효율성", ...X.crit.turn_up, pass: at(T) > at(P), note: `${at(P).toFixed(2)} → ${at(T).toFixed(2)}` },
  ];

  const score = c.filter((x) => x.pass).length;
  const grade = score >= 7 ? X.good : score <= 3 ? X.weak : X.mid;
  return { supported: true, score, max: 9, grade, criteria: c, asOf: fmtDate(T.date) };
}
