import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 등락률 순위 조회 — KIS tr_id: FHPST01700000
// ?dir=up (상승, default) | down (하락)
export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get('dir') === 'down' ? '1' : '0';
  // FID_RANK_SORT_CLS_CODE: 0=상승순, 1=하락순

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/volume-rank',
      trId: 'FHPST01700000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20170',
        FID_INPUT_ISCD: '0000',
        FID_RANK_SORT_CLS_CODE: dir,
        FID_DIV_CLS_CODE: '0',
        FID_BLNG_CLS_CODE: '0',
        FID_TRGT_CLS_CODE: '111111111',
        FID_TRGT_EXLS_CLS_CODE: '000000',
        FID_INPUT_PRICE_1: '0',
        FID_INPUT_PRICE_2: '0',
        FID_VOL_CNT: '0',
        FID_INPUT_DATE_1: '',
      },
    });

    const items = (data.output || []).slice(0, 10).map((item: Record<string, string>, idx: number) => ({
      rank: idx + 1,
      symbol: item.mksc_shrn_iscd,
      name: item.hts_kor_isnm,
      price: parseInt(item.stck_prpr || '0', 10).toLocaleString('ko-KR'),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ items: [], error: String(err) });
  }
}
