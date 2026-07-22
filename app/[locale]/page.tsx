import type { Metadata } from "next";
import TodayClient from "@/components/today/TodayClient";
import HomeIndexStrip from "@/components/layout/HomeIndexStrip";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getTodayChanges } from "@/lib/todayChanges";
import { getIndices } from "@/lib/indices";
import { getLatestDailyBrief } from "@/lib/dailyBrief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// 필드 대전환(STEP 767b) — 루트 = 오늘 콘텐츠(구 보드 대체). 메타(위 alternates)·OG(레이아웃 상속)는 SEO 연속성 위해 유지.
// 서버 프리페치(STEP 771 §3) — KR/US 변화 + 지수를 여기서 병렬 조회해 첫 HTML에 포함(스피너 없이 즉시 페인트).
// 관심(watchlist) 섹션만 세션이 필요해 클라 fetch 유지.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tMeta = await getTranslations({ locale, namespace: 'Meta' });

  const [krChanges, usChanges, indices, dailyBrief] = await Promise.all([
    getTodayChanges({ market: "KR", limit: 5 }),
    getTodayChanges({ market: "US", limit: 5 }),
    getIndices(),
    getLatestDailyBrief(locale === "en" ? "US" : "KR"),
  ]);
  const briefText = locale === "en" ? dailyBrief?.text_en ?? null : dailyBrief?.text_ko ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(locale, tMeta('jsonLdDescription'))) }}
      />
      <HomeIndexStrip />
      <TodayClient initialKrChanges={krChanges} initialUsChanges={usChanges} initialIndices={indices.items} dailyBrief={briefText} />
    </>
  );
}
