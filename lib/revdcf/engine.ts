/**
 * 역DCF 역산기 엔진 (STEP 848 · C층 첫 코드)
 *
 * 🔴 순수 계산. 화면·DB·SEC 호출 없음. 재료는 전부 인자.
 * 🔴 원전 Expectations Investing T8(PIE) 수식 그대로 (data/sources/expectations-investing/T8.xlsx).
 *    검증 기준 = 도미노피자 재현: value(year 1) ≈ $285 · MIFP 8년 (engine.test.ts).
 * 🔴 어댑터 구속(§4 A-8): 현금흐름·터미널·할인 규칙을 hooks로 주입 가능 → 은행/리츠 어댑터 확장.
 *    기본 hooks = T8 표준(FCFF). 내부에 FCFF를 박지 않는다.
 */

export interface RevDcfDrivers {
  startingSales: number;
  salesGrowth: number; // g
  operatingMargin: number; // 예측기간 마진
  startingMargin: number; // 0년차 마진
  taxRate: number; // NOPAT용 (= WACC 세금방패와 동일 값이어야 함)
  fixedCapitalRate: number; // × Δ매출
  workingCapitalRate: number; // × Δ매출
}

export interface RevDcfMarket {
  wacc: number;
  inflation: number; // 잔여가치 성장 i (0 가능)
  sharePrice: number;
  sharesOutstanding: number;
  debt: number;
  nonOperatingAssets: number;
}

export interface RevDcfOptions {
  maxYears?: number; // 계산 지평 (기본 25 · 100까지 가능)
  displayCap?: number; // 표시 컷 (기본 25)
}

/** 🔴 어댑터 훅 — 기본은 T8 표준(FCFF). 은행/리츠는 여기를 갈아끼운다. */
export interface RevDcfHooks {
  /** 현금흐름: 기본 NOPAT − 증분고정 − 증분운전 */
  fcf?: (nopat: number, incrementalFixed: number, incrementalWorking: number) => number;
  /** 터미널(잔여) 가치(할인 전): 기본 NOPAT×(1+i)/(WACC−i) */
  terminalValue?: (nopatN: number, wacc: number, inflation: number) => number;
  /** 할인계수: 기본 1/(1+WACC)^t */
  discountFactor?: (t: number, wacc: number) => number;
}

export type RevDcfVerdict =
  | { kind: "years"; gap: number }
  | { kind: "below_one" }
  | { kind: "over_cap"; explainedPct: number }
  | { kind: "value_destroying" }
  | { kind: "invalid"; reason: string };

export interface RevDcfYear {
  year: number;
  sales: number;
  operatingProfit: number;
  nopat: number;
  incrementalFixed: number;
  incrementalWorking: number;
  fcf: number;
  pvFcf: number;
  cumPvFcf: number;
  pvResidual: number;
  corporateValue: number;
  shareholderValue: number;
  perShare: number;
}

export interface RevDcfResult {
  years: RevDcfYear[]; // year 0 포함 (0은 무성장 기준값)
  verdict: RevDcfVerdict;
  monotonic: "up" | "down" | "mixed";
  thresholdMargin: number;
  thresholdConsistent: boolean; // (마진<임계) ⟺ 가치파괴 판정 일치
  displayCap: number;
  maxYears: number;
}

const DEFAULT_HOOKS: Required<RevDcfHooks> = {
  fcf: (nopat, f, w) => nopat - f - w,
  terminalValue: (nopatN, wacc, inflation) => (nopatN * (1 + inflation)) / (wacc - inflation),
  discountFactor: (t, wacc) => 1 / (1 + wacc) ** t,
};

/**
 * 임계마진 (원전 T8 D30) — 이 성장을 유지하며 가치를 파괴하지 않을 최소 영업이익률.
 * = 현재마진×(1+i)/(1+g) + [g×(fR+wR)×(WACC−i)] / [(1+g)×(1−세율)×(1+WACC)]
 */
export function thresholdMargin(d: RevDcfDrivers, m: RevDcfMarket, currentMargin: number): number {
  const { salesGrowth: g, fixedCapitalRate: fR, workingCapitalRate: wR, taxRate: tax } = d;
  const { wacc, inflation: i } = m;
  return (
    (currentMargin * (1 + i)) / (1 + g) +
    (g * (fR + wR) * (wacc - i)) / ((1 + g) * (1 - tax) * (1 + wacc))
  );
}

export function runRevDcf(
  drivers: RevDcfDrivers,
  market: RevDcfMarket,
  options: RevDcfOptions = {},
  hooks: RevDcfHooks = {}
): RevDcfResult {
  const maxYears = options.maxYears ?? 25;
  const displayCap = options.displayCap ?? 25;
  const h = { ...DEFAULT_HOOKS, ...hooks };
  const { startingSales, salesGrowth: g, operatingMargin, startingMargin, taxRate: tax, fixedCapitalRate: fR, workingCapitalRate: wR } = drivers;
  const { wacc, inflation: i, sharePrice, sharesOutstanding: shares, debt, nonOperatingAssets: nonOp } = market;

  const invalid = (reason: string): RevDcfResult => ({
    years: [], verdict: { kind: "invalid", reason }, monotonic: "mixed", thresholdMargin: NaN, thresholdConsistent: false, displayCap, maxYears,
  });
  if (!(shares > 0)) return invalid("주식수 ≤ 0");
  if (!(wacc > i)) return invalid("WACC ≤ 인플레이션 (잔여가치 발산·0 나누기)");
  if (!Number.isFinite(startingSales)) return invalid("시작 매출 결측");

  // year 0 (무성장 기준): 매출×시작마진, FCF 없음
  const years: RevDcfYear[] = [];
  const op0 = startingSales * startingMargin;
  const nopat0 = op0 * (1 - tax);
  const res0 = h.terminalValue(nopat0, wacc, i) * h.discountFactor(0, wacc);
  const corp0 = res0; // 누적 FCF 0
  const sh0 = corp0 + nonOp - debt;
  years.push({ year: 0, sales: startingSales, operatingProfit: op0, nopat: nopat0, incrementalFixed: 0, incrementalWorking: 0, fcf: 0, pvFcf: 0, cumPvFcf: 0, pvResidual: res0, corporateValue: corp0, shareholderValue: sh0, perShare: sh0 / shares });

  let prevSales = startingSales;
  let cumPv = 0;
  for (let t = 1; t <= maxYears; t++) {
    const sales = prevSales * (1 + g);
    const op = sales * operatingMargin;
    const nopat = op * (1 - tax);
    const incF = (sales - prevSales) * fR;
    const incW = (sales - prevSales) * wR;
    const fcf = h.fcf(nopat, incF, incW);
    const disc = h.discountFactor(t, wacc);
    const pv = fcf * disc;
    cumPv += pv;
    const pvRes = h.terminalValue(nopat, wacc, i) * disc;
    const corp = cumPv + pvRes;
    const sh = corp + nonOp - debt;
    years.push({ year: t, sales, operatingProfit: op, nopat, incrementalFixed: incF, incrementalWorking: incW, fcf, pvFcf: pv, cumPvFcf: cumPv, pvResidual: pvRes, corporateValue: corp, shareholderValue: sh, perShare: sh / shares });
    prevSales = sales;
  }

  // 단조성 (year 1..maxYears perShare)
  const ps = years.slice(1).map((y) => y.perShare);
  const eps = 1e-9 * Math.max(1, Math.abs(ps[0]));
  let up = true, down = true;
  for (let k = 1; k < ps.length; k++) {
    if (ps[k] - ps[k - 1] > eps) down = false;
    else if (ps[k] - ps[k - 1] < -eps) up = false;
  }
  const monotonic: "up" | "down" | "mixed" = up && !down ? "up" : down && !up ? "down" : up && down ? "up" : "mixed";
  if (monotonic === "mixed") {
    // 🔴 드라이버 불변이면 단조여야 한다 — 조용히 넘기지 말 것.
    console.warn("[revdcf] 단조성 mixed — 설계 가정(Δ가치>0 ⟺ 증분ROIC>WACC)이 깨졌을 수 있음", { drivers, market });
  }

  // 임계마진 검산 (현재마진=operatingMargin 기준)
  const thr = thresholdMargin(drivers, market, operatingMargin);
  const marginBelowThreshold = operatingMargin < thr;

  // 판정
  let verdict: RevDcfVerdict;
  if (monotonic === "down") {
    verdict = { kind: "value_destroying" };
  } else if (sharePrice < ps[0]) {
    verdict = { kind: "below_one" };
  } else if (sharePrice > ps[ps.length - 1]) {
    verdict = { kind: "over_cap", explainedPct: ps[ps.length - 1] / sharePrice };
  } else {
    // Excel LOOKUP: 주당가치 ≤ 주가 인 마지막 연차 (오름차순 가정)
    let gap = 1;
    for (let k = 0; k < ps.length; k++) if (ps[k] <= sharePrice) gap = k + 1;
    verdict = { kind: "years", gap };
  }

  const thresholdConsistent = marginBelowThreshold === (verdict.kind === "value_destroying");
  if (!thresholdConsistent) {
    console.warn("[revdcf] 임계마진 ↔ 판정 불일치", { operatingMargin, thresholdMargin: thr, verdict: verdict.kind });
  }

  return { years, verdict, monotonic, thresholdMargin: thr, thresholdConsistent, displayCap, maxYears };
}
