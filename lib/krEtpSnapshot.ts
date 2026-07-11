// KR ETF·ETN 성과 스냅샷 미리계산 → kr_etp_snapshot upsert.
// 크론(/api/cron/kr-etp)이 호출. 화면 라우트(etf/etn-performance)는 이 테이블만 SELECT.
// 라이브 fetch(요청마다 최대 36콜)의 부분실패·느림(콜드 2.8s) 회피 — 종목보드(krSnapshot)와 동일 패턴.
// 수익률 계산은 검증된 순수함수 pct(lib/returns) 재사용(엔진=검증 일치). 동시요청 대신 순차(throttle 회피).
import { createAdminClient } from "./supabase/admin";
import { pct } from "./returns";

const EP = {
  etf: "http://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd",
  etn: "http://data-dbg.krx.co.kr/svc/apis/etp/etn_bydd_trd",
} as const;

type KrxRow = Record<string, string>;
type Kind = "etf" | "etn";

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
async function fetchDay(ep: string, basDd: string, key: string): Promise<KrxRow[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${ep}?basDd=${basDd}`, {
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
    await new Promise((r) => setTimeout(r, 300));
  }
  return [];
}
// target 이하 가장 가까운 거래일(최대 12일 역추적). 순차 호출로 동시요청 throttle 회피.
async function snapshot(ep: string, daysAgo: number, key: string, now: Date): Promise<KrxRow[]> {
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo - i);
    const rows = await fetchDay(ep, ymd(d), key);
    if (rows.length > 0) return rows;
  }
  return [];
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

const OFFSETS = [7, 30, 91, 182, 365];

async function buildKind(kind: Kind, key: string, now: Date) {
  const ep = EP[kind];
  const base = await snapshot(ep, 0, key, now);
  if (base.length === 0) return [];
  // 과거 5기간(1주·1개월·3개월·6개월·1년) 순차 — 동시요청 회피(부분실패 원인 제거).
  const maps: Map<string, number>[] = [];
  for (const off of OFFSETS) maps.push(closeMap(await snapshot(ep, off, key, now)));
  const [mW, mM, mM3, mM6, mY] = maps;
  return base
    .map((r) => {
      const symbol = toShort(String(r.ISU_CD || ""));
      const price = num(r.TDD_CLSPRC);
      return {
        symbol,
        kind,
        name: String(r.ISU_NM || "").trim(),
        price,
        change_percent: num(r.FLUC_RT),
        trade_amount: num(r.ACC_TRDVAL),
        r1w: pct(price, mW.get(symbol)),
        r1m: pct(price, mM.get(symbol)),
        r3m: pct(price, mM3.get(symbol)),
        r6m: pct(price, mM6.get(symbol)),
        r1y: pct(price, mY.get(symbol)),
        updated_at: new Date().toISOString(),
      };
    })
    .filter((x) => x.symbol && x.price > 0);
}

export async function computeKrEtpSnapshot(): Promise<{ ok: true; etf: number; etn: number }> {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) throw new Error("no KRX_API_KEY");
  const now = new Date();
  const etf = await buildKind("etf", key, now);
  const etn = await buildKind("etn", key, now);
  const payload = [...etf, ...etn];
  if (payload.length === 0) throw new Error("krx etp empty");

  const sb = createAdminClient();
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("kr_etp_snapshot").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }
  return { ok: true, etf: etf.length, etn: etn.length };
}
