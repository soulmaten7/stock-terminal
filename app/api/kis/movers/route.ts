import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 등락률 순위 (KIS tr_id: FHPST01700000)
// ?dir=up|down (default: up)
// ?market=all|kospi|kosdaq (default: all)
// ?limit=10|30 (default: 10)
export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get('dir') === 'down' ? '1' : '0';
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '10', 10) || 10,
    30
  );

  // 0000=전체, 0001=코스피, 1001=코스닥
  const iscd =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : '0000';

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/ranking/fluctuation',
      trId: 'FHPST01700000',
      params: {
        FID_RSFL_RATE2: '',
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20170',
        FID_INPUT_ISCD: iscd,
        FID_RANK_SORT_CLS_CODE: dir,
        FID_INPUT_CNT_1: '0',
        FID_PRC_CLS_CODE: '0',
        FID_INPUT_PRICE_1: '',
        FID_INPUT_PRICE_2: '',
        FID_VOL_CNT: '',
        FID_TRGT_CLS_CODE: '0',
        FID_TRGT_EXLS_CLS_CODE: '0',
        FID_DIV_CLS_CODE: '0',
        FID_RSFL_RATE1: '',
      },
    });

    const items = (data.output || []).slice(0, limit).map((item: Record<string, string>, idx: number) => ({
      rank: idx + 1,
      symbol: item.stck_shrn_iscd || item.mksc_shrn_iscd || '',
      name: item.hts_kor_isnm || '',
      price: parseInt(item.stck_prpr || '0', 10),
      priceText: parseInt(item.stck_prpr || '0', 10).toLocaleString('ko-KR'),
      prdyVrss: parseInt(item.prdy_vrss || '0', 10),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
      volume: parseInt(item.acml_vol || '0', 10),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[api/kis/movers]', err);
    return NextResponse.json({ items: [], error: String(err) }, { status: 502 });
  }
}
