// 종목 렌즈 페이지 — 서버 컴포넌트 껍데기.
// 역할: 봇/초기 HTML이 '회사명'을 보도록 SEO를 심는다.
//   1) generateMetadata — 종목명 기반 유니크 title/description/canonical/OG (수천 종목이 서로 다른 페이지가 됨)
//   2) 서버에서 이름 해석 → <h1>에 주입(initialName) → 원시 HTML에 '삼성전자'가 박힘
//   3) JSON-LD(BreadcrumbList + Corporation) — 구글이 '종목 정보 페이지'로 이해
// 인터랙티브 본문은 StockLensClient(클라)가 그대로 담당.
import type { Metadata } from "next";
import { resolveStockName, tickerOf } from "@/lib/stockName";
import StockLensClient from "./StockLensClient";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app";

type Params = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);
  const ticker = tickerOf(symbol);
  const info = await resolveStockName(symbol);
  const name = info?.name || ticker;
  const hasName = !!info?.name;
  const en = info?.en && info.en !== info?.name ? info.en : undefined; // 원어/영문명(한글 오버라이드 시 병기)

  const label = hasName ? `${name} (${ticker})` : ticker;
  const title = `${label} 주가·AI 렌즈·뉴스·공시`;
  const idPart = hasName ? `(${en ? `${en}·` : ""}${ticker})` : "";
  const description = `${name}${idPart} 주가와 검증된 투자기법 렌즈(모멘텀·밸류·퀄리티·F-Score), 최근 뉴스·공시를 한눈에. 사고팔 신호가 아니라 스스로 판단할 재료예요.`;
  const url = `${BASE}/stock/${symbol}`;

  const kw = hasName
    ? [name, `${name} 주가`, `${name} 전망`, `${name} 뉴스`, `${name} 공시`, ...(en ? [en] : []), ticker, "AI 렌즈", "Trillion"]
    : [ticker, "주가", "AI 렌즈", "Trillion"];

  return {
    title,
    description,
    keywords: kw,
    alternates: { canonical: `/stock/${symbol}` },
    openGraph: {
      title: `${title} | Trillion`,
      description,
      url,
      type: "website",
      locale: "ko_KR",
    },
    twitter: { card: "summary_large_image", title: `${title} | Trillion`, description },
  };
}

export default async function StockPage({ params }: Params) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);
  const ticker = tickerOf(symbol);
  const info = await resolveStockName(symbol);
  const name = info?.name || ticker;
  const url = `${BASE}/stock/${symbol}`;

  // JSON-LD — 빵부스러기(지원 리치결과) + 회사 엔티티(티커 매칭). 이름 해석된 종목만 Corporation 노드 추가.
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: BASE },
        { "@type": "ListItem", position: 2, name: "주식", item: `${BASE}/` },
        { "@type": "ListItem", position: 3, name: info?.name ? `${info.name} (${ticker})` : ticker, item: url },
      ],
    },
  ];
  if (info?.name) {
    const corp: Record<string, unknown> = { "@type": "Corporation", name: info.name, tickerSymbol: ticker, url };
    if (info.en && info.en !== info.name) corp.alternateName = info.en; // 원어/영문명
    graph.push(corp);
  }
  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StockLensClient initialName={info?.name || undefined} />
    </>
  );
}
