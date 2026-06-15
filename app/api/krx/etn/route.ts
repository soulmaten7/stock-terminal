import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ETN 일별매매정보 — KRX 공식 OpenAPI. 'ETN 일별매매정보' 이용신청 안 됐으면 빈 배열.
const EP = "http://data-dbg.krx.co.kr/svc/apis/sto/etn_bydd_trd";

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
function toShort(code: string): string {
  const c = code.trim();
  return c.length === 12 ? c.slice(3, 9) : c;
}

async function fetchOne(basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${EP}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? []) as KrxRow[];
  } catch {
    return [];
  }
}

export async function GET() {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ etns: [], source: "krx", error: "no_key" });

  try {
    let rows: KrxRow[] = [];
    let usedDate = "";
    const now = new Date();
    for (let i = 0; i < 8 && rows.length === 0; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const basDd = ymd(d);
      const part = await fetchOne(basDd, key);
      if (part.length > 0) {
        rows = part;
        usedDate = basDd;
      }
    }
    if (rows.length === 0) {
      return NextResponse.json({ etns: [], source: "krx", error: "empty_or_not_subscribed" });
    }
    const etns = rows
      .map((r) => ({
        symbol: toShort(String(r.ISU_CD || "")),
        name: String(r.ISU_NM || "").trim(),
        price: num(r.TDD_CLSPRC),
        changePercent: num(r.FLUC_RT),
        volume: num(r.ACC_TRDVOL),
        tradeAmount: num(r.ACC_TRDVAL),
        marketCap: num(r.MKTCAP),
      }))
      .filter((s) => s.symbol && s.price > 0)
      .sort((a, b) => b.tradeAmount - a.tradeAmount);

    return NextResponse.json({ etns, source: "krx", basDd: usedDate, count: etns.length });
  } catch (e) {
    return NextResponse.json({ etns: [], source: "krx", error: e instanceof Error ? e.message : String(e) });
  }
}
