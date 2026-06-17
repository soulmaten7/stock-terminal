import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 금융위원회_펀드상품기본정보 (펀드표준코드) — data.go.kr
const BASE = "https://apis.data.go.kr/1160100/service/GetFundProductInfoService/getStandardCodeInfo";

type KrwRow = Record<string, unknown>;

export async function GET(req: NextRequest) {
  const key = (process.env.DATA_GO_KR_KEY || "").trim();
  const sp = req.nextUrl.searchParams;
  const debug = sp.get("debug") === "1";
  if (!key) return NextResponse.json({ funds: [], error: "no_key (.env.local DATA_GO_KR_KEY 확인)" });

  const q = (sp.get("q") || "").trim(); // 펀드명 검색
  const type = (sp.get("type") || "").trim(); // 펀드유형 (주식형 등)
  const page = sp.get("page") || "1";
  const rows = sp.get("rows") || "50";

  const params = new URLSearchParams();
  params.set("serviceKey", key);
  params.set("pageNo", page);
  params.set("numOfRows", debug ? "5" : rows);
  params.set("resultType", "json");
  if (q) params.set("fndNm", q);
  if (type) params.set("fndTp", type);

  try {
    const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
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
        snippet: text.slice(0, 1200),
      });
    }

    const response = json?.response as Record<string, unknown> | undefined;
    const body = response?.body as Record<string, unknown> | undefined;
    const itemsWrap = body?.items as Record<string, unknown> | undefined;
    const raw = itemsWrap?.item;
    const arr: KrwRow[] = Array.isArray(raw) ? (raw as KrwRow[]) : raw ? [raw as KrwRow] : [];

    const funds = arr.map((it) => ({
      code: String(it.srtnCd ?? "").trim(),
      stdCode: String(it.asoStdCd ?? "").trim(),
      name: String(it.fndNm ?? "").trim(),
      type: String(it.fndTp ?? "").trim(),
      setupDate: String(it.setpDt ?? "").trim(),
    }));

    const totalCount = Number(body?.totalCount ?? 0);
    return NextResponse.json({ funds, count: funds.length, totalCount, page: Number(page) });
  } catch (e) {
    return NextResponse.json({ funds: [], error: e instanceof Error ? e.message : String(e) });
  }
}
