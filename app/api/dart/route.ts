import { NextRequest, NextResponse } from 'next/server';

const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

const IMPORTANT_KEYWORDS = ['유상증자', '무상증자', '합병', '분할', '실적', '매출', '영업이익', '배당', '자사주', '최대주주변경', '상장폐지', '감사보고서'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  const apiKey = process.env.DART_API_KEY;
  if (!apiKey || apiKey === 'your_dart_api_key') {
    return NextResponse.json({ error: 'DART API key not configured' }, { status: 500 });
  }

  if (!endpoint || endpoint === 'list') {
    const today = new Date();
    const bgnDe = searchParams.get('bgn_de') || formatKSTDate(today);
    const pageCount = searchParams.get('page_count') || '10';
    const corpCls = searchParams.get('corp_cls');

    const params = new URLSearchParams({
      crtfc_key: apiKey,
      bgn_de: bgnDe,
      page_no: '1',
      page_count: pageCount,
    });

    if (corpCls) params.set('corp_cls', corpCls);

    try {
      const res = await fetch(`${DART_BASE_URL}/list.json?${params}`, {
        next: { revalidate: 300 },
      });
      const data = await res.json();

      if (data.status === '000' && data.list) {
        const disclosures = data.list.map((item: Record<string, string>) => {
          const reportNm = item.report_nm || '';
          const isImportant = IMPORTANT_KEYWORDS.some((kw) => reportNm.includes(kw));
          return {
            corp_name: item.corp_name,
            corp_code: item.corp_code,
            stock_code: item.stock_code,
            report_nm: reportNm,
            rcept_no: item.rcept_no,
            rcept_dt: item.rcept_dt,
            flr_nm: item.flr_nm,
            url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
            is_important: isImportant,
          };
        });
        return NextResponse.json({ disclosures, total: data.total_count });
      }

      if (data.status === '013') {
        return NextResponse.json({ disclosures: [], total: 0 });
      }

      return NextResponse.json({ disclosures: [], total: 0, raw_status: data.status, message: data.message });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch from DART API' }, { status: 500 });
    }
  }

  const params = new URLSearchParams({ crtfc_key: apiKey });
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') params.set(key, value);
  });

  try {
    const res = await fetch(`${DART_BASE_URL}/${endpoint}.json?${params}`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from DART API' }, { status: 500 });
  }
}

function formatKSTDate(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
