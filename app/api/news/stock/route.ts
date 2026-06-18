import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { isKrxCode } from "@/lib/code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

// 한국 RSS 소스 (시장 뉴스 — 종목명 매칭)
const KR_SOURCES = [
  { name: "한경", url: "https://www.hankyung.com/feed/all-news" },
  { name: "매경", url: "https://www.mk.co.kr/rss/30000001/" },
  { name: "머니투데이", url: "https://rss.mt.co.kr/mt_news.xml" },
];

function parseRSS(xml: string, publisher: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?<\/title>/;
  const linkRegex = /<link>([^<]+)<\/link>/;
  const dateRegex = /<pubDate>([^<]+)<\/pubDate>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (itemXml.match(titleRegex) || [])[1];
    const link = (itemXml.match(linkRegex) || [])[1];
    const date = (itemXml.match(dateRegex) || [])[1];
    if (title && link) {
      items.push({
        title: title.trim().replace(/&amp;/g, "&"),
        link: link.trim(),
        publisher,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
    }
  }
  return items;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const symbol = sp.get("symbol");
  if (!symbol) return NextResponse.json({ items: [], error: "symbol 필수" });

  try {
    // 1) 종목명 가져오기 (한국: stocks DB, 미국: 그대로)
    let stockName = symbol;
    let market: "KR" | "US" = "KR";

    if (/^[A-Z.\-]+$/.test(symbol)) {
      market = "US";
      stockName = symbol;
    } else if (isKrxCode(symbol)) {
      // stocks DB 에서 한국 종목명
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("stocks")
        .select("name_ko")
        .eq("symbol", symbol)
        .limit(1)
        .maybeSingle();
      if (data?.name_ko) stockName = data.name_ko;
    }

    if (market === "US") {
      // Yahoo Finance 뉴스
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const search: any = await yf.search(symbol, { newsCount: 10 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const news = (search?.news || []).map((n: any) => ({
        title: n.title,
        link: n.link,
        publisher: n.publisher || "Yahoo Finance",
        publishedAt: n.providerPublishTime
          ? new Date(n.providerPublishTime * 1000).toISOString()
          : new Date().toISOString(),
      }));
      return NextResponse.json({ items: news, source: "yahoo" });
    }

    // 한국: RSS 통합 + 종목명 키워드 매칭
    const results = await Promise.allSettled(
      KR_SOURCES.map(async (src) => {
        const r = await fetch(src.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Unjong Bot)" },
          next: { revalidate: 600 },
        });
        if (!r.ok) return [];
        const xml = await r.text();
        return parseRSS(xml, src.name);
      })
    );

    const all: NewsItem[] = [];
    results.forEach((res) => {
      if (res.status === "fulfilled") all.push(...res.value);
    });

    // 종목명이 제목에 포함된 것만 필터
    const filtered = all
      .filter((item) => item.title.includes(stockName))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    return NextResponse.json({ items: filtered, source: "rss", stockName });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
