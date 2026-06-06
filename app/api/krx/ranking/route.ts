import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 전종목 시세(거래대금·거래량·시총·등락) — KRX 정보데이터시스템 비공식 JSON (MDCSTAT01501)
// 약 20분 지연. 실패/빈값이면 빈 배열 반환 → 호출측(MarketClient)이 KIS 30개로 fallback.

const KRX_URL = "http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd";
const BLD = "dbms/MDC/STAT/standard/MDCSTAT01501";

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

async function fetchKrxForDate(trdDd: string): Promise<KrxRow[]> {
  try {
    const body = new URLSearchParams({
      bld: BLD,
      mktId: "ALL",
      trdDd,
      share: "1",
      money: "1",
      csvxls_isNo: "false",
    });
    const res = await fetch(KRX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Referer:
          "http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020101",
      },
      body: body.toString(),
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

  try {
    // 최신 영업일 찾기: 오늘부터 최대 8일 거슬러, 데이터 있는 첫 날 사용 (주말·휴장·미집계 대응)
    let rows: KrxRow[] = [];
    let usedDate = "";
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const trdDd = ymd(d);
      rows = await fetchKrxForDate(trdDd);
      if (rows.length > 0) {
        usedDate = trdDd;
        break;
      }
    }
    if (rows.length === 0) {
      return NextResponse.json({ stocks: [], source: "krx", error: "empty" });
    }

    // 시장 필터 (KONEX 제외)
    const mktOf = (r: KrxRow) => String(r.MKT_NM || "");
    let filtered = rows.filter((r) => mktOf(r) === "KOSPI" || mktOf(r) === "KOSDAQ");
    if (market === "kospi") filtered = filtered.filter((r) => mktOf(r) === "KOSPI");
    else if (market === "kosdaq") filtered = filtered.filter((r) => mktOf(r) === "KOSDAQ");

    // 매핑 (KIS 라우트와 동일한 키로 → MarketClient 매퍼 그대로 재사용)
    const mapped = filtered.map((r) => ({
      symbol: String(r.ISU_SRT_CD || ""),
      name: String(r.ISU_ABBRV || ""),
      price: num(r.TDD_CLSPRC),
      changePercent: num(r.FLUC_RT),
      volume: num(r.ACC_TRDVOL),
      tradeAmount: num(r.ACC_TRDVAL),
      marketCap: num(r.MKTCAP),
    }));

    // 정렬
    type M = (typeof mapped)[number];
    const sorters: Record<string, (a: M, b: M) => number> = {
      amount: (a, b) => b.tradeAmount - a.tradeAmount,
      volume: (a, b) => b.volume - a.volume,
      cap: (a, b) => b.marketCap - a.marketCap,
      up: (a, b) => b.changePercent - a.changePercent,
      down: (a, b) => a.changePercent - b.changePercent,
    };
    const sorted = mapped.sort(sorters[sort] || sorters.amount).slice(0, limit);
    const stocks = sorted.map((s, i) => ({ rank: i + 1, ...s }));

    return NextResponse.json({ stocks, source: "krx", trdDd: usedDate });
  } catch (e) {
    return NextResponse.json({
      stocks: [],
      source: "krx",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
