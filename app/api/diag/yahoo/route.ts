import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

// STEP1007 W2 — 프로덕션에서만 얻을 수 있는 값을 심는다(1006이 로컬에서 못 확정한 것).
// STEP1010 — quoteSummary 시험 + quote 값 비교 확장. 🔴 이 파일 외 코드 수정 0.
// 🔴 크론이 아니다 — Vercel 크론 슬롯을 쓰지 않는다(vercel.json 무접촉, app router가 자동 인식).
// 🔴 DB에 한 행도 쓰지 않는다. 결과는 응답 JSON으로만 돌려준다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// STEP1006에서 로컬은 완전 데이터였던 대형주 5 + 대조군 7(양쪽 성공 3·양쪽 실패=이중결측 4).
const DEFAULT_SYMBOLS = ["HD", "LOW", "TGT", "MU", "CRM", "AAPL", "MSFT", "NVDA", "GV", "KVAC", "PSTV", "USA"];
const MAX_SYMBOLS = 50;
const GAP_MS = 200;
const SUMMARY_MODULES = ["price", "defaultKeyStatistics", "summaryDetail", "quoteType"] as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type QuoteResult = {
  ok: boolean;
  error?: string;
  has: { marketCap: boolean; regularMarketPrice: boolean; sharesOutstanding: boolean };
  quoteType?: string;
  exchange?: string;
  fullExchangeName?: string;
  marketState?: string;
  // STEP1010 §3-1 — 1009가 못 한 값 비교(존재만 아니라 실제 값).
  symbol?: string;
  currency?: string;
  region?: string;
  language?: string;
  market?: string;
  typeDisp?: string;
  exchangeTimezoneName?: string;
  fields?: string[];
};

type ModuleBlock = {
  present: boolean; // 모듈이 응답 객체에 존재하는지(undefined면 false)
  fields?: string[]; // 그 모듈이 실제로 받은 키 배열
  // 지정된 관심 필드의 존재여부+값
  values?: Record<string, unknown>;
};

type SummaryResult = {
  ok: boolean; // 호출 자체(네트워크·심볼무효 등) 성공 여부 — 모듈 결측과는 다른 범주(833 원칙)
  callError?: string;
  price?: ModuleBlock;
  defaultKeyStatistics?: ModuleBlock;
  summaryDetail?: ModuleBlock;
  quoteType?: ModuleBlock;
};

type SymbolResult = {
  symbol: string;
  quote?: QuoteResult;
  summary?: SummaryResult;
};

function moduleBlock(obj: unknown, valueKeys: string[]): ModuleBlock {
  if (obj == null || typeof obj !== "object") return { present: false };
  const rec = obj as Record<string, unknown>;
  const values: Record<string, unknown> = {};
  for (const k of valueKeys) values[k] = rec[k] ?? null;
  return { present: true, fields: Object.keys(rec).sort(), values };
}

async function fetchQuote(symbol: string): Promise<QuoteResult> {
  try {
    const q = (await yf.quote(symbol)) as Record<string, unknown>;
    return {
      ok: true,
      has: {
        marketCap: typeof q?.marketCap === "number",
        regularMarketPrice: typeof q?.regularMarketPrice === "number",
        sharesOutstanding: typeof q?.sharesOutstanding === "number",
      },
      quoteType: typeof q?.quoteType === "string" ? (q.quoteType as string) : undefined,
      exchange: typeof q?.exchange === "string" ? (q.exchange as string) : undefined,
      fullExchangeName: typeof q?.fullExchangeName === "string" ? (q.fullExchangeName as string) : undefined,
      marketState: typeof q?.marketState === "string" ? (q.marketState as string) : undefined,
      symbol: typeof q?.symbol === "string" ? (q.symbol as string) : undefined,
      currency: typeof q?.currency === "string" ? (q.currency as string) : undefined,
      region: typeof q?.region === "string" ? (q.region as string) : undefined,
      language: typeof q?.language === "string" ? (q.language as string) : undefined,
      market: typeof q?.market === "string" ? (q.market as string) : undefined,
      typeDisp: typeof q?.typeDisp === "string" ? (q.typeDisp as string) : undefined,
      exchangeTimezoneName: typeof q?.exchangeTimezoneName === "string" ? (q.exchangeTimezoneName as string) : undefined,
      fields: Object.keys(q ?? {}).sort(),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : String(e), has: { marketCap: false, regularMarketPrice: false, sharesOutstanding: false } };
  }
}

// STEP1010 §3-1 — 833 원칙: 통째로 "실패"라 적지 않는다. validateResult:false로 스키마 검증 예외를 피해
// 모듈별 결측(undefined)과 호출 자체 실패(네트워크·심볼무효)를 구분한다.
async function fetchSummary(symbol: string): Promise<SummaryResult> {
  try {
    const r = (await yf.quoteSummary(symbol, { modules: [...SUMMARY_MODULES] }, { validateResult: false })) as Record<string, unknown>;
    return {
      ok: true,
      price: moduleBlock(r?.price, ["marketCap", "regularMarketPrice", "longName", "currency"]),
      defaultKeyStatistics: moduleBlock(r?.defaultKeyStatistics, ["sharesOutstanding", "impliedSharesOutstanding"]),
      summaryDetail: moduleBlock(r?.summaryDetail, ["marketCap"]),
      quoteType: moduleBlock(r?.quoteType, []),
    };
  } catch (e) {
    return { ok: false, callError: e instanceof Error ? e.message.slice(0, 300) : String(e) };
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols");
  const symbols = (symbolsParam ? symbolsParam.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_SYMBOLS).slice(0, MAX_SYMBOLS);
  const modeParam = url.searchParams.get("mode");
  const mode: "quote" | "summary" | "both" = modeParam === "quote" || modeParam === "summary" ? modeParam : "both";

  const startedAt = new Date().toISOString();
  const results: SymbolResult[] = [];

  // 🔴 동시성 1 · 호출 간 200ms — 진단이 야후에 부담을 주면 안 된다(both 모드는 심볼당 2회 호출, 매 호출 뒤 대기).
  for (const symbol of symbols) {
    const entry: SymbolResult = { symbol };
    if (mode === "quote" || mode === "both") {
      entry.quote = await fetchQuote(symbol);
      await sleep(GAP_MS);
    }
    if (mode === "summary" || mode === "both") {
      entry.summary = await fetchSummary(symbol);
      await sleep(GAP_MS);
    }
    results.push(entry);
  }

  const finishedAt = new Date().toISOString();
  return NextResponse.json({
    env: {
      vercelRegion: process.env.VERCEL_REGION ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    },
    mode,
    startedAt,
    finishedAt,
    requested: symbols.length,
    results,
  });
}
