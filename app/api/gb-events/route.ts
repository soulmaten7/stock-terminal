import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

// GB 종목 최근 공시(RNS via Investegate·서버렌더 HTML). 회사별 페이지라 온디맨드(크론 X).
// US /api/events(EDGAR)·KR(DART)·JP(EDINET)의 GB 짝. 원문은 Investegate로 링크(귀속). 10분 캐시.
// 노이즈(브로커 포지션 공시 Form 8.x·대량보유 TR-1·이사거래 PDMR 등) 제외 후 실이벤트만.
const NOISE = [
  /^form\s?\d/i, /form\s?8/i, /form\s?38/i, /rule\s?8/i,
  /holding\(s\) in company/i, /tr-1/i, /pdmr/i, /director[\/ ]/i,
  /transaction in own shares/i, /total voting rights/i, /net asset value/i, /\bnav\b/i,
  /block ?listing/i, /publication of (final terms|prospectus|a? ?supplement)/i,
  /notice of redemption/i, /admission to trading/i, /price monitoring/i,
];
// 제목에 실이벤트 키워드가 있으면 "중대" 배지.
const MATERIAL = /result|trading|interim|half.?year|full.?year|prelim|quarter|\bq[1-4]\b|update|outlook|earnings|revenue|acquisi|disposal|merger|offer|agreement|completion|proposed|partnership|dividend|buyback|buy.?back|board|directorate|appoint|resign|contract|placing|fundrais|capital raise|guidance|profit|strateg|agm|general meeting|circular|recommend|response|joint venture/i;

function tidmOf(symbol: string): string | null {
  const m = symbol.match(/^([A-Za-z0-9.\-]+)\.L$/i);
  if (!m) return null;
  return m[1].toUpperCase().replace(/-/g, "."); // BT-A.L → BT.A
}

const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const tidm = tidmOf(symbol);
  // STEP 797 §1: 심볼 매핑 없음 = unsupported(못 가져옴과 별개). 클라가 숨김.
  if (!tidm) return NextResponse.json({ symbol, events: [], error: "unsupported" });

  const hit = cache.get(tidm);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  let html = "";
  let failed = false;
  try {
    const res = await fetch(`https://www.investegate.co.uk/company/${encodeURIComponent(tidm)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrillionBot/1.0; +https://onetrillion.app)", Accept: "text/html" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) html = await res.text();
    else failed = true;
  } catch {
    failed = true;
  }
  // 상류 실패 — "사건 없음"이라 단언하지 않고 숨김. 캐시하지 않음(재시도).
  if (failed) return NextResponse.json({ symbol, tidm, events: [], error: "fetch_failed" });

  const events: { id: string; title: string; date: string; time: string; source: string; url: string; material: boolean }[] = [];
  const rowRe =
    /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>[\s\S]*?source-([A-Za-z]+)[\s\S]*?<a class="announcement-link" href="([^"]+?\/(\d+))"[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html)) && events.length < 8) {
    const [, date, time, source, url, id, rawTitle] = m;
    const title = rawTitle
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ").trim();
    if (!title || seen.has(id)) continue;
    if (NOISE.some((re) => re.test(title))) continue;
    seen.add(id);
    events.push({ id, title, date: date.trim(), time: time.trim(), source: source.toUpperCase(), url, material: MATERIAL.test(title) });
  }

  const out = { symbol, tidm, events };
  cache.set(tidm, { at: Date.now(), data: out });
  return NextResponse.json(out);
}
