import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import HomeIndexStrip from "@/components/layout/HomeIndexStrip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  news: "뉴스",
  chart: "차트·시세",
  analysis: "기업·재무",
  disclosure: "공시·신용",
  research: "리포트",
  etf: "ETF·펀드",
  ipo: "공모주·배당",
  macro: "거시경제",
  community: "커뮤니티",
  exchange: "거래소·기관",
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

// 홈 구조화 데이터 — 구글이 '이 사이트=Trillion(트릴리언) 금융 정보 허브'라고 이해하도록.
// Organization(발행처) + WebSite(사이트). 종목 검색 결과 페이지가 없어 SearchAction은 넣지 않음(가짜 마크업 금지).
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app";
const HOME_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_BASE}/#organization`,
      name: "Trillion",
      alternateName: ["트릴리언", "원트릴리언"],
      url: SITE_BASE,
      logo: `${SITE_BASE}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_BASE}/#website`,
      name: "Trillion",
      alternateName: "트릴리언",
      url: SITE_BASE,
      inLanguage: "ko-KR",
      description: "전문가들이 쓰는 검증된 기법으로 종목을 데이터로 봅니다. 예측도 추천도 없이, 판단은 당신 — 종목을 보는 눈을, 누구에게나.",
      publisher: { "@id": `${SITE_BASE}/#organization` },
    },
  ],
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("link_hub")
    .select("id, country, category, site_name, site_url, description, logo_url, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const { data: ytRows } = await supabase
    .from("youtube_channels")
    .select("rank, title, thumbnail_url, subscriber_count, channel_url, week_label, description")
    .eq("country", "KR")
    .order("rank", { ascending: true });
  const youtubeChannels = ytRows ?? [];

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSONLD) }} />
      <HomeIndexStrip />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} youtubeChannels={youtubeChannels} />
      </div>
    </>
  );
}
