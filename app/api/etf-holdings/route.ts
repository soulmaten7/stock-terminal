import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// ETF/펀드 구성(holdings) — 상품 정보(어디서 사든 무관). US=Yahoo topHoldings(상위10·섹터·보수율·운용사).
// KR ETF는 Yahoo 미보유 → holdings=[] 반환(뷰가 "구성 준비 중" 표시). KR은 KRX 파이프라인(MVP-B).
// 설계: docs/ETF_LENS_PLAN.md
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const _cache = new Map<string, { data: unknown; at: number }>();
const TTL = 6 * 60 * 60 * 1000; // 6h (구성은 자주 안 바뀜)

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') ?? '').trim();
  if (!symbol) return NextResponse.json({ isFund: false, holdings: [], sectors: [] });
  const key = symbol.toUpperCase();
  const c = _cache.get(key);
  if (c && Date.now() - c.at < TTL) return NextResponse.json(c.data);

  try {
    const r = await yf.quoteSummary(symbol, { modules: ['topHoldings', 'fundProfile'] });
    const th = r.topHoldings as
      | { holdings?: { symbol?: string; holdingName?: string; holdingPercent?: number }[]; sectorWeightings?: Record<string, number>[] }
      | undefined;
    const fp = r.fundProfile as
      | { family?: string; categoryName?: string; feesExpensesInvestment?: { annualReportExpenseRatio?: number } }
      | undefined;

    const holdings = (th?.holdings ?? [])
      .map((h) => ({ sym: h.symbol ?? '', name: h.holdingName ?? h.symbol ?? '', weight: h.holdingPercent ?? 0 }))
      .filter((h) => h.name);
    const sectors = (th?.sectorWeightings ?? [])
      .map((s) => { const k = Object.keys(s)[0]; return { key: k, weight: Number(s[k] ?? 0) }; })
      .filter((s) => s.weight > 0);

    const data = {
      isFund: holdings.length > 0,
      symbol,
      family: fp?.family ?? null,
      category: fp?.categoryName ?? null,
      expenseRatio: fp?.feesExpensesInvestment?.annualReportExpenseRatio ?? null,
      holdings,
      sectors,
      source: 'Yahoo Finance',
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/holdings`,
    };
    _cache.set(key, { data, at: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ isFund: false, symbol, holdings: [], sectors: [], source: 'Yahoo Finance' });
  }
}
