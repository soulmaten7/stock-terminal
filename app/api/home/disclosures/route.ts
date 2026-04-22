import { NextRequest, NextResponse } from 'next/server';
import { fetchDart } from '@/lib/dart';

export const runtime = 'nodejs';

interface DartItem {
  corp_name: string;
  report_nm: string;
  rcept_dt: string;
  rcept_no: string;
  corp_cls: string;
}

interface NormalizedItem {
  corp_name: string;
  report_name: string;
  published_at: string;
  source_url: string;
}

let _cache: { data: NormalizedItem[]; at: number } | null = null;
const TTL = 5 * 60 * 1000;

async function fetchRecentDart(limit: number): Promise<NormalizedItem[]> {
  if (_cache && Date.now() - _cache.at < TTL) return _cache.data.slice(0, limit);

  const today = new Date();
  const bgn = new Date(today.getTime() - 7 * 86400000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

  const res = await fetchDart<{ list?: DartItem[] }>('/list.json', {
    bgn_de: fmt(bgn),
    end_de: fmt(today),
    pblntf_ty: 'A',
    page_count: '40',
    sort: 'date',
    sort_mth: 'desc',
  });

  const items: NormalizedItem[] = (res.list ?? []).map((d) => ({
    corp_name: d.corp_name,
    report_name: d.report_nm,
    published_at: `${d.rcept_dt.slice(0, 4)}-${d.rcept_dt.slice(4, 6)}-${d.rcept_dt.slice(6, 8)}`,
    source_url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${d.rcept_no}`,
  }));

  _cache = { data: items, at: Date.now() };
  return items.slice(0, limit);
}

export async function GET(req: NextRequest) {
  const limit = Math.min(40, Number(req.nextUrl.searchParams.get('limit') ?? 20));
  try {
    const data = await fetchRecentDart(limit);
    return NextResponse.json({ disclosures: data });
  } catch {
    return NextResponse.json({ disclosures: [], error: 'DART unavailable' });
  }
}
