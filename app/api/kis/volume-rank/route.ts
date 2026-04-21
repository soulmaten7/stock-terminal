import { NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 거래량 순위 (KIS tr_id: FHPST01710000)
// 공식 엔드포인트: /uapi/domestic-stock/v1/quotations/volume-rank
// FID_BLNG_CLS_CODE: 0=평균거래량, 1=거래증가율(급등), 2=평균거래회전율, 3=거래금액순, 4=평균거래금액회전율
export async function GET() {
  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/volume-rank',
      trId: 'FHPST01710000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20171',   // ✓ 수정: 20101 → 20171
        FID_INPUT_ISCD: '0000',            // 0000=전체
        FID_DIV_CLS_CODE: '0',             // 0=전체, 1=보통주, 2=우선주
        FID_BLNG_CLS_CODE: '1',            // ✓ 수정: 0 → 1 (거래증가율 기준 = "급등")
        FID_TRGT_CLS_CODE: '111111111',    // 9자리 플래그 (전부 포함)
        FID_TRGT_EXLS_CLS_CODE: '000000',  // 6자리 플래그 (제외 없음)
        FID_INPUT_PRICE_1: '0',
        FID_INPUT_PRICE_2: '0',
        FID_VOL_CNT: '0',
        FID_INPUT_DATE_1: '0',             // ✓ 수정: '' → '0' (빈 문자열이면 KIS 에러)
      },
    });

    const items = (data.output || []).slice(0, 10).map((item: Record<string, string>) => {
      const volume = parseInt(item.acml_vol || '0', 10);
      const avgVolume = parseInt(item.avrg_vol || '1', 10);
      // 장중: volume/avgVolume = 실제 거래량 배수
      // 장마감: avgVolume == volume 이라 1.0x 표시 (허위값 대신 투명하게)
      // vol_inrt (KIS 거래량증가율) 는 basis points 단위 추정되어 사용 보류
      const spike = avgVolume > 0 ? parseFloat((volume / avgVolume).toFixed(1)) : 0;

      return {
        symbol: item.mksc_shrn_iscd || '',
        name: item.hts_kor_isnm || '',
        price: parseInt(item.stck_prpr || '0', 10),
        changePercent: parseFloat(item.prdy_ctrt || '0'),
        volume,
        avgVolume,
        spike,
      };
    });

    return NextResponse.json({ stocks: items });
  } catch (err) {
    console.error('[api/kis/volume-rank]', err);
    return NextResponse.json({ stocks: [], error: String(err) }, { status: 502 });
  }
}
