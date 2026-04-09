import { NextRequest, NextResponse } from 'next/server';

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

// 주요 미국 경제지표 시리즈
const SERIES_META: Record<string, { label: string; unit: string }> = {
  GDP: { label: 'GDP (명목)', unit: 'B$' },
  CPIAUCSL: { label: '소비자물가지수 (CPI)', unit: 'Index' },
  FEDFUNDS: { label: '연방기금금리', unit: '%' },
  UNRATE: { label: '실업률', unit: '%' },
  DGS10: { label: '10년 국채금리', unit: '%' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('series_id');
  const mode = searchParams.get('mode'); // 'summary' = 주요 지표 일괄 조회

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey || apiKey === 'your_fred_api_key') {
    return NextResponse.json({ error: 'FRED API key not configured' }, { status: 500 });
  }

  // 일괄 조회 모드: 주요 5개 지표의 최신값 반환
  if (mode === 'summary') {
    try {
      const results = await Promise.all(
        Object.entries(SERIES_META).map(async ([id, meta]) => {
          const params = new URLSearchParams({
            series_id: id,
            api_key: apiKey,
            file_type: 'json',
            sort_order: 'desc',
            limit: '5',
          });

          const res = await fetch(`${FRED_BASE_URL}/series/observations?${params}`, {
            next: { revalidate: 3600 },
          });
          const data = await res.json();

          const observations = (data.observations || []).filter(
            (o: { value: string }) => o.value !== '.'
          );

          const latest = observations[0];
          const previous = observations[1];

          return {
            series_id: id,
            label: meta.label,
            unit: meta.unit,
            value: latest ? parseFloat(latest.value) : null,
            previous_value: previous ? parseFloat(previous.value) : null,
            date: latest?.date || null,
            change: latest && previous
              ? parseFloat(latest.value) - parseFloat(previous.value)
              : null,
          };
        })
      );

      return NextResponse.json({ indicators: results });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch FRED summary' }, { status: 500 });
    }
  }

  // 단일 시리즈 조회
  if (!seriesId) {
    return NextResponse.json({ error: 'series_id is required' }, { status: 400 });
  }

  try {
    const limit = searchParams.get('limit') || '100';
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      sort_order: 'desc',
      limit,
    });

    const res = await fetch(`${FRED_BASE_URL}/series/observations?${params}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    const observations = (data.observations || [])
      .filter((o: { value: string }) => o.value !== '.')
      .map((o: { date: string; value: string }) => ({
        date: o.date,
        value: parseFloat(o.value),
      }));

    const meta = SERIES_META[seriesId];

    return NextResponse.json({
      series_id: seriesId,
      label: meta?.label || seriesId,
      unit: meta?.unit || '',
      observations,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch FRED data' }, { status: 500 });
  }
}
