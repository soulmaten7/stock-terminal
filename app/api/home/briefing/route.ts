import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// 장전 브리핑 — 간밤 미증시(야후 라이브러리) + 최근 DART 주요 일정

function formatKSTDate(d: Date) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchUsIndices() {
  const SYMS = [
    { symbol: '^GSPC', label: 'S&P 500' },
    { symbol: '^IXIC', label: 'NASDAQ' },
    { symbol: '^DJI',  label: 'DOW' },
    { symbol: '^VIX',  label: 'VIX' },
  ];
  // 데이터 없을 때 안전 기본행 (가짜 0.00 대신 '—')
  const blank = SYMS.map((s) => ({ label: s.label, val: '—', change: '—', up: true, hasData: false }));
  try {
    const q = await yahooFinance.quote(SYMS.map((s) => s.symbol));
    const arr = (Array.isArray(q) ? q : [q]) as Array<Record<string, unknown>>;
    return SYMS.map((s) => {
      const hit = arr.find((x) => x.symbol === s.symbol);
      const price = Number(hit?.regularMarketPrice);
      const pct = Number(hit?.regularMarketChangePercent);
      // 가격이 양수 유한값 + 등락률이 유한값일 때만 실데이터로 인정
      const hasData = Number.isFinite(price) && price > 0 && Number.isFinite(pct);
      if (!hasData) {
        return { label: s.label, val: '—', change: '—', up: true, hasData: false };
      }
      return {
        label: s.label,
        val: price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(2),
        change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        up: pct >= 0,
        hasData: true,
      };
    });
  } catch {
    return blank;
  }
}

async function fetchDartSchedule() {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey || apiKey === 'your_dart_api_key') return [];
  // 최근 3일 범위 — 당일 공시 0건일 때 빈칸 방지
  const bgnDe = formatKSTDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  try {
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      bgn_de: bgnDe,
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
