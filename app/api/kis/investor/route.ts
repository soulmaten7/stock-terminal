import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-investor',
      trId: 'FHKST01010900',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
      },
    });

    const items = data.output || [];
    const investors = items.slice(0, 10).map((item: Record<string, string>) => ({
      date: item.stck_bsop_date,
      foreignBuy: parseInt(item.frgn_ntby_qty || '0', 10),
      institutionBuy: parseInt(item.orgn_ntby_qty || '0', 10),
      individualBuy: parseInt(item.prsn_ntby_qty || '0', 10),
      foreignAmount: parseInt(item.frgn_ntby_tr_pbmn || '0', 10),
      institutionAmount: parseInt(item.orgn_ntby_tr_pbmn || '0', 10),
    }));

    return NextResponse.json({ symbol, investors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
