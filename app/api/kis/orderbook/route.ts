import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn',
      trId: 'FHKST01010200',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
      },
    });

    const o = data.output1;
    if (!o) {
      return NextResponse.json({ error: 'No data', raw: data });
    }

    const asks = [];
    const bids = [];
    for (let i = 1; i <= 10; i++) {
      asks.push({
        price: parseInt(o[`askp${i}`] || '0', 10),
        volume: parseInt(o[`askp_rsqn${i}`] || '0', 10),
      });
      bids.push({
        price: parseInt(o[`bidp${i}`] || '0', 10),
        volume: parseInt(o[`bidp_rsqn${i}`] || '0', 10),
      });
    }

    return NextResponse.json({
      symbol,
      asks: asks.reverse(),
      bids,
      totalAskVolume: parseInt(o.total_askp_rsqn || '0', 10),
      totalBidVolume: parseInt(o.total_bidp_rsqn || '0', 10),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
