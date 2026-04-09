import { NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

export async function GET() {
  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/volume-rank',
      trId: 'FHPST01710000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20101',
        FID_INPUT_ISCD: '0000',
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

    const items = (data.output || []).slice(0, 10).map((item: Record<string, string>) => ({
      symbol: item.mksc_shrn_iscd,
      name: item.hts_kor_isnm,
      price: parseInt(item.stck_prpr || '0', 10),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
      volume: parseInt(item.acml_vol || '0', 10),
      avgVolume: parseInt(item.avrg_vol || '1', 10),
    }));

    const result = items.map((i: { volume: number; avgVolume: number; symbol: string; name: string; price: number; changePercent: number }) => ({
      ...i,
      spike: i.avgVolume > 0 ? parseFloat((i.volume / i.avgVolume).toFixed(1)) : 0,
    }));

    return NextResponse.json({ stocks: result });
  } catch (err) {
    return NextResponse.json({ stocks: [], error: String(err) });
  }
}
