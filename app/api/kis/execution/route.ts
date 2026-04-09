import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-ccnl',
      trId: 'FHKST01010300',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
      },
    });

    const items = data.output || [];
    const executions = items.slice(0, 30).map((item: Record<string, string>) => ({
      time: item.stck_cntg_hour,
      price: parseInt(item.stck_prpr || '0', 10),
      change: parseInt(item.prdy_vrss || '0', 10),
      changeSign: item.prdy_vrss_sign,
      volume: parseInt(item.cntg_vol || '0', 10),
      totalVolume: parseInt(item.acml_vol || '0', 10),
    }));

    return NextResponse.json({ symbol, executions });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
