import { NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 투자자별 매매동향 — KOSPI(0001) + KOSDAQ(1001) 각각 호출
// FHKST01010900: inquire-investor (종목별 투자자 순매수)
// 0001/1001 지수 코드로 호출하면 시장 전체 집계값 반환

function parseAmount(val: string | undefined): number {
  return parseInt(val || '0', 10);
}

function fmtBn(val: number): string {
  const sign = val >= 0 ? '+' : '';
  const bn = Math.round(val / 100); // 백만원 → 억원
  return `${sign}${bn.toLocaleString('ko-KR')}억`;
}

async function fetchMarket(marketCode: string) {
  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-investor',
      trId: 'FHKST01010900',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: marketCode,
      },
    });
    const today = (data.output || [])[0] as Record<string, string> | undefined;
    if (!today) return null;
    return {
      foreign: parseAmount(today.frgn_ntby_tr_pbmn),
      institution: parseAmount(today.orgn_ntby_tr_pbmn),
      individual: parseAmount(today.prsn_ntby_tr_pbmn),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const [kospi, kosdaq] = await Promise.all([
    fetchMarket('0001'),
    fetchMarket('1001'),
  ]);

  const LABELS = ['외국인', '기관', '개인', '기타법인'];

  const rows = LABELS.map((label) => {
    let kospiVal = 0;
    let kosdaqVal = 0;

    if (label === '외국인') {
      kospiVal = kospi?.foreign ?? 0;
      kosdaqVal = kosdaq?.foreign ?? 0;
    } else if (label === '기관') {
      kospiVal = kospi?.institution ?? 0;
      kosdaqVal = kosdaq?.institution ?? 0;
    } else if (label === '개인') {
      kospiVal = kospi?.individual ?? 0;
      kosdaqVal = kosdaq?.individual ?? 0;
    }
    // 기타법인: 전체 순매수에서 3자 합을 빼면 기타 (생략 → 0 표시)

    return {
      label,
      kospi: fmtBn(kospiVal),
      kosdaq: fmtBn(kosdaqVal),
    };
  });

  return NextResponse.json(
    { rows },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' } },
  );
}
