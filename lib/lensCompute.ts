// 공용 렌즈 계산 엔진 — 심볼 하나의 7팩터를 야후 데이터로 산출.
// /api/lens 라우트와 배치 프리컴퓨트(스크리닝 토대)가 *같은 함수*를 공유 → 카드 = 배치 계산 일치(엔진 = 검증 일치).
// ⚠️ 프레임워크 무관(next/server import 금지) → tsx 스크립트/크론 어디서든 그대로 호출 가능.
// 구조: buildStockData(데이터 조달·조립) + 제네릭 오케스트레이터(LENSES 레지스트리 순회). (docs/LENS_ARCHITECTURE.md §5)
import * as Sentry from "@sentry/nextjs"; // 프레임워크 무관 유지 — precompute tsx 체인(lensPrecompute)이 이미 import하므로 안전
import YahooFinance from "yahoo-finance2";
import { type Locale } from "./lensCopy";
import { computeFScore, type FRow } from "./fscore";
import { marketCap, perFrom, pbrFrom } from "./returns";
import { LENSES } from "./lenses/registry";
import type { StockData, LensRead } from "./lenses/types";
import { createAdminClient } from "./supabase/admin"; // 순수 supabase-js 래퍼 — next/server 무의존(프레임워크 무관 유지)
import { loadCuts, marketOf, type CutMap } from "./lensCuts"; // 분포 유도 판정 컷(STEP 805)

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// 렌즈 실패 Sentry 폭주 억제(STEP 797 §4) — per-lens×심볼 캡처는 배치(수천 종목)에서 크론 1회에 수만 건 발생.
// 렌즈키별 '첫 실패 1건'만 예시로 캡처하고, 나머지는 집계만. 배치는 끝에서 flushLensFailures로 1건 요약.
const lensFailCaptured = new Set<string>();
const lensFailCounts = new Map<string, number>();

// 배치 종료 시 호출 — 렌즈키별 실패 건수를 1건으로 요약 보고 후 리셋(다음 실행 컨텍스트 대비).
export function flushLensFailures(context: string): void {
  if (lensFailCounts.size === 0) return;
  const summary = [...lensFailCounts.entries()].map(([k, n]) => `${k}=${n}`).join(" · ");
  Sentry.captureMessage(`[lens_compute] ${context}: per-lens failures — ${summary}`, "warning");
  lensFailCounts.clear();
  lensFailCaptured.clear();
}

export type SymbolLenses = {
  symbol: string;
  resolved: string;
  name: string;
  price: number | null;
  changePercent: number | null; // 상세 헤더 메타줄(STEP 774 §2) — 이미 fetch하는 야후 quote에서 추출(추가 조회 없음)
  tradeAmount: number | null; // 상세 헤더 거래대금(STEP 774 §2) — KR/US만(kr_stock_snapshot·us_stock_perf), 그 외 시장은 정직 결측(null)
  lenses: LensRead[];
  fscore: unknown; // computeFScore 결과(별도 형태) 또는 null
  error?: string;
};

// 거래대금 — KR(6자리 코드)=kr_stock_snapshot.trade_amount · 그 외(US 등)=us_stock_perf.amount.
// JP/CN/VN/GB는 두 테이블 어디에도 없어 자연스럽게 null(항목 생략 — 정직 결측).
async function fetchTradeAmount(symbol: string): Promise<number | null> {
  try {
    const sb = createAdminClient();
    if (/^\d{6}$/.test(symbol)) {
      const { data } = await sb.from("kr_stock_snapshot").select("trade_amount").eq("symbol", symbol).maybeSingle();
      return (data as { trade_amount: number | null } | null)?.trade_amount ?? null;
    }
    const { data } = await sb.from("us_stock_perf").select("amount").eq("symbol", symbol).maybeSingle();
    return (data as { amount: number | null } | null)?.amount ?? null;
  } catch {
    return null;
  }
}

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
export async function buildStockData(symbol: string, _locale: Locale = "ko"): Promise<StockData & { changePercent: number | null }> {
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
  // KR 보드 6자리 코드(예: 005930) → 야후 심볼 해석(.KS 우선, 실패 시 .KQ). 그 외(NVDA·7203.T·0700.HK)는 그대로.
  const candidates = /^\d{6}$/.test(symbol) ? [symbol + ".KS", symbol + ".KQ"] : [symbol];
  let resolved = symbol;
  let closes: number[] = [];
  let adjCloses: number[] = []; // 배당 조정 종가(모멘텀·수익률용·STEP 801) — raw closes와 정렬·길이 동일
  for (const cand of candidates) {
    try {
      const ch = await yf.chart(cand, { period1, interval: "1d" });
      const raws: number[] = [], adjs: number[] = [];
      for (const q of ch.quotes ?? []) {
        const c = q.close;
        if (typeof c === "number" && isFinite(c) && c > 0) {
          raws.push(c);
          const a = (q as { adjclose?: number | null }).adjclose;
          adjs.push(typeof a === "number" && isFinite(a) && a > 0 ? a : c); // adjclose 없으면 raw 폴백(정직)
        }
      }
      if (raws.length >= 30) { resolved = cand; closes = raws; adjCloses = adjs; break; }
    } catch {
      /* 다음 후보 시도 */
    }
  }

  // 현재가·PER·PBR·이름(밸류에이션 렌즈용) — 해석된 심볼로 조회
  let pe: number | null = null, pb: number | null = null, name = symbol, price: number | null = null, changePercent: number | null = null;
  let marketCapQuote: number | null = null; // 야후가 주는 실시간 시총(최신 주식수 반영) — 재무 주식수보다 우선(STEP 803 §2)
  try {
    const q = await yf.quote(resolved);
    pe = (q as { trailingPE?: number }).trailingPE ?? null;
    pb = (q as { priceToBook?: number }).priceToBook ?? null;
    name = (q as { shortName?: string }).shortName || (q as { longName?: string }).longName || name;
    price = (q as { regularMarketPrice?: number }).regularMarketPrice ?? null;
    changePercent = (q as { regularMarketChangePercent?: number }).regularMarketChangePercent ?? null;
    const mcq = (q as { marketCap?: number }).marketCap;
    marketCapQuote = typeof mcq === "number" && isFinite(mcq) && mcq > 0 ? mcq : null;
  } catch {
    /* quote 실패해도 가격기반 렌즈는 계산 */
  }

  // STEP 803 §3: KR 우선주(예: 005935) — '우선주 가격 × 보통주 주식수 ÷ 모회사 순이익'은 잘못된 PER/PBR을 낳는다.
  //   6자리 코드 중 보통주(끝자리 0)가 아니면 우선주로 보고 밸류 렌즈를 계산 불가(정직 결측)로 둔다(가장 안전한 기본값).
  const isKrPreferred = /^\d{6}$/.test(symbol) && !symbol.endsWith("0");

  // 데이터 부족(가격계열<30) → 재무 fetch·밸류 폴백 생략(현 동작 보존), 빈 재무 번들 반환.
  if (closes.length < 30) {
    return { symbol, resolved, name, price, changePercent, closes, adjCloses, pe, pb, financials: [] };
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
  // 시총은 야후 quote.marketCap(최신 주식수) 우선 — 없을 때만 직전 회계연도 주식수로 폴백(최대 15개월 묵음·STEP 803 §2).
  const mc = marketCapQuote ?? marketCap(price, lr?.ordinarySharesNumber);
  if (isKrPreferred) {
    // 우선주는 보통주 기준 PER/PBR이 왜곡 → 폴백 산출을 하지 않는다(야후가 직접 준 값이 있으면 그대로 신뢰).
    // (야후 trailingPE/priceToBook은 해당 종목 자체 기준이라 유효할 수 있어 덮어쓰지 않음)
  } else {
    if (pe == null) pe = perFrom(mc, lr?.netIncome);
    if (pb == null) pb = pbrFrom(mc, lr?.stockholdersEquity);
  }

  return { symbol, resolved, name, price, changePercent, closes, adjCloses, pe, pb, financials: rows };
}

// 심볼 1개 → 7팩터(모멘텀·저변동·기술·밸류·퀄리티·자산성장) + F-Score.
// 제네릭 오케스트레이터: LENSES 레지스트리를 순회해 계산(수동 배선 제거·async 대응).
export async function computeSymbolLenses(symbol: string, locale: Locale = "ko", cuts?: CutMap): Promise<SymbolLenses> {
  // 분포 유도 판정 컷(STEP 805) — 배치는 시장별 1회 로드분을 주입, 온디맨드(/api/lens)는 여기서 자동 로드(10분 캐시).
  // 컷 '없음'(빈 테이블) → {} → 렌즈 'pending'(기준 준비 중). 컷 '조회 오류'(DB 장애) → loadCuts가 throw →
  //   /api/lens가 {error}로 응답 → 화면은 '일시 오류' UI(pending과 구분·STEP 806 §4). 여기서 삼키지 않는다.
  const cutMap = cuts ?? (await loadCuts(marketOf(symbol)));
  const [d, tradeAmount] = await Promise.all([buildStockData(symbol, locale), fetchTradeAmount(symbol)]);

  if (d.closes.length < 30) {
    return { symbol, resolved: d.resolved, name: d.name, price: d.price, changePercent: d.changePercent, tradeAmount, lenses: [], fscore: null, error: "insufficient_data" };
  }

  // 렌즈별 격리 — 하나가 throw해도 나머지는 산출(F-Score 격리와 동일 방침). 실패 렌즈만 제외하고
  // 화면은 나머지 카드를 정상 표시한다. 실패는 Sentry로 캡처(어느 렌즈·어느 심볼인지).
  const settled = await Promise.all(
    LENSES.map(async (l) => {
      try {
        return await l.compute(d, locale, cutMap);
      } catch (e) {
        // 렌즈키별 첫 1건만 캡처(예시)·이후는 집계만 — 배치 폭주 방지(STEP 797 §4).
        const k = l.meta.key;
        lensFailCounts.set(k, (lensFailCounts.get(k) ?? 0) + 1);
        if (!lensFailCaptured.has(k)) {
          lensFailCaptured.add(k);
          Sentry.captureException(e, { tags: { pipeline: "lens_compute", lens: k }, extra: { symbol } });
        }
        return null;
      }
    }),
  );
  const allLenses = settled.filter((l): l is LensRead => l !== null);

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

  return { symbol, resolved: d.resolved, name: d.name, price: d.price, changePercent: d.changePercent, tradeAmount, lenses, fscore };
}
