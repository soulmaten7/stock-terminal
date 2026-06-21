import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IpoItem = { name: string; sub: string; price: string; band: string; rate: string; underwriter: string; link: string };

let cache: { at: number; data: unknown } | null = null;

function absUrl(href: string): string {
  try { return new URL(href, "http://www.38.co.kr/html/fund/index.htm").href; }
  catch { return "http://www.38.co.kr/html/fund/index.htm?o=k"; }
}

export async function GET() {
  if (cache && Date.now() - cache.at < 60 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  try {
    const res = await fetch("http://www.38.co.kr/html/fund/index.htm?o=k", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ items: [], error: "fetch_" + res.status });

    const buf = await res.arrayBuffer();
    const html = new TextDecoder("euc-kr").decode(buf);
    const $ = cheerio.load(html);

    const items: IpoItem[] = [];
    $("tr").each((_, tr) => {
      const $tr = $(tr);
      // 종목 상세 링크(o=v&no=)가 정확히 1개인 "진짜 데이터 행"만.
      // (뉴스 행=o=v&m=nostock / 표 컨테이너 행=링크 수십 개 → 제외)
      // o=v 셀렉터(&는 cheerio 셀렉터에서 매칭 불가)로 찾고, 디코딩된 href로 필터
      const links = $tr.find('a[href*="o=v"]').filter((_, el) => {
        const h = $(el).attr("href") || "";
        return /[?&]no=\d+/.test(h) && !h.includes("nostock"); // 종목 상세(no=) O, 뉴스(nostock) X
      });
      if (links.length !== 1) return; // 1개=진짜 데이터 행 / 0·다수=뉴스·컨테이너 행
      const a = links.first();
      const name = a.text().replace(/\s+/g, " ").trim();
      if (!name) return;

      const cells = $tr.find("td").map((_, td) => $(td).text().replace(/\s+/g, " ").trim()).get();
      const dateIdx = cells.findIndex((c) => /\d{4}\.\d{2}\.\d{2}/.test(c));
      if (dateIdx < 0) return;

      const sub = cells[dateIdx] || "";
      if (sub.length > 30) return; // 깨끗한 날짜 셀("2026.07.23~07.24")만 — 컨테이너 행 방어
      const priceRaw = cells[dateIdx + 1] || "";
      const band = cells[dateIdx + 2] || "";
      const rate = cells.slice(dateIdx + 1).find((c) => /\d[\d.]*\s*:\s*1/.test(c)) || "";
      const underwriter = cells.slice(dateIdx + 1).find((c) => c.includes("증권")) || "";

      items.push({
        name,
        sub,
        price: priceRaw && priceRaw !== "-" ? priceRaw : "",
        band,
        rate,
        underwriter,
        link: absUrl(a.attr("href") || ""),
      });
    });

    const seen = new Set<string>();
    const list = items
      .filter((x) => {
        if (seen.has(x.name)) return false;
        seen.add(x.name);
        return true;
      })
      .slice(0, 15);

    const data = { items: list };
    if (list.length > 0) cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
