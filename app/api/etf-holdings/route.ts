import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// ETF/펀드 구성(holdings) — 상품 정보(거래처 무관). 설계: docs/ETF_LENS_PLAN.md
// KR = 네이버 m.stock etfAnalysis(키 없음·상위10·섹터·추종지수·운용사·보수율). KRX getJsonData=LOGOUT(안티스크래핑).
// US = Yahoo topHoldings+fundProfile. ⚠️ 네이버 Vercel 도달성 배포 실측 필요(막히면 크론).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const _cache = new Map<string, { data: unknown; at: number }>();
const TTL = 6 * 60 * 60 * 1000; // 6h

type Comp = {
  isFund: boolean;
  symbol: string;
  family: string | null;
  category: string | null; // US=카테고리 / KR=추종지수
  expenseRatio: number | null; // 소수(0.0015 = 0.15%)
  holdings: { sym: string; name: string; weight: number }[];
  sectors: { key: string; weight: number }[];
  source: string;
  sourceUrl?: string;
};

function krCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase().replace(/\.(KS|KQ)$/, '');
  return /^\d{6}$/.test(s) ? s : null;
}

async function fromNaver(symbol: string, code: string): Promise<Comp> {
  const r = await fetch(`https://m.stock.naver.com/api/stock/${code}/etfAnalysis`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', Referer: 'https://m.stock.naver.com/' },
    signal: AbortSignal.timeout(8000),
  });
  const j = (await r.json()) as {
    issuerName?: string; etfBaseIndex?: string; totalFee?: number;
    etfTop10MajorConstituentAssets?: { itemCode?: string; itemName?: string; etfWeight?: string }[];
    sectorPortfolioList?: { detailTypeCode?: string; weight?: number }[];
  };
  const holdings = (j.etfTop10MajorConstituentAssets ?? [])
    .map((a) => ({ sym: a.itemCode ?? '', name: a.itemName ?? a.itemCode ?? '', weight: (parseFloat(String(a.etfWeight ?? '0').replace('%', '')) || 0) / 100 }))
    .filter((h) => h.name);
  const sectors = (j.sectorPortfolioList ?? [])
    .map((s) => ({ key: s.detailTypeCode ?? '', weight: (Number(s.weight) || 0) / 100 }))
    .filter((s) => s.weight > 0);
  return {
    isFund: holdings.length > 0,
    symbol,
    family: (j.issuerName ?? '').replace(/\(ETF\)/g, '').trim() || null,
    category: j.etfBaseIndex ?? null,
    expenseRatio: j.totalFee != null ? j.totalFee / 100 : null,
    holdings,
    sectors,
    source: '네이버 금융',
    sourceUrl: `https://finance.naver.com/item/main.naver?code=${code}`,
  };
}

async function fromYahoo(symbol: string): Promise<Comp> {
  const r = await yf.quoteSummary(symbol, { modules: ['topHoldings', 'fundProfile'] });
  const th = r.topHoldings as { holdings?: { symbol?: string; holdingName?: string; holdingPercent?: number }[]; sectorWeightings?: Record<string, number>[] } | undefined;
  const fp = r.fundProfile as { family?: string; categoryName?: string; feesExpensesInvestment?: { annualReportExpenseRatio?: number } } | undefined;
  const holdings = (th?.holdings ?? [])
    .map((h) => ({ sym: h.symbol ?? '', name: h.holdingName ?? h.symbol ?? '', weight: h.holdingPercent ?? 0 }))
    .filter((h) => h.name);
  const sectors = (th?.sectorWeightings ?? [])
    .map((s) => { const k = Object.keys(s)[0]; return { key: k, weight: Number(s[k] ?? 0) }; })
    .filter((s) => s.weight > 0);
  return {
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
}

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') ?? '').trim();
  if (!symbol) return NextResponse.json({ isFund: false, holdings: [], sectors: [] });
  const key = symbol.toUpperCase();
  const c = _cache.get(key);
  if (c && Date.now() - c.at < TTL) return NextResponse.json(c.data);
  try {
    const kc = krCode(symbol);
    const data = kc ? await fromNaver(symbol, kc) : await fromYahoo(symbol);
    _cache.set(key, { data, at: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ isFund: false, symbol, holdings: [], sectors: [], source: '' });
  }
}
