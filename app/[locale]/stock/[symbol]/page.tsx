// 종목 렌즈 페이지 — 서버 컴포넌트 껍데기.
// 역할: 봇/초기 HTML이 '회사명'을 보도록 SEO를 심는다.
//   1) generateMetadata — 종목명 기반 유니크 title/description/canonical/OG (수천 종목이 서로 다른 페이지가 됨)
//   2) 서버에서 이름 해석 → <h1>에 주입(initialName) → 원시 HTML에 '삼성전자'가 박힘
//   3) JSON-LD(BreadcrumbList + Corporation) — 구글이 '종목 정보 페이지'로 이해
// 인터랙티브 본문은 StockLensClient(클라)가 그대로 담당.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveStockName, tickerOf } from "@/lib/stockName";
import { getInstrumentType } from "@/lib/instrumentType";
import { isBotUA } from "@/lib/rateLimit";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isActiveSymbol } from "@/lib/activeMarkets";
import StockLensClient from "./StockLensClient";
import EtfLensClient from "./EtfLensClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://earthticker.app";

type Params = { params: Promise<{ locale: string; symbol: string }> };

// SEO 템플릿은 조건부(VN·이름해석·공시유무)라 ICU 메시지로 빼면 지저분해진다 → 서버에서 인라인 분기.
// (UI 문자열 i18n 규칙과 별개 — ko.json/en.json은 건드리지 않는다.)
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);

  // 비활성 시장(JP·CN/HK·VN·GB) 진입 — 렌즈·공시·브리핑 호출 자체를 막는다(STEP 799). 이름 해석(resolveStockName)조차
  // 호출 안 함 — 그 함수가 이미 DB/야후를 두드리므로 여기서 완전히 조기 차단해야 "비용·오표시 동시 차단"이 성립한다.
  if (!isActiveSymbol(symbol)) {
    const t = await getTranslations({ locale, namespace: "Common" });
    return { title: t("marketNotSupportedTitle"), description: t("marketNotSupportedDesc"), robots: { index: false } };
  }

  const isEn = locale === "en";
  const ticker = tickerOf(symbol);
  const info = await resolveStockName(symbol);
  const name = info?.name || ticker;
  const hasName = !!info?.name;
  const en = info?.en && info.en !== info?.name ? info.en : undefined; // 원어/영문명(한글 오버라이드 시 병기)

  // VN은 공식 공시 소스가 전부 막혀 구글 뉴스로 대체(정직 표기) — "공시" 대신 "뉴스"만.
  const isVN = /\.VN$/i.test(symbol);

  // 영어 페이지는 원어/영문명을 주(主)로 올린다 — ko는 '애플(Apple Inc.·AAPL)', en은 'Apple Inc. (AAPL)'.
  // (name은 한글 오버라이드라 그대로 쓰면 "애플 forecast" 같은 검색되지 않는 키워드가 나온다.)
  const main = isEn ? (en ?? name) : name; // 제목·설명의 주 이름
  // en은 보조 이름 병기 안 함 — 한글 오버라이드명(애플·삼성전자)이 en_US meta description/keywords에 새는 것 방지(STEP 747).
  const sub = isEn ? undefined : en;

  // 2026-09-05(ORDER_트릴리언모델잔재정리_0905): "TR-AI 렌즈"/"AI Lens" 표기 제거 — 종목 페이지가
  // 더 이상 렌즈를 보여주지 않는데 SEO 메타(수천 페이지)에만 남아 있던 잔재. 새 문구를 짓지 않고
  // 해당 구절만 덜어냈다(리브랜딩 별도).
  const label = hasName ? `${main} (${ticker})` : ticker;
  const title = isEn
    ? isVN
      ? `${label} Stock Price · News`
      : `${label} Stock Price · News · Filings`
    : isVN
      ? `${label} 주가·뉴스`
      : `${label} 주가·뉴스·공시`;
  const idPart = hasName ? `(${sub ? `${sub}·` : ""}${ticker})` : "";
  const description = isEn
    ? isVN
      ? `${main}${idPart} stock price with the latest news at a glance. Not a buy or sell signal — material for you to judge for yourself.`
      : `${main}${idPart} stock price with the latest news and filings at a glance. Not a buy or sell signal — material for you to judge for yourself.`
    : isVN
      ? `${main}${idPart} 주가와 최근 뉴스를 한눈에. 사고팔 신호가 아니라 스스로 판단할 재료예요.`
      : `${main}${idPart} 주가와 최근 뉴스·공시를 한눈에. 사고팔 신호가 아니라 스스로 판단할 재료예요.`;

  // 경로는 routing 설정(as-needed)이 만들게 둔다 — ko는 프리픽스 없음, en은 /en. 직접 조립하면 프리픽스가 틀린다.
  const href = `/stock/${symbol}`;
  const path = getPathname({ href, locale });
  const url = `${BASE}${path}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ href, locale: l })])
  );

  const kw = isEn
    ? hasName
      ? [main, `${main} stock`, `${main} news`, ...(isVN ? [] : [`${main} filings`]), ...(sub ? [sub] : []), ticker, "EarthTicker"]
      : [ticker, "stock", "EarthTicker"]
    : hasName
      ? [main, `${main} 주가`, `${main} 뉴스`, ...(isVN ? [] : [`${main} 공시`]), ...(sub ? [sub] : []), ticker, "EarthTicker"]
      : [ticker, "주가", "EarthTicker"];

  return {
    title,
    description,
    keywords: kw,
    // 이름 미해석 심볼(대개 존재하지 않는 티커) — 색인 방지(STEP 798 §9). 완전한 404 전환은 후속.
    robots: hasName ? undefined : { index: false },
    alternates: {
      canonical: path,
      languages: {
        ...languages,
        "x-default": getPathname({ href, locale: routing.defaultLocale }),
      },
    },
    openGraph: {
      title: `${title} | EarthTicker`,
      description,
      url,
      type: "website",
      locale: isEn ? "en_US" : "ko_KR",
    },
    twitter: { card: "summary_large_image", title: `${title} | EarthTicker`, description },
  };
}

export default async function StockPage({ params }: Params) {
  const { locale, symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);

  // 비활성 시장 안내(STEP 799) — 404 대신 200 안내 페이지(검색엔진에 남은 기존 URL 배려) + noindex(메타에서 처리).
  // StockLensClient/EtfLensClient를 렌더하지 않으므로 렌즈·공시·브리핑 클라 fetch 자체가 발생하지 않는다.
  if (!isActiveSymbol(symbol)) {
    const t = await getTranslations({ locale, namespace: "Common" });
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <p className="text-lg font-semibold text-unjong-primary">{t("marketNotSupportedTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-unjong-muted">{t("marketNotSupportedDesc")}</p>
        <Link href="/" className="mt-6 rounded-lg bg-unjong-strong px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">{t("goHome")}</Link>
      </main>
    );
  }

  const isEn = locale === "en";
  const ticker = tickerOf(symbol);
  const info = await resolveStockName(symbol);
  const name = info?.name || ticker;
  const url = `${BASE}${getPathname({ href: `/stock/${symbol}`, locale })}`;

  // 빵부스러기 라벨은 제목과 같은 이름을 쓴다(en이면 원어/영문명). Corporation.name은 데이터라 그대로.
  const crumbName = isEn && info?.en && info.en !== info.name ? info.en : info?.name;

  // JSON-LD — 빵부스러기(지원 리치결과) + 회사 엔티티(티커 매칭). 이름 해석된 종목만 Corporation 노드 추가.
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: isEn ? "Home" : "홈", item: isEn ? `${BASE}/en` : BASE },
        { "@type": "ListItem", position: 2, name: isEn ? "Stocks" : "주식", item: isEn ? `${BASE}/en/` : `${BASE}/` },
        { "@type": "ListItem", position: 3, name: crumbName ? `${crumbName} (${ticker})` : ticker, item: url },
      ],
    },
  ];
  if (info?.name) {
    const corp: Record<string, unknown> = { "@type": "Corporation", name: info.name, tickerSymbol: ticker, url };
    if (info.en && info.en !== info.name) corp.alternateName = info.en; // 원어/영문명
    graph.push(corp);
  }
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  // 🔴 STEP 828 §3: 봇/크롤러는 외부 API(네이버·야후) 호출 없이 판별 — 사이트맵 수천 URL 순회가 외부호출 폭주(§2 방아쇠)로 번지는 것 차단.
  //   서버 HTML SEO(h1·JSON-LD)는 kind와 무관하므로 봇에 equity 폴백해도 노출은 동일. 일반 사용자는 그대로.
  const ua = (await headers()).get("user-agent");
  const kind = await getInstrumentType(symbol, { allowExternal: !isBotUA(ua) }); // ETF/펀드면 구성 뷰로 분기(기업재무 렌즈 대신)

  // h1도 제목·빵부스러기와 같은 이름으로(en이면 영문명 — 한글명이 영어 화면에 뜨는 것 방지). crumbName과 같은 규칙.
  const h1Name = crumbName || undefined;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {kind === "fund" ? (
        <EtfLensClient symbol={symbol} initialName={h1Name} />
      ) : (
        <>
          {/* Q1·역DCF 섹션 — 2026-09-05(ORDER_트릴리언모델잔재정리_0905) 제거. 둘 다
              Q1_ENABLED/REVDCF_ENABLED 플래그가 프로덕션에 없어(env 확인) 화면에 뜬 적이
              없었다 — 컴포넌트·전용 라우트도 함께 삭제(폐지 크론 대상, 파킹 아님). */}
          <StockLensClient initialName={h1Name} />
        </>
      )}
    </>
  );
}
