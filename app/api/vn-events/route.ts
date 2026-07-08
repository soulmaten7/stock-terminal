import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

// VN 종목 최근 공시/뉴스. 소스 = Google News RSS (vi·VN).
// TCBS tcanalysis v1/v2 전체 404, CafeF AJAX 빈응답(세션 필요), HNX/SSI 도달불가.
// Google News RSS가 유일하게 안정 동작 — 배당·실적·합병 등 실이벤트 잘 잡힘.
const MATERIAL =
  /kết quả kinh doanh|doanh thu|lợi nhuận|cổ tức|đại hội|nghị quyết|báo cáo tài chính|phát hành|sáp nhập|mua lại|hợp đồng lớn|dự án|kế hoạch|bổ nhiệm|từ nhiệm|tăng vốn|giảm vốn|mua cổ phiếu|bán cổ phiếu quỹ|niêm yết|hủy niêm yết|quý [1-4i]/i;

const NOISE =
  /giao dịch nội bộ|đăng ký (mua|bán) \d|thay đổi số lượng cổ phiếu lẻ|kết quả giao dịch cổ phiếu của/i;

function tickerOf(symbol: string): string | null {
  const m = symbol.match(/^([A-Za-z0-9]+)\.VN$/i);
  return m ? m[1].toUpperCase() : null;
}

function unCdata(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const ticker = tickerOf(symbol);
  if (!ticker) return NextResponse.json({ symbol, events: [] });

  const hit = cache.get(ticker);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  const events: {
    id: string;
    title: string;
    date: string;
    source: string;
    url: string;
    material: boolean;
  }[] = [];

  try {
    const query = `${ticker} kết quả kinh doanh OR cổ tức OR báo cáo tài chính OR đại hội cổ đông OR phát hành OR sáp nhập`;
    const rssUrl =
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent(query) +
      "&hl=vi&gl=VN&ceid=VN:vi";

    const res = await fetch(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (res.ok) {
      const xml = await res.text();
      const blocks = xml.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
      const seen = new Set<string>();

      for (const b of blocks) {
        if (events.length >= 8) break;
        let title = unCdata((b.match(/<title>([\s\S]*?)<\/title>/) ?? ["", ""])[1]);
        const link = ((b.match(/<link>([\s\S]*?)<\/link>/) ?? ["", ""])[1]).trim();
        const pubDate = ((b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? ["", ""])[1]).trim();
        const sm = b.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/);
        const srcName = sm ? unCdata(sm[2]) : "";
        if (srcName && title.endsWith(" - " + srcName)) {
          title = title.slice(0, -(" - " + srcName).length).trim();
        }
        if (!title || !link || seen.has(link)) continue;
        if (NOISE.test(title)) continue;
        seen.add(link);

        // ISO 날짜 포맷
        const d = new Date(pubDate);
        const date = isNaN(d.getTime())
          ? pubDate
          : d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

        events.push({
          id: link.slice(-16),
          title,
          date,
          source: srcName || "Google News",
          url: link,
          material: MATERIAL.test(title),
        });
      }
    }
  } catch {
    /* graceful — 못 가져오면 빈 층(숨김) */
  }

  const out = { symbol, ticker, events };
  cache.set(ticker, { at: Date.now(), data: out });
  return NextResponse.json(out);
}
