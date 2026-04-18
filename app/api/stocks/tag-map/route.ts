import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const revalidate = 3600; // 1시간 캐시

/**
 * 채팅 메시지 렌더링 시 $한글종목명 / $영문명 → symbol 해석용 맵.
 * 응답: { tagMap: { "삼성전자": "005930", "Samsung Electronics": "005930", ... } }
 * 클라이언트는 마운트 시 1회 fetch 후 Zustand 에 캐시.
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stocks')
    .select('symbol, name_ko, name_en')
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tagMap: Record<string, string> = {};
  for (const row of (data ?? []) as { symbol: string; name_ko: string | null; name_en: string | null }[]) {
    if (row.name_ko) tagMap[row.name_ko] = row.symbol;
    if (row.name_en) tagMap[row.name_en] = row.symbol;
  }

  return NextResponse.json(
    { tagMap },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' } }
  );
}
