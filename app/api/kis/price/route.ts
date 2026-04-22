import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
      trId: 'FHKST01010100',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
      },
    });

    const o = data.output;
    if (!o) {
      return NextResponse.json({ error: 'No data', raw: data });
    }

    return NextResponse.json({
      symbol,
      name: o.hts_kor_isnm,
      price: parseInt(o.stck_prpr, 10),
      change: parseInt(o.prdy_vrss, 10),
      changePercent: parseFloat(o.prdy_ctrt),
      changeSign: o.prdy_vrss_sign,
      open: parseInt(o.stck_oprc, 10),
      high: parseInt(o.stck_hgpr, 10),
      low: parseInt(o.stck_lwpr, 10),
      volume: parseInt(o.acml_vol, 10),
      tradeAmount: parseInt(o.acml_tr_pbmn, 10),
      high52w: parseInt(o.stck_dryc_hgpr || '0', 10),
      low52w: parseInt(o.stck_dryc_lwpr || '0', 10),
      per: parseFloat(o.per || '0'),
      pbr: parseFloat(o.pbr || '0'),
      marketCap: parseInt(o.hts_avls || '0', 10),
      dividendYield: parseFloat(o.divi_yield_ratio || o.stck_dryy_divi_rate || '0') || null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
