import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 거래량 순위 (KIS tr_id: FHPST01710000)
// ?market=all|kospi|kosdaq (default: all)
// ?sort=spike|volume|amount (default: spike)
//   - spike: 거래증가율(FID_BLNG_CLS_CODE=1)
//   - volume: 평균거래량(0)
//   - amount: 거래금액순(3)
// ?limit (default: 30, max: 30)
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const sort = request.nextUrl.searchParams.get('sort') || 'spike';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '30', 10) || 30,
    30
  );

  const iscd =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : '0000';
  const blng =
    sort === 'volume' ? '0' : sort === 'amount' ? '3' : '1';

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/volume-rank',
      trId: 'FHPST01710000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20171',
        FID_INPUT_ISCD: iscd,
        FID_DIV_CLS_CODE: '0',
        FID_BLNG_CLS_CODE: blng,
        FID_TRGT_CLS_CODE: '111111111',
        FID_TRGT_EXLS_CLS_CODE: '000000',
        FID_INPUT_PRICE_1: '0',
        FID_INPUT_PRICE_2: '0',
        FID_VOL_CNT: '0',
        FID_INPUT_DATE_1: '0',
      },
    });

    const items = (data.output || []).slice(0, limit).map((item: Record<string, string>, idx: number) => {
      const volume = parseInt(item.acml_vol || '0', 10);
      const avgVolume = parseInt(item.avrg_vol || '1', 10);
      const spike = avgVolume > 0 ? parseFloat((volume / avgVolume).toFixed(1)) : 0;
      const price = parseInt(item.stck_prpr || '0', 10);
      const tradeAmount = price * volume;

      return {
        rank: idx + 1,
        symbol: item.mksc_shrn_iscd || '',
        name: item.hts_kor_isnm || '',
        price,
        changePercent: parseFloat(item.prdy_ctrt || '0'),
        volume,
        avgVolume,
        spike,
        tradeAmount,
      };
    });

    return NextResponse.json({ stocks: items });
  } catch (err) {
    console.error('[api/kis/volume-rank]', err);
    return NextResponse.json({ stocks: [], error: String(err) }, { status: 502 });
  }
}
