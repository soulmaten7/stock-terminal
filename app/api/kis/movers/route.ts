import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 등락률 순위 (KIS tr_id: FHPST01700000)
// 공식 엔드포인트: /uapi/domestic-stock/v1/ranking/fluctuation
// ?dir=up (상승순, default) | down (하락순)
export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get('dir') === 'down' ? '1' : '0';
  // fid_rank_sort_cls_code: 0=상승률순, 1=하락률순, 2=시가대비상승률, 3=시가대비하락률, 4=변동률순

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/ranking/fluctuation',
      trId: 'FHPST01700000',
      params: {
        FID_RSFL_RATE2: '',           // 등락률 상한 (공백=제한없음)
        FID_COND_MRKT_DIV_CODE: 'J',  // J=주식, ETF, ETN
        FID_COND_SCR_DIV_CODE: '20170',
        FID_INPUT_ISCD: '0000',        // 0000=전체, 0001=코스피, 1001=코스닥
        FID_RANK_SORT_CLS_CODE: dir,
        FID_INPUT_CNT_1: '0',          // 누적일수 (0=당일)
        FID_PRC_CLS_CODE: '0',         // 가격 구분 (0=전체)
        FID_INPUT_PRICE_1: '',         // 가격 하한 (공백=제한없음)
        FID_INPUT_PRICE_2: '',         // 가격 상한
        FID_VOL_CNT: '',               // 거래량 하한
        FID_TRGT_CLS_CODE: '0',        // 대상구분 (0=전체)
        FID_TRGT_EXLS_CLS_CODE: '0',   // 대상제외 (0=없음)
        FID_DIV_CLS_CODE: '0',         // 분류 (0=전체)
        FID_RSFL_RATE1: '',            // 등락률 하한
      },
    });

    const items = (data.output || []).slice(0, 10).map((item: Record<string, string>, idx: number) => ({
      rank: idx + 1,
      // 등락률 순위는 stck_shrn_iscd 가 표준이지만 mksc_shrn_iscd 도 fallback
      symbol: item.stck_shrn_iscd || item.mksc_shrn_iscd || '',
      name: item.hts_kor_isnm || '',
      price: parseInt(item.stck_prpr || '0', 10).toLocaleString('ko-KR'),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[api/kis/movers]', err);
    return NextResponse.json({ items: [], error: String(err) }, { status: 502 });
  }
}
