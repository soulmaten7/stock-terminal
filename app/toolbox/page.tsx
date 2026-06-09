import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import BrokerRanking from "@/components/toolbox/BrokerRanking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "주식 관련 링크모음 — 운종" };

const CATEGORY_LABELS: Record<string, string> = {
  news: "뉴스",
  chart: "차트·분석",
  analysis: "재무·분석",
  disclosure: "공시·규제",
  research: "리서치·리포트",
  etf: "ETF·펀드",
  ipo: "공모주·배당",
  macro: "거시경제",
  community: "커뮤니티",
  exchange: "거래소",
};
const CATEGORY_ORDER = ["news", "chart", "analysis", "disclosure", "research", "etf", "ipo", "macro", "community", "exchange"];

type LinkRow = {
  id: number;
  country: string | null;
  category: string;
  site_name: string;
  site_url: string;
  description: string | null;
  logo_url: string | null;
  display_order: number | null;
};

export default async function ToolboxPage() {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("link_hub")
    .select("id, country, category, site_name, site_url, description, logo_url, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favSet = new Set<number>();
  if (user) {
    const { data: favs } = await supabase
      .from("link_hub_favorites")
      .select("link_id")
      .eq("user_id", user.id);
    favSet = new Set((favs ?? []).map((f: { link_id: number }) => f.link_id));
  }

  const rows = (links ?? []) as LinkRow[];
  const grouped: Record<string, (LinkRow & { isFavorite: boolean })[]> = {};
  for (const link of rows) {
    (grouped[link.category] ??= []).push({ ...link, isFavorite: favSet.has(link.id) });
  }

  const categories = Object.keys(grouped)
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map((slug) => ({ slug, label: CATEGORY_LABELS[slug] ?? slug, links: grouped[slug]! }));

  const availableCountries = [...new Set(rows.map((l) => l.country).filter(Boolean))] as string[];

  return (
    <div className="px-6 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-unjong-primary">주식 관련 링크모음</h1>
        <p className="mt-1 text-sm text-unjong-muted">증권사·뉴스·분석·공시까지 한곳에서 · 운종은 동선만 안내(허브)</p>
      </div>
      <BrokerRanking />
      <ToolboxClient
        initialCategories={categories}
        availableCountries={availableCountries}
        isLoggedIn={!!user}
      />
    </div>
  );
}
