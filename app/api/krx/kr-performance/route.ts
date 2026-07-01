import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 전종목 장기수익률(1주~1년) — KRX 공식 OpenAPI 일별매매정보(bydd_trd)를
// 기준일 6개(현재 + 1주/1개월/3개월/6개월/1년 전)로 불러 전 종목 수익률 계산.
// 야후 kr-performance(46종목 한정) 대체 → 전 종목 100% 커버.
// 출력 shape = 야후 kr-performance와 동일: { items: [{ symbol, r1w, r1m, r3m, r6m, r1y }] }
const BASE = "http://data-dbg.krx.co.kr/svc/apis/sto";
const EP = { kospi: `${BASE}/stk_bydd_trd`, kosdaq: `${BASE}/ksq_bydd_trd` };

type KrxRow = Record<string, string>;

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function ymd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function toShort(code: string): string {
  const c = (code || "").trim();
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

// target 이하 가장 가까운 거래일의 전종목 종가맵(symbol → close)
async function closesForDate(target: Date, key: string): Promise<Map<string, number>> {
  for (let i = 0; i < 12; i++) {
    const d = new Date(target);
    d.setDate(target.getDate() - i);
    const basDd = ymd(d);
    const [a, b] = await Promise.all([
      fetchOne(EP.kospi, basDd, key),
      fetchOne(EP.kosdaq, basDd, key),
    ]);
    const rows = [...a, ...b];
    if (rows.length > 0) {
      const map = new Map<string, number>();
      for (const r of rows) {
        const sym = toShort(String(r.ISU_CD || ""));
        const close = num(r.TDD_CLSPRC);
        if (sym && close > 0) map.set(sym, close);
      }
      if (map.size > 0) return map;
    }
  }
  return new Map();
}

function pct(now: number, past: number | undefined): number | null {
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

// 과거 기준일 데이터는 불변 + 현재가 일 1회 갱신 → 30분 캐시면 충분
let cache: { at: number; data: unknown } | null = null;
const TTL = 30 * 60 * 1000;

export async function GET() {
  // ── 스냅샷 우선(크론 미리계산) ──
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("kr_stock_snapshot")
      .select("symbol,r1w,r1m,r3m,r6m,r1y")
      .limit(5000);
    if (!error && data && data.length > 0) return NextResponse.json({ items: data });
  } catch {
    /* 스냅샷 실패 → 라이브 fallback */
  }

  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ items: [], error: "no_key" });
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json(cache.data);

  const today = new Date();
  const day = 86400000;
  const base = await closesForDate(today, key);
  if (base.size === 0) return NextResponse.json({ items: [], error: "empty" });

  const [m1w, m1m, m3m, m6m, m1y] = await Promise.all([
    closesForDate(new Date(today.getTime() - 7 * day), key),
    closesForDate(new Date(today.getTime() - 30 * day), key),
    closesForDate(new Date(today.getTime() - 91 * day), key),
    closesForDate(new Date(today.getTime() - 182 * day), key),
    closesForDate(new Date(today.getTime() - 365 * day), key),
  ]);

  const items = Array.from(base.entries()).map(([symbol, close]) => ({
    symbol,
    r1w: pct(close, m1w.get(symbol)),
    r1m: pct(close, m1m.get(symbol)),
    r3m: pct(close, m3m.get(symbol)),
    r6m: pct(close, m6m.get(symbol)),
    r1y: pct(close, m1y.get(symbol)),
  }));

  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
