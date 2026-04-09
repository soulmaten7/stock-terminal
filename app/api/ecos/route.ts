import { NextRequest, NextResponse } from 'next/server';

const ECOS_BASE_URL = 'https://ecos.bok.or.kr/api/StatisticSearch';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statCode = searchParams.get('stat_code');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  const apiKey = process.env.ECOS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ECOS API key not configured' }, { status: 500 });
  }

  if (!statCode) {
    return NextResponse.json({ error: 'stat_code is required' }, { status: 400 });
  }

  try {
    const url = `${ECOS_BASE_URL}/${apiKey}/json/kr/1/100/${statCode}/M/${startDate || '202301'}/${endDate || '202512'}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ECOS data' }, { status: 500 });
  }
}
