import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// ETF/ETN 상품 정보. 설계: docs/ETF_LENS_PLAN.md
// KR = 네이버 m.stock. ETF=etfAnalysis(구성). ETN=바스켓 없음(전략노트)→integration으로 판별해 '상품 정보'만.
// US = Yahoo topHoldings. ⚠️ 네이버 Vercel 도달성 확인됨.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const _cache = new Map<string, { data: unknown; at: number }>();
const TTL = 6 * 60 * 60 * 1000; // 6h
const NAVER_H = { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', Referer: 'https://m.stock.naver.com/' };

type Comp = {
  isFund: boolean;
  fundType: 'etf' | 'etn' | 'stock';
  symbol: string;
  family: string | null;
  category: string | null; // US=카테고리 / KR=추종지수
  expenseRatio: number | null;
  holdings: { sym: string; name: string; weight: number }[];
  sectors: { key: string; weight: number }[];
  source: string;
  sourceUrl?: string;
};

function krCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase().replace(/\.(KS|KQ)$/, '');
  // KRX 단축코드 = 6자리, 첫 글자 숫자 + 영숫자(069500·0193T0). 미국 티커는 문자 시작 → 제외.
  return /^\d[0-9A-Z]{5}$/.test(s) ? s : null;
}

async function naverStockEndType(code: string): Promise<string> {
  try {
    const r = await fetch(`https://m.stock.naver.com/api/stock/${code}/integration`, { headers: NAVER_H, signal: AbortSignal.timeout(6000) });
    const j = (await r.json()) as { stockEndType?: string };
    return String(j?.stockEndType ?? '').toLowerCase();
  } catch { return ''; }
}

async function fromNaver(symbol: string, code: string): Promise<Comp> {
  const base: Comp = { isFund: false, fundType: 'stock', symbol, family: null, category: null, expenseRatio: null, holdings: [], sectors: [], source: '네이버 금융', sourceUrl: `https://finance.naver.com/item/main.naver?code=${code}` };
  // 1) ETF는 etfAnalysis에 구성이 있음(단일종목ETF 포함). 먼저 시도.
  //    ⚠️ ETN·일반종목은 이 엔드포인트가 404+빈바디 → r.json() 예외. 자체 try/catch로 감싸 "구성 없음"으로 넘겨 2단계(ETN 판별)로.
  let j: {
    issuerName?: string; etfBaseIndex?: string; totalFee?: number;
    etfTop10MajorConstituentAssets?: { itemCode?: string; itemName?: string; etfWeight?: string }[];
    sectorPortfolioList?: { detailTypeCode?: string; weight?: number }[];
  } = {};
  try {
    const r = await fetch(`https://m.stock.naver.com/api/stock/${code}/etfAnalysis`, { headers: NAVER_H, signal: AbortSignal.timeout(8000) });
    if (r.ok) j = await r.json();
  } catch { /* 404·빈바디·파싱실패 → 구성 없음 취급 */ }
  const holdings = (j.etfTop10MajorConstituentAssets ?? [])
    .map((a) => ({ sym: a.itemCode ?? '', name: a.itemName ?? a.itemCode ?? '', weight: (parseFloat(String(a.etfWeight ?? '0').replace('%', '')) || 0) / 100 }))
    .filter((h) => h.name);
  if (holdings.length > 0) {
    const sectors = (j.sectorPortfolioList ?? []).map((s) => ({ key: s.detailTypeCode ?? '', weight: (Number(s.weight) || 0) / 100 })).filter((s) => s.weight > 0);
    return { ...base, isFund: true, fundType: 'etf', family: (j.issuerName ?? '').replace(/\(ETF\)/g, '').trim() || null, category: j.etfBaseIndex ?? null, expenseRatio: j.totalFee != null ? j.totalFee / 100 : null, holdings, sectors };
  }
  // 2) 구성 비면 ETN(전략노트·바스켓 없음)인지 판별 → '상품 정보'로.
  const set = await naverStockEndType(code);
  if (set === 'etn') return { ...base, isFund: true, fundType: 'etn' };
  return { ...base, isFund: false, fundType: set === 'etf' ? 'etf' : 'stock' };
}

async function fromYahoo(symbol: string): Promise<Comp> {
  const r = await yf.quoteSummary(symbol, { modules: ['topHoldings', 'fundProfile'] });
  const th = r.topHoldings as { holdings?: { symbol?: string; holdingName?: string; holdingPercent?: number }[]; sectorWeightings?: Record<string, number>[] } | undefined;
  const fp = r.fundProfile as { family?: string; categoryName?: string; feesExpensesInvestment?: { annualReportExpenseRatio?: number } } | undefined;
  const holdings = (th?.holdings ?? []).map((h) => ({ sym: h.symbol ?? '', name: h.holdingName ?? h.symbol ?? '', weight: h.holdingPercent ?? 0 })).filter((h) => h.name);
  const sectors = (th?.sectorWeightings ?? []).map((s) => { const k = Object.keys(s)[0]; return { key: k, weight: Number(s[k] ?? 0) }; }).filter((s) => s.weight > 0);
  return {
    isFund: holdings.length > 0,
    fundType: 'etf',
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
  if (!symbol) return NextResponse.json({ isFund: false, fundType: 'stock', holdings: [], sectors: [] });
  const key = symbol.toUpperCase();
  const c = _cache.get(key);
  if (c && Date.now() - c.at < TTL) return NextResponse.json(c.data);
  try {
    const kc = krCode(symbol);
    const data = kc ? await fromNaver(symbol, kc) : await fromYahoo(symbol);
    _cache.set(key, { data, at: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ isFund: false, fundType: 'stock', symbol, holdings: [], sectors: [], source: '' });
  }
}
