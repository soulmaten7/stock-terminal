import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

/**
 * KIS 일봉 차트 API
 * TR_ID: FHKST03010100 (최대 100일)
 *
 * Query params
 *   symbol: 6자리 종목코드 (예: 005930)
 *   period: D(일)|W(주)|M(월) — 기본 D
 *   from:   YYYYMMDD (옵션, 기본 150일 전)
 *   to:     YYYYMMDD (옵션, 기본 오늘)
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const symbol = sp.get('symbol');
  if (!symbol || !/^\d{6}$/.test(symbol)) {
    return NextResponse.json({ error: 'symbol (6자리 숫자) 필수' }, { status: 400 });
  }

  const period = (sp.get('period') || 'D').toUpperCase();
  if (!['D', 'W', 'M'].includes(period)) {
    return NextResponse.json({ error: 'period: D|W|M 만 허용' }, { status: 400 });
  }

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const toDefault = now.toISOString().slice(0, 10).replace(/-/g, '');
  const fromDefault = (() => {
    const d = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  })();
  const from = sp.get('from') || fromDefault;
  const to = sp.get('to') || toDefault;

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
      trId: 'FHKST03010100',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
        FID_INPUT_DATE_1: from,
        FID_INPUT_DATE_2: to,
        FID_PERIOD_DIV_CODE: period,
        FID_ORG_ADJ_PRC: '0',
      },
    });

    const o1 = data.output1 || {};
    const rows = Array.isArray(data.output2) ? data.output2 : [];

    const candles = rows
      .filter((r: Record<string, string>) => r.stck_bsop_date && r.stck_clpr)
      .map((r: Record<string, string>) => ({
        time: `${r.stck_bsop_date.slice(0, 4)}-${r.stck_bsop_date.slice(4, 6)}-${r.stck_bsop_date.slice(6, 8)}`,
        open: parseInt(r.stck_oprc, 10),
        high: parseInt(r.stck_hgpr, 10),
        low: parseInt(r.stck_lwpr, 10),
        close: parseInt(r.stck_clpr, 10),
        volume: parseInt(r.acml_vol || '0', 10),
      }))
      .reverse();

    return NextResponse.json({
      symbol,
      name: o1.hts_kor_isnm || '',
      period,
      candles,
      count: candles.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
