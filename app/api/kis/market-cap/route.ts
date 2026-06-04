import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 시가총액 상위 (KIS tr_id: FHPST01740000)
// ?market=all|kospi|kosdaq (default: all) · ?limit (default 30, max 30)
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '100', 10) || 100,
    100
  );
  const iscd = market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : '0000';

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/ranking/market-cap',
      trId: 'FHPST01740000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20174',
        FID_INPUT_ISCD: iscd,
        FID_DIV_CLS_CODE: '0',
        FID_TRGT_CLS_CODE: '0',
        FID_TRGT_EXLS_CLS_CODE: '0',
        FID_INPUT_PRICE_1: '0',
        FID_INPUT_PRICE_2: '0',
        FID_VOL_CNT: '0',
      },
    });

    const items = (data.output || []).slice(0, limit).map((item: Record<string, string>, idx: number) => {
      const price = parseInt(item.stck_prpr || '0', 10);
      const volume = parseInt(item.acml_vol || '0', 10);
      return {
        rank: idx + 1,
        symbol: item.mksc_shrn_iscd || '',
        name: item.hts_kor_isnm || '',
        price,
        changePercent: parseFloat(item.prdy_ctrt || '0'),
        volume,
        tradeAmount: price * volume,
      };
    });

    return NextResponse.json({ stocks: items });
  } catch (err) {
    console.error('[api/kis/market-cap]', err);
    return NextResponse.json({ stocks: [], error: String(err) }, { status: 502 });
  }
}
