import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ETN 일별매매정보 — KRX 공식 OpenAPI. ?debug=1 이면 원본 응답 진단.
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

async function fetchRaw(basDd: string, key: string) {
  try {
    const res = await fetch(`${EP}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }
    const block = json
      ? ((json.OutBlock_1 as KrxRow[] | undefined) ?? (json.output as KrxRow[] | undefined) ?? null)
      : null;
    return { status: res.status, ok: res.ok, json, block, text };
  } catch (e) {
    return {
      status: 0,
      ok: false,
      json: null as Record<string, unknown> | null,
      block: null as KrxRow[] | null,
      text: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function GET(req: NextRequest) {
  const key = (process.env.KRX_API_KEY || "").trim();
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (!key) return NextResponse.json({ etns: [], source: "krx", error: "no_key" });

  const now = new Date();
  const diag: Array<Record<string, unknown>> = [];
  let rows: KrxRow[] = [];
  let usedDate = "";

  for (let i = 0; i < 8 && rows.length === 0; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const basDd = ymd(d);
    const r = await fetchRaw(basDd, key);
    const cnt = Array.isArray(r.block) ? r.block.length : 0;
    if (debug) {
      diag.push({
        basDd,
        status: r.status,
        ok: r.ok,
        jsonKeys: r.json ? Object.keys(r.json) : null,
        rowCount: cnt,
        snippet: r.json ? null : r.text.slice(0, 300),
      });
    }
    if (cnt > 0) {
      rows = r.block as KrxRow[];
      usedDate = basDd;
    }
  }

  if (debug) {
    return NextResponse.json({ diag, usedDate, rowCount: rows.length, firstRow: rows[0] ?? null });
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
}
