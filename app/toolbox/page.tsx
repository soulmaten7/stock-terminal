import { createClient } from '@/lib/supabase/server';
import ToolboxClient from '@/components/toolbox/ToolboxClient';

export const metadata = { title: '참고 사이트 — Stock Terminal' };

const CATEGORY_LABELS: Record<string, string> = {
  news:       '뉴스',
  chart:      '차트·분석',
  disclosure: '공시·규제',
  research:   '리서치·리포트',
  macro:      '거시경제',
  community:  '커뮤니티',
  exchange:   '거래소·증권사',
};

export default async function ToolboxPage() {
  const supabase = await createClient();

  const [{ data: links }, { data: { user } }] = await Promise.all([
    supabase
      .from('link_hub')
      .select('id, country, category, site_name, site_url, description, logo_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  let favSet = new Set<number>();
  if (user) {
    const { data: favs } = await supabase
      .from('link_hub_favorites')
      .select('link_id')
      .eq('user_id', user.id);
    favSet = new Set((favs ?? []).map((f: { link_id: number }) => f.link_id));
  }

  type LinkWithFav = NonNullable<typeof links>[number] & { isFavorite: boolean };
  const allLinks: LinkWithFav[] = (links ?? []).map((link) => ({
    ...link,
    isFavorite: favSet.has(link.id),
  }));

  const grouped: Record<string, LinkWithFav[]> = {};
  for (const link of allLinks) {
    if (!grouped[link.category]) grouped[link.category] = [];
    grouped[link.category]!.push(link);
  }

  const categories = Object.entries(grouped).map(([slug, items]) => ({
    slug,
    label: CATEGORY_LABELS[slug] ?? slug,
    links: items ?? [],
  }));

  // 국가 필터 선택지 구성 (실제 데이터에 존재하는 나라만)
  const countrySet = new Set<string>();
  for (const l of allLinks) if (l.country) countrySet.add(l.country);
  const availableCountries = [...countrySet].sort();

  return (
    <ToolboxClient
      initialCategories={categories}
      availableCountries={availableCountries}
      isLoggedIn={!!user}
    />
  );
}
