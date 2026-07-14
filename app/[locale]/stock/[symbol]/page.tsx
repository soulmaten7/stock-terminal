// 종목 렌즈 페이지 — 서버 컴포넌트 껍데기.
// 역할: 봇/초기 HTML이 '회사명'을 보도록 SEO를 심는다.
//   1) generateMetadata — 종목명 기반 유니크 title/description/canonical/OG (수천 종목이 서로 다른 페이지가 됨)
//   2) 서버에서 이름 해석 → <h1>에 주입(initialName) → 원시 HTML에 '삼성전자'가 박힘
//   3) JSON-LD(BreadcrumbList + Corporation) — 구글이 '종목 정보 페이지'로 이해
// 인터랙티브 본문은 StockLensClient(클라)가 그대로 담당.
import type { Metadata } from "next";
import { resolveStockName, tickerOf } from "@/lib/stockName";
import { getInstrumentType } from "@/lib/instrumentType";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import StockLensClient from "./StockLensClient";
import EtfLensClient from "./EtfLensClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app";

type Params = { params: Promise<{ locale: string; symbol: string }> };

// SEO 템플릿은 조건부(VN·이름해석·공시유무)라 ICU 메시지로 빼면 지저분해진다 → 서버에서 인라인 분기.
// (UI 문자열 i18n 규칙과 별개 — ko.json/en.json은 건드리지 않는다.)
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);
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
  const sub = isEn ? (en ? name : undefined) : en; // 괄호/키워드에 병기할 보조 이름

  const label = hasName ? `${main} (${ticker})` : ticker;
  const title = isEn
    ? isVN
      ? `${label} Stock Price · TR-AI Lens · News`
      : `${label} Stock Price · TR-AI Lens · News · Filings`
    : isVN
      ? `${label} 주가·TR-AI 렌즈·뉴스`
      : `${label} 주가·TR-AI 렌즈·뉴스·공시`;
  const idPart = hasName ? `(${sub ? `${sub}·` : ""}${ticker})` : "";
  const description = isEn
    ? isVN
      ? `${main}${idPart} stock price with proven-method lenses (momentum, value, quality, F-Score) and the latest news at a glance. Not a buy or sell signal — material for you to judge for yourself.`
      : `${main}${idPart} stock price with proven-method lenses (momentum, value, quality, F-Score) and the latest news and filings at a glance. Not a buy or sell signal — material for you to judge for yourself.`
    : isVN
      ? `${main}${idPart} 주가와 검증된 투자기법 렌즈(모멘텀·밸류·퀄리티·F-Score), 최근 뉴스를 한눈에. 사고팔 신호가 아니라 스스로 판단할 재료예요.`
      : `${main}${idPart} 주가와 검증된 투자기법 렌즈(모멘텀·밸류·퀄리티·F-Score), 최근 뉴스·공시를 한눈에. 사고팔 신호가 아니라 스스로 판단할 재료예요.`;

  // 경로는 routing 설정(as-needed)이 만들게 둔다 — ko는 프리픽스 없음, en은 /en. 직접 조립하면 프리픽스가 틀린다.
  const href = `/stock/${symbol}`;
  const path = getPathname({ href, locale });
  const url = `${BASE}${path}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ href, locale: l })])
  );

  const kw = isEn
    ? hasName
      ? [main, `${main} stock`, `${main} forecast`, `${main} news`, ...(isVN ? [] : [`${main} filings`]), ...(sub ? [sub] : []), ticker, "AI Lens", "Trillion"]
      : [ticker, "stock", "AI Lens", "Trillion"]
    : hasName
      ? [main, `${main} 주가`, `${main} 전망`, `${main} 뉴스`, ...(isVN ? [] : [`${main} 공시`]), ...(sub ? [sub] : []), ticker, "AI 렌즈", "Trillion"]
      : [ticker, "주가", "AI 렌즈", "Trillion"];

  return {
    title,
    description,
    keywords: kw,
    alternates: {
      canonical: path,
      languages: {
        ...languages,
        "x-default": getPathname({ href, locale: routing.defaultLocale }),
      },
    },
    openGraph: {
      title: `${title} | Trillion`,
      description,
      url,
      type: "website",
      locale: isEn ? "en_US" : "ko_KR",
    },
    twitter: { card: "summary_large_image", title: `${title} | Trillion`, description },
  };
}

export default async function StockPage({ params }: Params) {
  const { locale, symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);
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

  const kind = await getInstrumentType(symbol); // ETF/펀드면 구성 뷰로 분기(기업재무 렌즈 대신)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {kind === "fund" ? (
        <EtfLensClient symbol={symbol} initialName={info?.name || undefined} />
      ) : (
        <StockLensClient initialName={info?.name || undefined} />
      )}
    </>
  );
}
