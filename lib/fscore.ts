// 피오트로스키 F-Score (9점) — 첫 "제대로 정의된" 결정론 렌즈.
// 원칙: 예측 아님. 재무 9개 규칙을 정확히 계산해 통과/실패를 투명 공개.
// 입력: fundamentalsTimeSeries(annual) 연도 오름차순 행. 최신(T)·전기(P) 2년으로 Δ 판정.
// ROA는 단순화(NI/기말총자산) — 원논문(기초자산) 대비 편의버전, 신호 취지 동일. 항상 근거수치 노출.

export type FCriterion = { key: string; label: string; pass: boolean; note: string };
export type FScore = {
  supported: boolean;
  reason?: string;
  score: number; // 0~9
  max: number; // 9
  grade: string; // 우량 / 중립 / 부실 / -
  criteria: FCriterion[];
  asOf?: string; // 최신 회계연도 말
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

export function computeFScore(rowsAsc: FRow[]): FScore {
  const rows = (rowsAsc || []).filter(Boolean);
  if (rows.length < 2) {
    return { supported: false, reason: "재무 데이터 2년치가 부족해요", score: 0, max: 9, grade: "-", criteria: [] };
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
      reason: "이 업종(예: 금융)은 F-Score 미적용 — 유동비율·매출총이익 등 재무 구조가 달라요",
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

  const c: FCriterion[] = [
    { key: "roa_pos", label: "① ROA 양수", pass: roa(T) > 0, note: `ROA ${pct(roa(T))}` },
    { key: "cfo_pos", label: "② 영업현금흐름 양수", pass: (T.operatingCashFlow as number) > 0, note: `CFO ${big(T.operatingCashFlow)}` },
    { key: "roa_up", label: "③ ROA 개선", pass: roa(T) > roa(P), note: `${pct(roa(P))} → ${pct(roa(T))}` },
    { key: "accrual", label: "④ 이익의 질(CFO>순이익)", pass: (T.operatingCashFlow as number) > (T.netIncome as number), note: `CFO ${big(T.operatingCashFlow)} vs 순익 ${big(T.netIncome)}` },
    { key: "lever_dn", label: "⑤ 장기부채비율 하락", pass: lev(T) < lev(P), note: `${pct(lev(P))} → ${pct(lev(T))}` },
    { key: "liq_up", label: "⑥ 유동비율 개선", pass: cr(T) > cr(P), note: `${cr(P).toFixed(2)} → ${cr(T).toFixed(2)}` },
    { key: "no_dilute", label: "⑦ 신주발행 없음", pass: (T.ordinarySharesNumber as number) <= (P.ordinarySharesNumber as number) * 1.001, note: `주식수 ${big(P.ordinarySharesNumber)} → ${big(T.ordinarySharesNumber)}` },
    { key: "margin_up", label: "⑧ 매출총이익률 개선", pass: gm(T) > gm(P), note: `${pct(gm(P))} → ${pct(gm(T))}` },
    { key: "turn_up", label: "⑨ 자산회전율 개선", pass: at(T) > at(P), note: `${at(P).toFixed(2)} → ${at(T).toFixed(2)}` },
  ];

  const score = c.filter((x) => x.pass).length;
  const grade = score >= 7 ? "우량" : score <= 3 ? "부실" : "중립";
  return { supported: true, score, max: 9, grade, criteria: c, asOf: fmtDate(T.date) };
}
