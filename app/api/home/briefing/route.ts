import { NextResponse } from 'next/server';

// 장전 브리핑 — 간밤 미증시 + 오늘 DART 주요 일정
// 미증시: Yahoo Finance v7 API (^GSPC, ^IXIC, ^DJI, VIX)
// 일정: DART 오늘 주요사항 공시 (중요 키워드 포함)

const US_SYMBOLS = [
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: 'NASDAQ' },
  { symbol: '^DJI',  label: 'DOW' },
  { symbol: '^VIX',  label: 'VIX' },
];

const YF_URL =
  'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' +
  US_SYMBOLS.map((s) => encodeURIComponent(s.symbol)).join(',');

function fmt(n: number, digits = 2) {
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: digits });
  return n.toFixed(digits);
}

function formatKSTDate(d: Date) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchUsIndices() {
  try {
    const res = await fetch(YF_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockTerminal/1.0)', Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const results: Record<string, unknown>[] = json?.quoteResponse?.result ?? [];
    const labelMap = Object.fromEntries(US_SYMBOLS.map((s) => [s.symbol, s.label]));
    return US_SYMBOLS.map((s) => {
      const q = results.find((r) => r.symbol === s.symbol);
      const price = (q?.regularMarketPrice as number) ?? 0;
      const pct = (q?.regularMarketChangePercent as number) ?? 0;
      return {
        label: labelMap[s.symbol],
        val: fmt(price),
        change: `${pct >= 0 ? '+' : ''}${fmt(pct, 2)}%`,
        up: pct >= 0,
      };
    });
  } catch {
    return US_SYMBOLS.map((s) => ({ label: s.label, val: '—', change: '—', up: true }));
  }
}

async function fetchDartSchedule() {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey || apiKey === 'your_dart_api_key') return [];
  const today = formatKSTDate(new Date());
  try {
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      bgn_de: today,
      page_no: '1',
      page_count: '30',
    });
    const res = await fetch(`https://opendart.fss.or.kr/api/list.json?${params}`, {
      next: { revalidate: 900 },
    });
    const data = await res.json();
    const KEYWORDS = ['실적', '어닝', '분기보고서', '사업보고서', '유상증자', '합병', '분할', '배당'];
    return (data.list || [])
      .filter((item: Record<string, string>) =>
        KEYWORDS.some((k) => item.report_nm?.includes(k))
      )
      .slice(0, 5)
      .map((item: Record<string, string>) => `${item.corp_name} — ${item.report_nm}`);
  } catch {
    return [];
  }
}

export async function GET() {
  const [overnight, schedule] = await Promise.all([fetchUsIndices(), fetchDartSchedule()]);
  return NextResponse.json(
    { overnight, schedule },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=120' } },
  );
}
