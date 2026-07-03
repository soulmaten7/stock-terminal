import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { momentumLens, technicalLens, valuationLens, lowVolLens, qualityLens } from "@/lib/lenses";
import { pickLocale } from "@/lib/lensCopy";
import { computeFScore, type FRow } from "@/lib/fscore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// 온디맨드 결정론 렌즈 — 심볼당 요청 시 계산. 30분 인메모리 캐시(같은 종목 재조회 절감).
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });
  const locale = pickLocale(url.searchParams.get("lang")); // 기본 ko · ?lang=en
  const cacheKey = `${symbol}:${locale}`;

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return NextResponse.json(hit.data);

  try {
    const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    // KR 보드는 6자리 코드(예: 005930) → 야후 심볼로 해석(.KS 우선, 실패 시 .KQ). 그 외(NVDA·7203.T·0700.HK)는 그대로.
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

    // 현재가·PER·PBR·이름 (밸류에이션 렌즈용) — 해석된 심볼로 조회
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

    if (closes.length < 30) {
      return NextResponse.json({ symbol, resolved, name, price, lenses: [], error: "insufficient_data" });
    }

    const lenses = [momentumLens(closes, locale), lowVolLens(closes, locale), technicalLens(closes, locale), valuationLens(pe, pb, locale)];

    // F-Score (연간 재무 — fundamentalsTimeSeries). 실패/미지원 시 null/supported:false로 안전 처리.
    let fscore: unknown = null;
    try {
      const fts = await yf.fundamentalsTimeSeries(resolved, {
        period1: new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        type: "annual",
        module: "all",
      });
      const raw = (Array.isArray(fts) ? fts : []) as Array<Record<string, unknown>>;
      const rows: FRow[] = raw
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
        }))
        .sort((a, b) => {
          const da = a.date instanceof Date ? a.date.getTime() : new Date(String(a.date)).getTime();
          const db = b.date instanceof Date ? b.date.getTime() : new Date(String(b.date)).getTime();
          return da - db;
        });
      fscore = computeFScore(rows);
      // 퀄리티(GP/A) — 최신 연도 매출총이익/총자산. 매출총이익 없으면(은행) null → 카드 "—".
      const lr = rows[rows.length - 1];
      const gp = lr?.grossProfit ?? (lr?.totalRevenue != null && lr?.costOfRevenue != null ? lr.totalRevenue - lr.costOfRevenue : null);
      lenses.push(qualityLens(gp, lr?.totalAssets ?? null, locale));
    } catch {
      fscore = null;
    }

    const data = { symbol, resolved, name, price, lenses, fscore };
    cache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, error: String(e) }, { status: 200 });
  }
}
