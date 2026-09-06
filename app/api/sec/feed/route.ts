import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DART 피드(/api/dart/feed)와 동일한 item shape → SecFeed가 DartFeed 렌더를 재사용.
// 미국 매핑: corp=회사명, title=폼 라벨(예 "8-K 공시"), cls=폼 타입(8-K), filer="SEC EDGAR",
//           date=SEC <updated> ISO 원문, rcpNo=link(고유키 용), link=원문 href.
type SecItem = {
  corp: string;
  title: string;
  cls: string;
  stockCode: string;
  filer: string;
  date: string;
  rcpNo: string;
  link: string;
};

let cache: { at: number; data: unknown } | null = null;

// SEC는 User-Agent 선언 필수(없으면 403). 연락처 포함 형식 권장.
const SEC_UA = process.env.SEC_USER_AGENT || "EarthTicker/1.0 (signal.kr.biz@gmail.com)";
const SEC_URL =
  "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&count=40&output=atom";

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .trim();
}

export async function GET() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch(SEC_URL, {
      headers: { "User-Agent": SEC_UA, Accept: "application/atom+xml" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ items: [], error: "sec_" + res.status });
    const xml = await res.text();

    const items: SecItem[] = [];
    // Atom: <item> 아님 → <entry> 블록.
    const blocks = xml.match(/<entry\b[\s\S]*?<\/entry>/g) ?? [];
    for (const b of blocks) {
      const rawTitle = decode((b.match(/<title>([\s\S]*?)<\/title>/) ?? ["", ""])[1]);
      // 예: "8-K - XTI Aerospace, Inc. (0001529113) (Filer)"  → [form, ...rest]
      const dash = rawTitle.indexOf(" - ");
      const form = (dash >= 0 ? rawTitle.slice(0, dash) : rawTitle).trim();
      const rest = dash >= 0 ? rawTitle.slice(dash + 3) : "";
      // 끝의 "(CIK) (Filer)" 제거 → 회사명.
      const corp = rest.replace(/\s*\(\d+\)\s*\([^)]*\)\s*$/, "").trim();
      // 폼 타입: category term="…" 우선, 없으면 title 첫 토큰.
      const cls = ((b.match(/term="([^"]+)"/) ?? ["", form])[1]).trim();
      const date = ((b.match(/<updated>([\s\S]*?)<\/updated>/) ?? ["", ""])[1]).trim();
      // 원문 링크: <link rel="alternate" ... href="…">
      const link = ((b.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) ?? ["", ""])[1]).trim();
      if (!corp || !link) continue;
      items.push({
        corp,
        title: `${form} 공시`,
        cls,
        stockCode: "",
        filer: "SEC EDGAR",
        date,
        rcpNo: link, // 고유키
        link,
      });
    }

    const data = { items: items.slice(0, 25) };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
