import { createClient } from '@/lib/supabase/server';
import ToolboxClient from '@/components/toolbox/ToolboxClient';

export const metadata = { title: '투자자 도구함 — Stock Terminal' };

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
  const grouped: Record<string, LinkWithFav[]> = {};
  for (const link of links ?? []) {
    if (!grouped[link.category]) grouped[link.category] = [];
    grouped[link.category]!.push({ ...link, isFavorite: favSet.has(link.id) });
  }

  const categories = Object.entries(grouped).map(([slug, items]) => ({
    slug,
    label: CATEGORY_LABELS[slug] ?? slug,
    links: items ?? [],
  }));

  return <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />;
}
