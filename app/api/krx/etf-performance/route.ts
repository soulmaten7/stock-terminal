import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EP = "http://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd";

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

async function fetchDay(basDd: string, key: string): Promise<KrxRow[]> {
  // 일시적 실패 대비 2회 시도
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${EP}?basDd=${basDd}`, {
        method: "GET",
        headers: { AUTH_KEY: key, Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const j = await res.json();
        const rows = (j.OutBlock_1 ?? j.output ?? []) as KrxRow[];
        if (rows.length > 0) return rows;
      }
    } catch {
      /* 재시도 */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
  }
  return [];
}

async function snapshot(daysAgo: number, key: string, now: Date): Promise<{ basDd: string; rows: KrxRow[] }> {
  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo - i);
    const basDd = ymd(d);
    const rows = await fetchDay(basDd, key);
    if (rows.length > 0) return { basDd, rows };
  }
  return { basDd: "", rows: [] };
}

function closeMap(rows: KrxRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const sym = toShort(String(r.ISU_CD || ""));
    const c = num(r.TDD_CLSPRC);
    if (sym && c > 0) m.set(sym, c);
  }
  return m;
}

function ret(now: number, past: number | undefined): number | null {
  if (!past || past <= 0 || !now) return null;
  return (now / past - 1) * 100;
}

const OFFSETS = { r1w: 7, r1m: 30, r3m: 90, r6m: 180, r1y: 365 };

let cache: { at: number; data: unknown } | null = null;

export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  // 스냅샷 우선(크론 kr-etp 미리계산) — 즉시 서빙·라이브 fetch 불안정 회피. debug면 건너뜀(라이브 진단).
  if (!debug) {
    try {
      const sb = createAdminClient();
      const { data } = await sb
        .from("kr_etp_snapshot")
        .select("symbol,name,price,change_percent,trade_amount,r1w,r1m,r3m,r6m,r1y")
        .eq("kind", "etf")
        .order("trade_amount", { ascending: false, nullsFirst: false })
        .limit(100);
      if (data && data.length > 0) {
        const nn = (v: unknown) => (v == null ? null : Number(v));
        const items = data.map((s) => ({
          symbol: s.symbol,
          name: s.name,
          price: Number(s.price) || 0,
          changePercent: Number(s.change_percent) || 0,
          tradeAmount: Number(s.trade_amount) || 0,
          r1w: nn(s.r1w), r1m: nn(s.r1m), r3m: nn(s.r3m), r6m: nn(s.r6m), r1y: nn(s.r1y),
        }));
        return NextResponse.json({ items, source: "kr_etp_snapshot" });
      }
    } catch {
      /* 폴백: 아래 라이브 계산 */
    }
  }

  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ items: [], error: "no_key" });

  if (!debug && cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  const now = new Date();
  const [base, w, m, m3, m6, y] = await Promise.all([
    snapshot(0, key, now),
    snapshot(OFFSETS.r1w, key, now),
    snapshot(OFFSETS.r1m, key, now),
    snapshot(OFFSETS.r3m, key, now),
    snapshot(OFFSETS.r6m, key, now),
    snapshot(OFFSETS.r1y, key, now),
  ]);

  if (debug) {
    return NextResponse.json({
      snapshots: {
        base: { basDd: base.basDd, n: base.rows.length },
        r1w: { basDd: w.basDd, n: w.rows.length },
        r1m: { basDd: m.basDd, n: m.rows.length },
        r3m: { basDd: m3.basDd, n: m3.rows.length },
        r6m: { basDd: m6.basDd, n: m6.rows.length },
        r1y: { basDd: y.basDd, n: y.rows.length },
      },
    });
  }

  const mW = closeMap(w.rows);
  const mM = closeMap(m.rows);
  const mM3 = closeMap(m3.rows);
  const mM6 = closeMap(m6.rows);
  const mY = closeMap(y.rows);

  const items = base.rows
    .map((r) => {
      const symbol = toShort(String(r.ISU_CD || ""));
      const price = num(r.TDD_CLSPRC);
      return {
        symbol,
        name: String(r.ISU_NM || "").trim(),
        price,
        changePercent: num(r.FLUC_RT),
        tradeAmount: num(r.ACC_TRDVAL),
        r1w: ret(price, mW.get(symbol)),
        r1m: ret(price, mM.get(symbol)),
        r3m: ret(price, mM3.get(symbol)),
        r6m: ret(price, mM6.get(symbol)),
        r1y: ret(price, mY.get(symbol)),
      };
    })
    .filter((x) => x.symbol && x.price > 0)
    .sort((a, b) => b.tradeAmount - a.tradeAmount)
    .slice(0, 100);

  const data = { items };
  // 1주일·1년 스냅샷이 비어 있으면(일시적 실패) 캐시하지 않음 → 다음 요청에 재계산
  if (w.rows.length > 0 && y.rows.length > 0) {
    cache = { at: Date.now(), data };
  }
  return NextResponse.json(data);
}
