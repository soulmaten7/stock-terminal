import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const CATEGORY_LABELS: Record<string, string> = {
  news:       '뉴스',
  chart:      '차트·분석',
  disclosure: '공시·규제',
  research:   '리서치·리포트',
  macro:      '거시경제',
  community:  '커뮤니티',
  exchange:   '거래소·증권사',
};

export async function GET() {
  const supabase = await createClient();

  const { data: links, error } = await supabase
    .from('link_hub')
    .select('id, country, category, site_name, site_url, description, logo_url, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 로그인 유저 즐겨찾기 조회
  const { data: { user } } = await supabase.auth.getUser();
  let favSet = new Set<number>();
  if (user) {
    const { data: favs } = await supabase
      .from('link_hub_favorites')
      .select('link_id')
      .eq('user_id', user.id);
    favSet = new Set((favs ?? []).map((f: { link_id: number }) => f.link_id));
  }

  // 카테고리별 그룹화
  type LinkWithFav = (typeof links)[number] & { isFavorite: boolean };
  const grouped: Record<string, LinkWithFav[]> = {};
  for (const link of links ?? []) {
    if (!grouped[link.category]) grouped[link.category] = [];
    grouped[link.category]!.push({ ...link, isFavorite: favSet.has(link.id) });
  }

  const categories = Object.entries(grouped).map(([slug, items]) => ({
    slug,
    label: CATEGORY_LABELS[slug] ?? slug,
    links: items,
  }));

  return NextResponse.json({ categories, total: links?.length ?? 0 });
}
