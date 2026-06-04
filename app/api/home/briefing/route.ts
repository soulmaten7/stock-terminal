import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// 장전 브리핑 — 간밤 미증시(야후 라이브러리, 심볼별 quote) + 최근 DART 주요 일정

const yf = new YahooFinance();

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
  // 심볼별 quote — 주요 지수 API(/api/yahoo/indices)와 동일한 검증된 방식.
  // 배열+find 매칭 불안정(캐럿 심볼)을 제거. 실패해도 그 칸만 '—'(STEP 145 가드 유지).
  return Promise.all(
    SYMS.map(async (s) => {
      try {
        const q = await yf.quote(s.symbol);
        const price = Number(q?.regularMarketPrice);
        const pct = Number(q?.regularMarketChangePercent);
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
      } catch {
        return { label: s.label, val: '—', change: '—', up: true, hasData: false };
      }
    })
  );
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
