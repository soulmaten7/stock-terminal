// SEC EDGAR companyfacts 어댑터 — 무료·공식 深재무(대개 2009~). ticker→CIK→연도별 FRow[].
// F-Score 다년 백테스트(진짜 검증)의 데이터 토대. 정찰(STEP 505)로 확인된 태그·공백 처리 반영.
// SEC 정책: User-Agent 필수, 10 req/s 이하. (연락처 UA는 실제 값으로 바꿔도 됨)
import type { FRow } from "./fscore";

const UA = { "User-Agent": "EarthTicker Research admin@earthticker.app" };

// F-Score 입력 → us-gaap 태그 후보(회사·연도별 편차 대비 여러 개, 정찰 결과 반영).
const CONCEPTS: Record<string, string[]> = {
  netIncome: ["NetIncomeLoss"],
  totalAssets: ["Assets"],
  operatingCashFlow: ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"],
  totalRevenue: [
    "RevenueFromContractWithCustomerExcludingAssessedTax", // ASC606(현행 표준·대다수)
    "Revenues",
    "RevenueFromContractWithCustomerIncludingAssessedTax",
    "SalesRevenueNet", // 구 표준
    "SalesRevenueGoodsNet",
    "SalesRevenueServicesNet",
    "RevenuesNetOfInterestExpense", // 은행류
    "TotalRevenuesAndOtherIncome",
    "RegulatedAndUnregulatedOperatingRevenue", // 유틸리티
    "RealEstateRevenueNet", // 부동산
    "OilAndGasRevenue", // 정유·에너지
    "HealthCareOrganizationRevenue", // 헬스케어
    "RoyaltyRevenue", // 로열티
  ],
  costOfRevenue: [
    "CostOfRevenue",
    "CostOfRevenues",
    "CostOfOperatingRevenues",
    "CostOfSales",
    "CostOfGoodsAndServicesSold",
    "CostOfGoodsSold",
    "CostOfServices",
    "CostOfGoodsSoldExcludingDepreciationDepletionAndAmortization",
  ],
  grossProfit: ["GrossProfit"],
  currentAssets: ["AssetsCurrent"],
  currentLiabilities: ["LiabilitiesCurrent"],
  longTermDebt: ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations"],
  shares: ["CommonStockSharesOutstanding", "WeightedAverageNumberOfSharesOutstandingBasic", "WeightedAverageNumberOfDilutedSharesOutstanding"],
  // 자기자본(B/M 밸류 팩터용). 지배+비지배 포함 태그도 후보 — 은행·보험 등 금융주도 유효(밸류는 F-Score와 달리 금융 제외 안 함).
  stockholdersEquity: ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
};

let _cikMap: Record<string, string> | null = null;
async function cikFor(ticker: string): Promise<string | null> {
  if (!_cikMap) {
    // 사용자 대면 핫패스(/api/lens·/api/brief, maxDuration 30) — 무타임아웃이면 SEC 지연이 곧 화면 실패.
    try {
      const tj = (await (await fetch("https://www.sec.gov/files/company_tickers.json", { headers: UA, signal: AbortSignal.timeout(8000) })).json()) as Record<string, { cik_str: number; ticker: string }>;
      const map: Record<string, string> = {};
      for (const k in tj) map[String(tj[k].ticker).toUpperCase()] = String(tj[k].cik_str).padStart(10, "0");
      _cikMap = map; // 성공 시에만 캐시(부분 실패로 빈 맵이 굳는 것 방지)
    } catch {
      return null; // 타임아웃·실패 → 폴백(null), 캐시하지 않음(다음 호출 재시도)
    }
  }
  return _cikMap[ticker.toUpperCase()] ?? null;
}

type FactEntry = { form?: string; fp?: string; fy?: number; filed?: string; val: number };

// 태그 후보 중 처음 잡히는 것으로 연간(10-K·FY) 값을 {회계연도: 값}으로.
function annualByFY(facts: Record<string, Record<string, { units?: Record<string, FactEntry[]> }>>, tags: string[]): Record<number, number> | null {
  const ns = facts["us-gaap"] || {};
  for (const tag of tags) {
    const node = ns[tag];
    if (!node || !node.units) continue;
    const arr = node.units.USD || node.units.shares || Object.values(node.units)[0] || [];
    const byFy: Record<number, FactEntry> = {};
    for (const e of arr) {
      if (e.form && String(e.form).startsWith("10-K") && e.fp === "FY" && e.fy) {
        const prev = byFy[e.fy];
        if (!prev || String(e.filed) > String(prev.filed)) byFy[e.fy] = e; // 최신 filed 우선(정정 반영)
      }
    }
    const fys = Object.keys(byFy);
    if (fys.length) {
      const o: Record<number, number> = {};
      for (const fy of fys) o[Number(fy)] = byFy[Number(fy)].val;
      return o;
    }
  }
  return null;
}

export type EdgarRow = FRow & { fy: number; stockholdersEquity: number | null };

// ticker의 연도별 재무행(오름차순). 공백 처리: 매출=gross+cost 역산 / 매출총이익=gross 또는 rev-cost / 장기부채 공백=0.
export async function edgarRows(ticker: string): Promise<EdgarRow[]> {
  const cik = await cikFor(ticker);
  if (!cik) return [];
  let cf: { facts?: Record<string, Record<string, { units?: Record<string, FactEntry[]> }>> };
  try {
    cf = (await (await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: UA, signal: AbortSignal.timeout(8000) })).json()) as typeof cf;
  } catch {
    return [];
  }
  const facts = cf.facts || {};
  const g: Record<string, Record<number, number> | null> = {};
  for (const f in CONCEPTS) g[f] = annualByFY(facts, CONCEPTS[f]);

  const years = [...new Set(Object.values(g).filter(Boolean).flatMap((m) => Object.keys(m as Record<number, number>).map(Number)))].sort((a, b) => a - b);
  const rows: EdgarRow[] = [];
  for (const fy of years) {
    const get = (f: string): number | null => (g[f] && g[f]![fy] != null ? g[f]![fy] : null);
    let rev = get("totalRevenue");
    const gross0 = get("grossProfit");
    const cor = get("costOfRevenue");
    if (rev == null && gross0 != null && cor != null) rev = gross0 + cor; // 매출 공백 → 역산
    let gross = gross0;
    if (gross == null && rev != null && cor != null) gross = rev - cor; // 매출총이익 항상 확보
    rows.push({
      date: new Date(fy, 11, 31),
      fy,
      totalRevenue: rev,
      grossProfit: gross,
      costOfRevenue: cor,
      netIncome: get("netIncome"),
      totalAssets: get("totalAssets"),
      currentAssets: get("currentAssets"),
      currentLiabilities: get("currentLiabilities"),
      longTermDebt: get("longTermDebt") ?? 0, // 공백 → 무차입 간주(0)
      operatingCashFlow: get("operatingCashFlow"),
      ordinarySharesNumber: get("shares"),
      stockholdersEquity: get("stockholdersEquity"),
    });
  }
  return rows;
}
