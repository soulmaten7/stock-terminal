import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 금융위원회_펀드상품기본정보 (펀드표준코드) — data.go.kr
const BASE = "https://apis.data.go.kr/1160100/service/GetFundProductInfoService/getStandardCodeInfo";

type FundRow = Record<string, unknown>;

export async function GET(req: NextRequest) {
  const key = (process.env.DATA_GO_KR_KEY || "").trim();
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (!key) return NextResponse.json({ funds: [], error: "no_key (.env.local DATA_GO_KR_KEY 확인)" });

  const url =
    `${BASE}?serviceKey=${encodeURIComponent(key)}` +
    `&pageNo=1&numOfRows=${debug ? "5" : "100"}&resultType=json`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }

    if (debug) {
      return NextResponse.json({
        status: res.status,
        ok: res.ok,
        parsed: json ? "json" : "not_json(xml?)",
        snippet: text.slice(0, 900),
      });
    }

    // data.go.kr 표준 구조: response.body.items.item[]
    const response = json?.response as Record<string, unknown> | undefined;
    const body = response?.body as Record<string, unknown> | undefined;
    const itemsWrap = body?.items as Record<string, unknown> | undefined;
    const raw = itemsWrap?.item;
    const funds: FundRow[] = Array.isArray(raw) ? (raw as FundRow[]) : raw ? [raw as FundRow] : [];
    const totalCount = (body?.totalCount as number | string | undefined) ?? null;

    return NextResponse.json({ funds, count: funds.length, totalCount });
  } catch (e) {
    return NextResponse.json({ funds: [], error: e instanceof Error ? e.message : String(e) });
  }
}
