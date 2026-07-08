import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

// CN A주 최근 공시(cninfo·巨潮资讯网 = 증감회 지정 공식 공시). US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS)의 CN 짝.
// 회사별 온디맨드 + 10분 캐시. orgId는 code마다 형식 달라 topSearch로 조회(하드코딩 금지). 원문 = 静态 PDF.
const NOISE = [
  /减持|增持/, /质押|解押/, /持股.{0,4}(股东|变动)预/, /日常关联交易/, /融资融券/, /龙虎榜/,
];
const MATERIAL = /业绩|年度报告|半年度报告|季度报告|利润分配|分红|派息|回购|重大|收购|合并|重组|中标|重大合同|签署|战略合作|停牌|复牌|增发|定增|可转债|董事会决议|股东大会决议|业绩预告|预增|预减|扭亏|资产/;

function parse(symbol: string): { code: string; column: string } | null {
  const m = symbol.match(/^(\d{6})\.(SS|SZ)$/i);
  if (!m) return null;
  return { code: m[1], column: /SZ$/i.test(symbol) ? "szse" : "sse" };
}

const H = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  "X-Requested-With": "XMLHttpRequest",
  Referer: "http://www.cninfo.com.cn/new/commonUrl?url=disclosure/list/search",
  Accept: "application/json,text/plain,*/*",
};

const orgCache = new Map<string, string>();
const listCache = new Map<string, { at: number; data: unknown }>();

async function getOrgId(code: string): Promise<string> {
  if (orgCache.has(code)) return orgCache.get(code)!;
  const r = await fetch("http://www.cninfo.com.cn/new/information/topSearch/query", {
    method: "POST", headers: H, body: `keyWord=${code}&maxNum=10`, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return "";
  const arr = await r.json();
  const hit = (Array.isArray(arr) ? arr : []).find((x: Record<string, string>) => x.code === code) || arr[0];
  const orgId = hit?.orgId || "";
  if (orgId) orgCache.set(code, orgId);
  return orgId;
}

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const p = parse(symbol);
  if (!p) return NextResponse.json({ symbol, events: [] });

  const hit = listCache.get(p.code);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  const events: { id: string; title: string; date: string; source: string; url: string; pdf: string; material: boolean }[] = [];
  try {
    const orgId = await getOrgId(p.code);
    if (orgId) {
      const body = `stock=${p.code},${orgId}&tabName=fulltext&pageSize=20&pageNum=1&column=${p.column}&isHLtitle=true`;
      const res = await fetch("http://www.cninfo.com.cn/new/hisAnnouncement/query", {
        method: "POST", headers: H, body, cache: "no-store", signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const j = await res.json();
        const anns = j.announcements || [];
        const seen = new Set<string>();
        for (const a of anns) {
          if (events.length >= 8) break;
          const id = String(a.announcementId || "");
          const title = String(a.announcementTitle || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (!id || !title || seen.has(id)) continue;
          if (NOISE.some((re) => re.test(title))) continue;
          seen.add(id);
          const date = a.announcementTime
            ? new Date(Number(a.announcementTime)).toISOString().slice(0, 10)
            : "";
          const pdf = a.adjunctUrl ? `http://static.cninfo.com.cn/${a.adjunctUrl}` : "";
          const web = `http://www.cninfo.com.cn/new/disclosure/detail?stockCode=${p.code}&orgId=${orgId}&announcementId=${id}&announcementTime=${date}`;
          events.push({ id, title, date, source: "cninfo", url: web, pdf, material: MATERIAL.test(title) });
        }
      }
    }
  } catch {
    /* graceful — 못 가져오면 빈 층(숨김) */
  }

  const out = { symbol, code: p.code, events };
  listCache.set(p.code, { at: Date.now(), data: out });
  return NextResponse.json(out);
}
