import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import HomeIndexStrip from "@/components/layout/HomeIndexStrip";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 값=ko.json 키. 이 label은 ToolboxClient의 '링크 준비 중' 안내에 렌더됨.
const CATEGORY_KEYS: Record<string, string> = {
  news: "category.news",
  chart: "category.chart",
  analysis: "category.analysis",
  disclosure: "category.disclosure",
  research: "category.research",
  etf: "category.etf",
  ipo: "category.ipo",
  macro: "category.macro",
  community: "category.community",
  exchange: "category.exchange",
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
// name/alternateName은 브랜드 고유명사라 로케일 불변 — 로케일마다 달라지는 건 description·inLanguage.
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app";
const JSONLD_LANG: Record<string, string> = { ko: "ko-KR", en: "en-US" };

const homeJsonLd = (locale: string, description: string) => ({
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
      inLanguage: JSONLD_LANG[locale] ?? JSONLD_LANG.ko,
      description,
      publisher: { "@id": `${SITE_BASE}/#organization` },
    },
  ],
});

// 홈 hreflang — 경로가 '/'로 확정이라 여기서 HTML alternates를 정확히 박을 수 있다.
// (레이아웃에 두면 하위 페이지가 '/'를 물려받아 틀린다 — layout.tsx 주석 참고)
// 값은 getPathname이 routing 설정(as-needed)대로 뽑는다: ko → '/' · en → '/en'.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ href: '/', locale: l })])
  );

  return {
    alternates: {
      canonical: getPathname({ href: '/', locale }),
      languages: {
        ...languages,
        'x-default': getPathname({ href: '/', locale: routing.defaultLocale }),
      },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Home');
  const tMeta = await getTranslations({ locale, namespace: 'Meta' });
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
    .map((slug) => ({ slug, label: CATEGORY_KEYS[slug] ? t(CATEGORY_KEYS[slug]) : slug, links: grouped[slug]! }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(locale, tMeta('jsonLdDescription'))) }}
      />
      <HomeIndexStrip />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} youtubeChannels={youtubeChannels} />
      </div>
    </>
  );
}
