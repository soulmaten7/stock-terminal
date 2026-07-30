// 공용 렌즈 계산 엔진 — 심볼 하나의 7팩터를 야후 데이터로 산출.
// /api/lens 라우트와 배치 프리컴퓨트(스크리닝 토대)가 *같은 함수*를 공유 → 카드 = 배치 계산 일치(엔진 = 검증 일치).
// ⚠️ 프레임워크 무관(next/server import 금지) → tsx 스크립트/크론 어디서든 그대로 호출 가능.
// 구조: buildStockData(데이터 조달·조립) + 제네릭 오케스트레이터(LENSES 레지스트리 순회). (docs/LENS_ARCHITECTURE.md §5)
import * as Sentry from "@sentry/nextjs"; // 프레임워크 무관 유지 — precompute tsx 체인(lensPrecompute)이 이미 import하므로 안전
import YahooFinance from "yahoo-finance2";
import { type Locale, LENS_MISC } from "./lensCopy";
import { computeFScore, type FRow } from "./fscore";
import { marketCap, perFrom, pbrFrom } from "./returns";
import { LENSES } from "./lenses/registry";
import type { StockData, LensRead } from "./lenses/types";
import { createAdminClient } from "./supabase/admin"; // 순수 supabase-js 래퍼 — next/server 무의존(프레임워크 무관 유지)
import { loadCuts, marketOf, CUT_LENSES, type CutMap } from "./lensCuts"; // 분포 유도 판정 컷(STEP 805)
import { krYahooSuffix } from "./activeMarkets"; // STEP 836 §1: 거래소로 야후 접미사 결정(추측 제거)

// 🔴 STEP 836: KR 스냅샷 메타 — 거래소(접미사)·정본 이름·현재가·기준일(교차검증). KR 6자리 코드만.
export type KrMeta = { market: string | null; name: string | null; nameEn: string | null; price: number | null; basDd: string | null; tradeAmount: number | null };
async function fetchKrMeta(symbol: string): Promise<KrMeta | null> {
  if (!/^\d{6}$/.test(symbol)) return null;
  try {
    const sb = createAdminClient();
    const { data } = await sb.from("kr_stock_snapshot").select("market,name,name_en,price,bas_dd,trade_amount").eq("symbol", symbol).maybeSingle();
    if (!data) return null;
    const r = data as { market?: string | null; name?: string | null; name_en?: string | null; price?: number | null; bas_dd?: string | null; trade_amount?: number | null };
    return {
      market: r.market ?? null, name: r.name ?? null, nameEn: r.name_en ?? null,
      price: r.price != null ? Number(r.price) : null, basDd: r.bas_dd ?? null,
      tradeAmount: r.trade_amount != null ? Number(r.trade_amount) : null,
    };
  } catch { return null; }
}
// 🔴 STEP 836 §2: 야후 이름 오염 감지 — 콤마 결합("000300.KS,0P0000KUKB,0")·모닝스타 식별자(0P…)·`.KS`/`.KQ` 포함은 정상 종목명 아님.
export function isContaminatedName(name: string | null | undefined): boolean {
  if (!name) return false;
  return /,/.test(name) || /0P[0-9A-Z]{6,}/.test(name) || /\.(KS|KQ)\b/.test(name);
}

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
export async function buildStockData(symbol: string, _locale: Locale = "ko", krMeta?: KrMeta | null): Promise<StockData & { changePercent: number | null; resolvedVia?: string; gateReason?: string }> {
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
  const isKr6 = /^\d{6}$/.test(symbol);
  // 🔴 STEP 836 §1: KR 접미사를 **거래소(kr_stock_snapshot.market)로 결정**(`.KS` 우선 추측 제거·코스닥 오염 원인).
  //   스냅샷에 있으면 거래소 기준(kosdaq→.KQ)·다른 접미사는 폴백. 스냅샷 없으면(신규·미수록) 기존 폴백(.KS→.KQ)·경로 기록.
  let candidates: string[]; let resolvedVia: string;
  if (isKr6 && krMeta?.market) { const suf = krYahooSuffix(krMeta.market); candidates = [symbol + suf, symbol + (suf === ".KQ" ? ".KS" : ".KQ")]; resolvedVia = `snapshot:${krMeta.market}`; }
  else if (isKr6) { candidates = [symbol + ".KS", symbol + ".KQ"]; resolvedVia = "fallback:no-snapshot"; }
  else { candidates = [symbol]; resolvedVia = "asis"; }
  let resolved = symbol;
  let closes: number[] = [];
  let adjCloses: number[] = []; // 배당 조정 종가(모멘텀·수익률용·STEP 801) — raw closes와 정렬·길이 동일
  let adjComplete = false; // STEP 808 §9: 계열 전체가 유효 adjclose일 때만 true
  let barDates: number[] = []; // STEP 836 §3: resolved 계열 봉 날짜(epoch) — 신선도·동일날짜 대조용
  for (const cand of candidates) {
    try {
      const ch = await yf.chart(cand, { period1, interval: "1d" });
      const raws: number[] = [], adjs: number[] = [], dates: number[] = [];
      let allAdj = true;
      for (const q of ch.quotes ?? []) {
        const c = q.close;
        if (typeof c === "number" && isFinite(c) && c > 0) {
          raws.push(c);
          const dt = q.date instanceof Date ? q.date.getTime() : (q.date ? new Date(q.date as unknown as string).getTime() : NaN);
          dates.push(dt);
          const a = (q as { adjclose?: number | null }).adjclose;
          if (typeof a === "number" && isFinite(a) && a > 0) adjs.push(a);
          else { adjs.push(c); allAdj = false; } // 이 봉 adjclose 결측
        }
      }
      if (raws.length >= 30) {
        resolved = cand; closes = raws; barDates = dates;
        // 🔴 STEP 808 §9: 봉마다 `adj ?? close`로 섞으면 모멘텀(두 봉 비율)이 배당/분할 계수만큼 통째로 틀림 →
        //   계열 전체가 유효할 때만 adjclose 사용, 하나라도 결측이면 raw 계열로(모멘텀이 raw로 일관 계산).
        adjComplete = allAdj;
        adjCloses = allAdj ? adjs : raws;
        break;
      }
    } catch {
      /* 다음 후보 시도 */
    }
  }

  // 현재가·PER·PBR·이름(밸류에이션 렌즈용) — 해석된 심볼로 조회
  let pe: number | null = null, pb: number | null = null, name = symbol, price: number | null = null, changePercent: number | null = null;
  let marketCapQuote: number | null = null; // 야후가 주는 실시간 시총(최신 주식수 반영) — 재무 주식수보다 우선(STEP 803 §2)
  let peBasis: "ttm" | "annual" | null = null; // 🔴 STEP 809 §1: PER을 무엇으로 냈는지(야후 trailingPE=TTM 1순위 / 연간 폴백). 화면 문구가 이 값 따라 분기.
  try {
    const q = await yf.quote(resolved);
    pe = (q as { trailingPE?: number }).trailingPE ?? null;
    if (pe != null) peBasis = "ttm"; // 야후 trailingPE = 최근 4분기(TTM)
    pb = (q as { priceToBook?: number }).priceToBook ?? null;
    name = (q as { shortName?: string }).shortName || (q as { longName?: string }).longName || name;
    const rmp = (q as { regularMarketPrice?: number }).regularMarketPrice;
    price = typeof rmp === "number" && isFinite(rmp) && rmp > 0 ? rmp : null; // STEP 836 §4: 0/음수 종가(거래정지·데이터결측)는 0원 저장 금지 → null
    changePercent = (q as { regularMarketChangePercent?: number }).regularMarketChangePercent ?? null;
    const mcq = (q as { marketCap?: number }).marketCap;
    marketCapQuote = typeof mcq === "number" && isFinite(mcq) && mcq > 0 ? mcq : null;
  } catch {
    /* quote 실패해도 가격기반 렌즈는 계산 */
  }
  // STEP 836 §4: KR은 현재가도 KRX 스냅샷이 정본 — 야후가 0/결측이면 신뢰 종가로 폴백(0원 표시·시총 0 방지).
  if (price == null && isKr6 && krMeta?.price != null && krMeta.price > 0) price = krMeta.price;

  // 🔴 STEP 836 §2: KR 종목명 정본화 — 스냅샷 이름 우선(야후 오염명 "000300.KS,0P…,0" 배제). en=name_en·없으면 한글 폴백(147bc39).
  if (isKr6 && krMeta && (krMeta.name || krMeta.nameEn)) {
    name = (_locale === "en" ? (krMeta.nameEn || krMeta.name) : krMeta.name) || name;
  }
  if (isContaminatedName(name)) name = symbol; // 스냅샷도 없고 야후명이 오염이면 티커로(오염 저장 금지)

  // 🔴 STEP 836 §3: 교차검증 게이트 — 가격 계열 신뢰를 두 독립 출처(야후·KRX 스냅샷) 대조로 판정(값 크기 아님·같은 날짜 불일치).
  let gateReason: string | undefined;
  if (isKr6 && closes.length >= 30) {
    const lastBar = barDates.length ? barDates[barDates.length - 1] : NaN;
    const ageDays = isFinite(lastBar) ? (Date.now() - lastBar) / 864e5 : Infinity;
    if (ageDays > 7) {
      gateReason = "stale-series"; // (a) 야후 최신 봉이 5영업일(≈7일)↑ 뒤처지면 stale → 결측(거래정지·상폐·오조회)
    } else if (krMeta?.price != null && krMeta.price > 0 && krMeta.basDd && /^\d{8}$/.test(krMeta.basDd)) {
      // (b) 동일 날짜 대조: 스냅샷 bas_dd의 야후 종가 vs 스냅샷 price. 같은 날 KRX 종가는 두 출처가 일치해야 정상 —
      //     15%↑ 다르면 야후가 다른/오염 심볼을 물어온 것(엔켐 190,900 vs 14,790 = 12.9배). 임계 15%=1일 lag·반올림 초과·오염 명확 분리.
      const bd = krMeta.basDd, target = Date.UTC(+bd.slice(0, 4), +bd.slice(4, 6) - 1, +bd.slice(6, 8));
      let bestI = -1, bestDiff = Infinity;
      for (let i = 0; i < barDates.length; i++) { const dd = Math.abs(barDates[i] - target); if (isFinite(dd) && dd < bestDiff) { bestDiff = dd; bestI = i; } }
      if (bestI >= 0 && bestDiff <= 2 * 864e5) { // bas_dd ±1영업일 봉이 있을 때만 대조(없으면=스냅샷 stale 등, 대조 생략)
        const gap = Math.abs(closes[bestI] - krMeta.price) / krMeta.price;
        if (gap > 0.15) gateReason = "price-mismatch";
      }
    }
    if (gateReason) {
      Sentry.captureMessage(`[kr-cross-source] ${symbol} ${gateReason}(resolved ${resolved}·야후봉 ${isFinite(lastBar) ? new Date(lastBar).toISOString().slice(0, 10) : "?"}·스냅샷 ${krMeta?.price}@${krMeta?.basDd})`, "warning");
      closes = []; adjCloses = []; barDates = []; // 신뢰 못하는 계열 → 가격기반 렌즈 전부 결측(그럴듯한 오염 방지)
    }
  }

  // STEP 803 §3: KR 우선주(예: 005935) — '우선주 가격 × 보통주 주식수 ÷ 모회사 순이익'은 잘못된 PER/PBR을 낳는다.
  //   6자리 코드 중 보통주(끝자리 0)가 아니면 우선주로 보고 밸류 렌즈를 계산 불가(정직 결측)로 둔다(가장 안전한 기본값).
  const isKrPreferred = /^\d{6}$/.test(symbol) && !symbol.endsWith("0");

  // 데이터 부족(가격계열<30·게이트 결측 포함) → 재무 fetch·밸류 폴백 생략, 빈 재무 번들 반환.
  if (closes.length < 30) {
    return { symbol, resolved, name, price, changePercent, closes, adjCloses, adjUsed: adjComplete, pe, pb, peBasis, financials: [], resolvedVia, gateReason };
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
    if (pe == null) { pe = perFrom(mc, lr?.netIncome); if (pe != null) peBasis = "annual"; } // 폴백 = 직전 연간 순이익(E/P)
    if (pb == null) pb = pbrFrom(mc, lr?.stockholdersEquity);
  }

  return { symbol, resolved, name, price, changePercent, closes, adjCloses, adjUsed: adjComplete, pe, pb, peBasis, financials: rows, resolvedVia, gateReason };
}

// 심볼 1개 → 7팩터(모멘텀·저변동·기술·밸류·퀄리티·자산성장) + F-Score.
// 제네릭 오케스트레이터: LENSES 레지스트리를 순회해 계산(수동 배선 제거·async 대응).
export async function computeSymbolLenses(symbol: string, locale: Locale = "ko", cuts?: CutMap): Promise<SymbolLenses> {
  // 분포 유도 판정 컷(STEP 805) — 배치는 시장별 1회 로드분을 주입, 온디맨드(/api/lens)는 여기서 자동 로드(10분 캐시).
  // 컷 '없음'(빈 테이블) → {} → 렌즈 'pending'(기준 준비 중).
  // 🔴 STEP 808 §2: 컷 '조회 오류'(DB 장애)를 치명 실패로 만들지 않는다 — 삼켜서 계속 계산하되(가격·이름·기술·F-Score 정상),
  //   분포 5렌즈만 verdict를 '기준을 불러오지 못했어요'(일시 오류·pending과 구분)로 후처리. loadCuts는 이미 Sentry 캡처.
  let cutsError = false;
  const cutMap = cuts ?? (await loadCuts(marketOf(symbol)).catch(() => { cutsError = true; return {} as CutMap; }));
  // 🔴 STEP 836: KR 스냅샷 메타를 먼저 조회(거래소·이름·가격·기준일) → buildStockData에 주입(접미사·이름·교차검증). KR은 tradeAmount도 여기서(중복 조회 회피).
  const krMeta = await fetchKrMeta(symbol);
  const [d, tradeAmount] = await Promise.all([
    buildStockData(symbol, locale, krMeta),
    krMeta ? Promise.resolve(krMeta.tradeAmount) : fetchTradeAmount(symbol),
  ]);

  if (d.closes.length < 30) {
    // 게이트 결측(교차검증 실패·stale)은 별도 사유로 — "데이터 없음"으로 뭉개지 않음(§3-3).
    const err = d.gateReason ? `cross_source_${d.gateReason.replace("-", "_")}` : "insufficient_data";
    return { symbol, resolved: d.resolved, name: d.name, price: d.price, changePercent: d.changePercent, tradeAmount, lenses: [], fscore: null, error: err };
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

  // STEP 808 §2: 컷 조회 실패면 분포 5렌즈의 'pending'(빈 컷→기준 준비 중) verdict를 '기준을 불러오지 못했어요'(일시 오류)로 교체.
  //   상태(state)는 그대로 두고 문구만 구분(라이브 응답이라 미저장) — 가격·기술·F-Score·이름은 정상 렌더.
  if (cutsError) {
    for (const l of allLenses) {
      if (CUT_LENSES.includes(l.key as (typeof CUT_LENSES)[number]) && l.state === "pending") {
        l.verdict = { phrase: LENS_MISC[locale].cutsErrorPhrase, plain: LENS_MISC[locale].cutsErrorPlain, tone: "flat" };
      }
    }
  }

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

  // 🔴 STEP 809 §6: 재무 없어도 퀄리티·자산성장을 배열에서 제거하지 않는다(예전엔 조용히 사라져 "N개는 계산 못 함"에 안 잡히고 "5가지 방법으로"가 됐음).
  //   재무 없으면 두 렌즈는 state='na'(gpa/ag=null)로 이미 산출 → na 카드("산출 불가")로 표시 + naNote 카운트에 정직히 포함.
  const lenses = allLenses;

  return { symbol, resolved: d.resolved, name: d.name, price: d.price, changePercent: d.changePercent, tradeAmount, lenses, fscore };
}
