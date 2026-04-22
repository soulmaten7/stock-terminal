import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 외국인/기관 매매종목 가집계 (한투 tr_id: FHPTJ04400000)
// ?market=all|kospi|kosdaq (default: all)
// ?sort=buy|sell (default: buy) — 순매수상위 vs 순매도상위
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const sort = request.nextUrl.searchParams.get('sort') === 'sell' ? 'sell' : 'buy';

  const marketDiv =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : 'V';
  const rankSort = sort === 'sell' ? '1' : '0'; // 0:순매수상위, 1:순매도상위

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/foreign-institution-total',
      trId: 'FHPTJ04400000',
      params: {
        FID_COND_MRKT_DIV_CODE: marketDiv,
        FID_COND_SCR_DIV_CODE: '16449',
        FID_INPUT_ISCD: '0000',
        FID_DIV_CLS_CODE: '1', // 0:수량, 1:금액
        FID_RANK_SORT_CLS_CODE: rankSort,
        FID_ETC_CLS_CODE: '0',
      },
    });

    const items = (data.output || []) as Record<string, string>[];

    const mapped = items.map((item) => ({
      symbol: item.mksc_shrn_iscd,
      name: item.hts_kor_isnm,
      price: parseInt(item.stck_prpr || '0', 10),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
      // 순매수 금액 (백만원 → 억원)
      foreignBuy: Math.round(parseInt(item.frgn_ntby_tr_pbmn || '0', 10) / 100),
      institutionBuy: Math.round(parseInt(item.orgn_ntby_tr_pbmn || '0', 10) / 100),
    }));

    // 정렬: sell 이면 가장 큰 매도(음수), buy 면 가장 큰 매수(양수)
    const sortFn = sort === 'sell'
      ? (a: typeof mapped[0], b: typeof mapped[0]) => a.foreignBuy + a.institutionBuy - (b.foreignBuy + b.institutionBuy)
      : (a: typeof mapped[0], b: typeof mapped[0]) => b.foreignBuy + b.institutionBuy - (a.foreignBuy + a.institutionBuy);

    const foreignTop = [...mapped]
      .sort((a, b) => (sort === 'sell' ? a.foreignBuy - b.foreignBuy : b.foreignBuy - a.foreignBuy))
      .slice(0, 20);
    const institutionTop = [...mapped]
      .sort((a, b) => (sort === 'sell' ? a.institutionBuy - b.institutionBuy : b.institutionBuy - a.institutionBuy))
      .slice(0, 20);
    const combined = [...mapped].sort(sortFn).slice(0, 20);

    const totals = {
      foreignBuyTotal: mapped.reduce((acc, x) => acc + x.foreignBuy, 0),
      institutionBuyTotal: mapped.reduce((acc, x) => acc + x.institutionBuy, 0),
      count: mapped.length,
    };

    return NextResponse.json({ foreignTop, institutionTop, combined, totals });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), foreignTop: [], institutionTop: [], combined: [] },
      { status: 500 }
    );
  }
}
