import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 전종목 일별매매정보 — KRX 공식 OpenAPI (data-dbg.krx.co.kr). 일별(장 마감 기준).
// 인증키: .env.local 의 KRX_API_KEY (절대 커밋 금지). 키 없음/실패/빈값 → 빈 배열 → MarketClient 가 KIS 30 fallback.

const BASE = "http://data-dbg.krx.co.kr/svc/apis/sto";
const EP = {
  kospi: `${BASE}/stk_bydd_trd`,
  kosdaq: `${BASE}/ksq_bydd_trd`,
};

type KrxRow = Record<string, string>;

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
// ISIN(KR7…12자리)이면 6자리 단축코드로, 아니면 그대로
function toShort(code: string): string {
  const c = code.trim();
  return c.length === 12 ? c.slice(3, 9) : c;
}

async function fetchOne(url: string, basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${url}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? j.block1 ?? []) as KrxRow[];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") || "all"; // all|kospi|kosdaq
  const sort = request.nextUrl.searchParams.get("sort") || "amount"; // amount|volume|cap|up|down
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || "100", 10) || 100,
    200
  );

  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ stocks: [], source: "krx", error: "no_key" });

  try {
    const urls =
      market === "kospi" ? [EP.kospi] : market === "kosdaq" ? [EP.kosdaq] : [EP.kospi, EP.kosdaq];

    // 최신 영업일: 오늘부터 최대 8일 거슬러 데이터 있는 첫 날 (주말·휴장·미집계 대응)
    let rows: KrxRow[] = [];
    let usedDate = "";
    const now = new Date();
    for (let i = 0; i < 8 && rows.length === 0; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const basDd = ymd(d);
      const parts = await Promise.all(urls.map((u) => fetchOne(u, basDd, key)));
      const merged = parts.flat();
      if (merged.length > 0) {
        rows = merged;
        usedDate = basDd;
      }
    }
    if (rows.length === 0) return NextResponse.json({ stocks: [], source: "krx", error: "empty" });

    const mapped = rows.map((r) => ({
      symbol: toShort(String(r.ISU_CD || "")),
      name: String(r.ISU_NM || "").trim(),
      price: num(r.TDD_CLSPRC),
      changePercent: num(r.FLUC_RT),
      volume: num(r.ACC_TRDVOL),
      tradeAmount: num(r.ACC_TRDVAL),
      marketCap: num(r.MKTCAP),
    }));

    type M = (typeof mapped)[number];
    const sorters: Record<string, (a: M, b: M) => number> = {
      amount: (a, b) => b.tradeAmount - a.tradeAmount,
      volume: (a, b) => b.volume - a.volume,
      cap: (a, b) => b.marketCap - a.marketCap,
      up: (a, b) => b.changePercent - a.changePercent,
      down: (a, b) => a.changePercent - b.changePercent,
    };
    const stocks = mapped
      .filter((s) => s.symbol && s.price > 0)
      .sort(sorters[sort] || sorters.amount)
      .slice(0, limit)
      .map((s, i) => ({ rank: i + 1, ...s }));

    return NextResponse.json({ stocks, source: "krx", basDd: usedDate });
  } catch (e) {
    return NextResponse.json({
      stocks: [],
      source: "krx",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
