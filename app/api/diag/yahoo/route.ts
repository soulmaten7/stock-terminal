import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

// STEP1007 W2 — 프로덕션에서만 얻을 수 있는 값을 심는다(1006이 로컬에서 못 확정한 것).
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type SymbolResult = {
  symbol: string;
  ok: boolean;
  error?: string;
  has: { marketCap: boolean; regularMarketPrice: boolean; sharesOutstanding: boolean };
  quoteType?: string;
  exchange?: string;
  fullExchangeName?: string;
  marketState?: string;
  fields?: string[];
};

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols");
  const symbols = (symbolsParam ? symbolsParam.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_SYMBOLS).slice(0, MAX_SYMBOLS);

  const startedAt = new Date().toISOString();
  const results: SymbolResult[] = [];

  // 🔴 동시성 1 · 호출 간 200ms — 진단이 야후에 부담을 주면 안 된다.
  for (const symbol of symbols) {
    try {
      const q = (await yf.quote(symbol)) as Record<string, unknown>;
      results.push({
        symbol,
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
        fields: Object.keys(q ?? {}).sort(),
      });
    } catch (e) {
      results.push({
        symbol,
        ok: false,
        error: e instanceof Error ? e.message.slice(0, 300) : String(e),
        has: { marketCap: false, regularMarketPrice: false, sharesOutstanding: false },
      });
    }
    await sleep(GAP_MS);
  }

  const finishedAt = new Date().toISOString();
  return NextResponse.json({
    env: {
      vercelRegion: process.env.VERCEL_REGION ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    },
    startedAt,
    finishedAt,
    requested: symbols.length,
    results,
  });
}
