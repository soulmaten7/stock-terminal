import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { momentumLens, technicalLens, valuationLens } from "@/lib/lenses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// 온디맨드 결정론 렌즈 — 심볼당 요청 시 계산. 30분 인메모리 캐시(같은 종목 재조회 절감).
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: Request) {
  const symbol = (new URL(req.url).searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return NextResponse.json(hit.data);

  try {
    // 최근 ~400일 일봉 → 모멘텀·기술 계산용 종가 배열
    const ch = await yf.chart(symbol, {
      period1: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      interval: "1d",
    });
    const closes = (ch.quotes ?? [])
      .map((q) => q.close)
      .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);

    // 현재가·PER·PBR·이름 (밸류에이션 렌즈용)
    let pe: number | null = null, pb: number | null = null, name = symbol, price: number | null = null;
    try {
      const q = await yf.quote(symbol);
      pe = (q as { trailingPE?: number }).trailingPE ?? null;
      pb = (q as { priceToBook?: number }).priceToBook ?? null;
      name = (q as { shortName?: string }).shortName || (q as { longName?: string }).longName || name;
      price = (q as { regularMarketPrice?: number }).regularMarketPrice ?? null;
    } catch {
      /* quote 실패해도 가격기반 렌즈는 계산 */
    }

    if (closes.length < 30) {
      return NextResponse.json({ symbol, name, price, lenses: [], error: "insufficient_data" });
    }

    const lenses = [momentumLens(closes), technicalLens(closes), valuationLens(pe, pb)];
    const data = { symbol, name, price, lenses };
    cache.set(symbol, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, error: String(e) }, { status: 200 });
  }
}
