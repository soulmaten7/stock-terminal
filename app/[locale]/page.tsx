import type { Metadata } from "next";
import TodayClient from "@/components/today/TodayClient";
import HomeIndexStrip from "@/components/layout/HomeIndexStrip";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getIndices } from "@/lib/indices";
import { getHomeReportFeed, type HomeReportFeed } from "@/lib/channelReports";
import { getOurChannels } from "@/lib/ourChannels";
import { REPORT_COUNTRIES } from "@/lib/constants/reportCountries";

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

  // ORDER_트릴리언홈피드_0905 STEP2: 렌즈 상태 변화(getTodayChanges) 호출을 홈에서 끊고
  // 리포트 피드(channel_reports)로 교체 — 크론·API 라우트 자체는 이번에 건드리지 않는다.
  // ORDER_트릴리언국가확장구조_0905 STEP2: 국가별 fetch를 REPORT_COUNTRIES 순회로 — 새 국가가
  // 늘어도 이 파일은 손댈 필요가 없다(목록만 순회).
  // ORDER_트릴리언홈히어로정리_0905: 한 입 브리핑(getLatestDailyBrief) 호출을 홈에서 끊는다 —
  // 폐지된 렌즈 모델이 생성한 서술이라 화면에 남기지 않는다. 크론(daily-brief)·API 라우트·
  // email-brief(별도 소비자)는 이번에 건드리지 않는다(화면 호출만 끊음, 삭제 아님).
  const [reportFeeds, indices, ourChannels] = await Promise.all([
    Promise.all(REPORT_COUNTRIES.map((rc) => getHomeReportFeed({ country: rc.code, limit: 5 }))),
    getIndices(),
    getOurChannels(),
  ]);
  const reportsByCountry: Record<string, HomeReportFeed> = Object.fromEntries(
    REPORT_COUNTRIES.map((rc, i) => [rc.code, reportFeeds[i]])
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(locale, tMeta('jsonLdDescription'))) }}
      />
      <HomeIndexStrip />
      <TodayClient initialReportsByCountry={reportsByCountry} initialIndices={indices.items} ourChannels={ourChannels} />
    </>
  );
}
