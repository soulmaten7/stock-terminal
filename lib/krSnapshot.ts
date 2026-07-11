// KR 전종목 스냅샷 미리계산 → kr_stock_snapshot upsert.
// krx/ranking(현재가·거래대금 등) + kr-performance(1주~1년) 로직을 합쳐 한 번에 저장.
// 크론(/api/cron/kr-perf)이 호출. 화면 라우트는 이 테이블만 즉시 SELECT.
import { createAdminClient } from "./supabase/admin";
import { pct } from "./returns";

const BASE = "http://data-dbg.krx.co.kr/svc/apis/sto";
const EP = { kospi: `${BASE}/stk_bydd_trd`, kosdaq: `${BASE}/ksq_bydd_trd` } as const;

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
// target 이하 가장 가까운 거래일의 시장별 원본 행
async function rawForDate(target: Date, key: string): Promise<{ kospi: KrxRow[]; kosdaq: KrxRow[]; basDd: string }> {
  for (let i = 0; i < 12; i++) {
    const d = new Date(target);
    d.setDate(target.getDate() - i);
    const basDd = ymd(d);
    const [a, b] = await Promise.all([fetchOne(EP.kospi, basDd, key), fetchOne(EP.kosdaq, basDd, key)]);
    if (a.length + b.length > 0) return { kospi: a, kosdaq: b, basDd };
  }
  return { kospi: [], kosdaq: [], basDd: "" };
}
function closeMap(rows: KrxRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const sym = toShort(String(r.ISU_CD || ""));
    const close = num(r.TDD_CLSPRC);
    if (sym && close > 0) m.set(sym, close);
  }
  return m;
}
export async function computeKrSnapshot(): Promise<{ ok: true; computed: number; basDd: string }> {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) throw new Error("no KRX_API_KEY");

  const today = new Date();
  const day = 86400000;

  const base = await rawForDate(today, key);
  if (base.kospi.length + base.kosdaq.length === 0) throw new Error("krx empty");

  const [d1w, d1m, d3m, d6m, d1y] = await Promise.all([
    rawForDate(new Date(today.getTime() - 7 * day), key),
    rawForDate(new Date(today.getTime() - 30 * day), key),
    rawForDate(new Date(today.getTime() - 91 * day), key),
    rawForDate(new Date(today.getTime() - 182 * day), key),
    rawForDate(new Date(today.getTime() - 365 * day), key),
  ]);
  const m1w = closeMap([...d1w.kospi, ...d1w.kosdaq]);
  const m1m = closeMap([...d1m.kospi, ...d1m.kosdaq]);
  const m3m = closeMap([...d3m.kospi, ...d3m.kosdaq]);
  const m6m = closeMap([...d6m.kospi, ...d6m.kosdaq]);
  const m1y = closeMap([...d1y.kospi, ...d1y.kosdaq]);

  const build = (rows: KrxRow[], market: string) =>
    rows
      .map((r) => {
        const symbol = toShort(String(r.ISU_CD || ""));
        const close = num(r.TDD_CLSPRC);
        return {
          symbol,
          name: String(r.ISU_NM || "").trim(),
          market,
          price: close,
          change_percent: num(r.FLUC_RT),
          volume: num(r.ACC_TRDVOL),
          trade_amount: num(r.ACC_TRDVAL),
          market_cap: num(r.MKTCAP),
          r1w: pct(close, m1w.get(symbol)),
          r1m: pct(close, m1m.get(symbol)),
          r3m: pct(close, m3m.get(symbol)),
          r6m: pct(close, m6m.get(symbol)),
          r1y: pct(close, m1y.get(symbol)),
          bas_dd: base.basDd,
          updated_at: new Date().toISOString(),
        };
      })
      .filter((s) => s.symbol && s.price > 0);

  const payload = [...build(base.kospi, "kospi"), ...build(base.kosdaq, "kosdaq")];

  const sb = createAdminClient();
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("kr_stock_snapshot").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }
  return { ok: true, computed: payload.length, basDd: base.basDd };
}
