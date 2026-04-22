import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 외국인/기관 매매종목 가집계 (한투 tr_id: FHPTJ04400000)
// 한 번의 호출로 상위 종목 리스트를 가져옴 → 관심종목별 개별 호출 대신 사용
// query: ?type=foreign|institution|both (default: both), ?market=kospi|kosdaq|all (default: all)
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'all';

  // FID_COND_MRKT_DIV_CODE: V = 전체, 0001 = 코스피, 1001 = 코스닥
  const marketDiv =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : 'V';

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/foreign-institution-total',
      trId: 'FHPTJ04400000',
      params: {
        FID_COND_MRKT_DIV_CODE: marketDiv,
        FID_COND_SCR_DIV_CODE: '16449',
        FID_INPUT_ISCD: '0000', // 0000 = 전체
        FID_DIV_CLS_CODE: '1', // 0:수량, 1:금액
        FID_RANK_SORT_CLS_CODE: '0', // 0:순매수상위, 1:순매도상위
        FID_ETC_CLS_CODE: '0', // 0:전체
      },
    });

    const items = (data.output || []) as Record<string, string>[];

    // 외국인 순매수 기준 정렬 (frgn_ntby_qty 또는 frgn_ntby_tr_pbmn)
    const mapped = items.map((item) => ({
      symbol: item.mksc_shrn_iscd,
      name: item.hts_kor_isnm,
      price: parseInt(item.stck_prpr || '0', 10),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
      // 순매수 금액 (백만원 단위 → 억원으로 변환)
      foreignBuy: Math.round(parseInt(item.frgn_ntby_tr_pbmn || '0', 10) / 100),
      institutionBuy: Math.round(parseInt(item.orgn_ntby_tr_pbmn || '0', 10) / 100),
    }));

    // 외국인 TOP 10 & 기관 TOP 10 동시 반환
    const foreignTop = [...mapped]
      .sort((a, b) => b.foreignBuy - a.foreignBuy)
      .slice(0, 10);
    const institutionTop = [...mapped]
      .sort((a, b) => b.institutionBuy - a.institutionBuy)
      .slice(0, 10);

    const totals = {
      foreignBuyTotal: mapped.reduce((acc, x) => acc + x.foreignBuy, 0),
      institutionBuyTotal: mapped.reduce((acc, x) => acc + x.institutionBuy, 0),
      individualBuyApprox: -1 * (
        mapped.reduce((acc, x) => acc + x.foreignBuy, 0) +
        mapped.reduce((acc, x) => acc + x.institutionBuy, 0)
      ),
      count: mapped.length,
    };

    return NextResponse.json({ foreignTop, institutionTop, totals });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), foreignTop: [], institutionTop: [] },
      { status: 500 }
    );
  }
}
