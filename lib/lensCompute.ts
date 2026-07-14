// 공용 렌즈 계산 엔진 — 심볼 하나의 7팩터를 야후 데이터로 산출.
// /api/lens 라우트와 배치 프리컴퓨트(스크리닝 토대)가 *같은 함수*를 공유 → 카드 = 배치 계산 일치(엔진 = 검증 일치).
// ⚠️ 프레임워크 무관(next/server import 금지) → tsx 스크립트/크론 어디서든 그대로 호출 가능.
// 구조: buildStockData(데이터 조달·조립) + 제네릭 오케스트레이터(LENSES 레지스트리 순회). (docs/LENS_ARCHITECTURE.md §5)
import YahooFinance from "yahoo-finance2";
import { type Locale } from "./lensCopy";
import { computeFScore, type FRow } from "./fscore";
import { marketCap, perFrom, pbrFrom } from "./returns";
import { LENSES } from "./lenses/registry";
import type { StockData, LensRead } from "./lenses/types";

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export type SymbolLenses = {
  symbol: string;
  resolved: string;
  name: string;
  price: number | null;
  lenses: LensRead[];
  fscore: unknown; // computeFScore 결과(별도 형태) 또는 null
  error?: string;
};

// 종목의 야후 표시명(shortName·없으면 longName). R3 일본 뉴스 검색어용(일본 상호가 오면 그대로 사용).
export async function fetchYahooName(symbol: string): Promise<string | null> {
  try {
    const q = await yf.quote(symbol);
    return (q as { shortName?: string }).shortName || (q as { longName?: string }).longName || null;
  } catch {
    return null;
  }
}

// 심볼 1개 → 표준 데이터 번들(StockData). 한 번 fetch → 모든 렌즈에 주입(docs/LENS_ARCHITECTURE.md §1).
// 야후 3콜(chart 400일 · quote · fundamentalsTimeSeries 6년). 부분 실패해도 가능한 렌즈는 계산(안전).
export async function buildStockData(symbol: string, _locale: Locale = "ko"): Promise<StockData> {
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
  // KR 보드 6자리 코드(예: 005930) → 야후 심볼 해석(.KS 우선, 실패 시 .KQ). 그 외(NVDA·7203.T·0700.HK)는 그대로.
  const candidates = /^\d{6}$/.test(symbol) ? [symbol + ".KS", symbol + ".KQ"] : [symbol];
  let resolved = symbol;
  let closes: number[] = [];
  for (const cand of candidates) {
    try {
      const ch = await yf.chart(cand, { period1, interval: "1d" });
      const cs = (ch.quotes ?? [])
        .map((q) => q.close)
        .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
      if (cs.length >= 30) { resolved = cand; closes = cs; break; }
    } catch {
      /* 다음 후보 시도 */
    }
  }

  // 현재가·PER·PBR·이름(밸류에이션 렌즈용) — 해석된 심볼로 조회
  let pe: number | null = null, pb: number | null = null, name = symbol, price: number | null = null;
  try {
    const q = await yf.quote(resolved);
    pe = (q as { trailingPE?: number }).trailingPE ?? null;
    pb = (q as { priceToBook?: number }).priceToBook ?? null;
    name = (q as { shortName?: string }).shortName || (q as { longName?: string }).longName || name;
    price = (q as { regularMarketPrice?: number }).regularMarketPrice ?? null;
  } catch {
    /* quote 실패해도 가격기반 렌즈는 계산 */
  }

  // 데이터 부족(가격계열<30) → 재무 fetch·밸류 폴백 생략(현 동작 보존), 빈 재무 번들 반환.
  if (closes.length < 30) {
    return { symbol, resolved, name, price, closes, pe, pb, financials: [] };
  }

  // 연간 재무(fundamentalsTimeSeries) — F-Score·퀄리티·자산성장 + 밸류(E/P·B/M) 폴백에 공용. 실패 시 rows=[] (안전).
  let rows: FRow[] = [];
  try {
    const fts = await yf.fundamentalsTimeSeries(resolved, {
      period1: new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      type: "annual",
      module: "all",
    });
    const raw = (Array.isArray(fts) ? fts : []) as Array<Record<string, unknown>>;
    rows = raw
      .map((r) => ({
        date: r.date,
        totalRevenue: (r.totalRevenue as number) ?? null,
        grossProfit: (r.grossProfit as number) ?? null,
        costOfRevenue: (r.costOfRevenue as number) ?? null,
        netIncome: (r.netIncome as number) ?? null,
        totalAssets: (r.totalAssets as number) ?? null,
        currentAssets: (r.currentAssets as number) ?? null,
        currentLiabilities: (r.currentLiabilities as number) ?? null,
        longTermDebt: (r.longTermDebt as number) ?? null,
        operatingCashFlow: (r.operatingCashFlow as number) ?? null,
        ordinarySharesNumber: (r.ordinarySharesNumber as number) ?? null,
        stockholdersEquity: (r.stockholdersEquity as number) ?? (r.commonStockEquity as number) ?? null,
      }))
      .sort((a, b) => {
        const da = a.date instanceof Date ? a.date.getTime() : new Date(String(a.date)).getTime();
        const db = b.date instanceof Date ? b.date.getTime() : new Date(String(b.date)).getTime();
        return da - db;
      });
  } catch {
    rows = [];
  }
  const lr = rows[rows.length - 1];

  // 밸류(E/P·B/M) 폴백 — 야후 trailingPE/priceToBook이 null(한국 .KS 등)이면 재무로 직접 산출.
  // PER = 시총/순이익(적자면 null), PBR = 시총/자기자본. (STEP696 · §docs/LENS_DEV_PLAYBOOK.md #29)
  const mc = marketCap(price, lr?.ordinarySharesNumber);
  if (pe == null) pe = perFrom(mc, lr?.netIncome);
  if (pb == null) pb = pbrFrom(mc, lr?.stockholdersEquity);

  return { symbol, resolved, name, price, closes, pe, pb, financials: rows };
}

// 심볼 1개 → 7팩터(모멘텀·저변동·기술·밸류·퀄리티·자산성장) + F-Score.
// 제네릭 오케스트레이터: LENSES 레지스트리를 순회해 계산(수동 배선 제거·async 대응).
export async function computeSymbolLenses(symbol: string, locale: Locale = "ko"): Promise<SymbolLenses> {
  const d = await buildStockData(symbol, locale);

  if (d.closes.length < 30) {
    return { symbol, resolved: d.resolved, name: d.name, price: d.price, lenses: [], fscore: null, error: "insufficient_data" };
  }

  const allLenses = await Promise.all(LENSES.map((l) => l.compute(d, locale)));

  // F-Score = 독립 모듈. 현 동작 보존: 재무 행 없으면 null(§docs/LENS_ARCHITECTURE.md §6 "현 UI 유지").
  let fscore: unknown = null;
  const lr = d.financials[d.financials.length - 1];
  if (lr) {
    try {
      fscore = computeFScore(d.financials, locale);
    } catch {
      fscore = null;
    }
  }

  // 재무 행 없으면 퀄리티·자산성장은 배열에서 제외(리팩토링 전 동작 보존 — 예전엔 if(lr)일 때만 push했음).
  const lenses = lr ? allLenses : allLenses.filter((l) => l.key !== "quality" && l.key !== "assetgrowth");

  return { symbol, resolved: d.resolved, name: d.name, price: d.price, lenses, fscore };
}
