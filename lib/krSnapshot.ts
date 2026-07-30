// KR 전종목 스냅샷 미리계산 → kr_stock_snapshot upsert.
// krx/ranking(현재가·거래대금 등) + kr-performance(1주~1년) 로직을 합쳐 한 번에 저장.
// 크론(/api/cron/kr-perf)이 호출. 화면 라우트는 이 테이블만 즉시 SELECT.
import { createAdminClient } from "./supabase/admin";
import { pct } from "./returns";
import { krYahooSuffix } from "./activeMarkets";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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
// YYYYMMDD → Date (로컬). 유효하지 않으면 null.
function parseYmd(s: string): Date | null {
  if (!/^\d{8}$/.test(s)) return null;
  const y = +s.slice(0, 4), m = +s.slice(4, 6), d = +s.slice(6, 8);
  const dt = new Date(y, m - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}
// target 이하 가장 가까운 거래일의 시장별 원본 행.
// STEP 803 §7: 자매 파일 krEtpSnapshot과 동일하게 '유효 종가(TDD_CLSPRC>0)가 하나라도 있는 날'만 거래일로 채택.
//   KRX가 휴장일에 목록만(종가 0) 반환하면 그 날을 잘못 채택해 기간 수익률이 전부 null이 되던 문제 방지.
async function rawForDate(target: Date, key: string): Promise<{ kospi: KrxRow[]; kosdaq: KrxRow[]; basDd: string }> {
  for (let i = 0; i < 12; i++) {
    const d = new Date(target);
    d.setDate(target.getDate() - i);
    const basDd = ymd(d);
    const [a, b] = await Promise.all([fetchOne(EP.kospi, basDd, key), fetchOne(EP.kosdaq, basDd, key)]);
    if ([...a, ...b].some((r) => num(r.TDD_CLSPRC) > 0)) return { kospi: a, kosdaq: b, basDd };
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
export async function computeKrSnapshot(): Promise<{ ok: true; computed: number; basDd: string; nameEnFilled: number }> {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) throw new Error("no KRX_API_KEY");

  const today = new Date();
  const day = 86400000;

  const base = await rawForDate(today, key);
  if (base.kospi.length + base.kosdaq.length === 0) throw new Error("krx empty");

  // STEP 803 §7: 기간 역산 기준은 today가 아니라 실제 최신 거래일(base.basDd).
  //   크론이 밀려 today가 실제 거래일보다 앞서면 1주/1개월/…이 어긋나므로 base 기준으로 정렬.
  const baseDate = parseYmd(base.basDd) ?? today;
  const [d1w, d1m, d3m, d6m, d1y] = await Promise.all([
    rawForDate(new Date(baseDate.getTime() - 7 * day), key),
    rawForDate(new Date(baseDate.getTime() - 30 * day), key),
    rawForDate(new Date(baseDate.getTime() - 91 * day), key),
    rawForDate(new Date(baseDate.getTime() - 182 * day), key),
    rawForDate(new Date(baseDate.getTime() - 365 * day), key),
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
  // 증분 name_en — 실패해도 스냅샷 성공을 막지 않는다(비차단).
  let nameEnFilled = 0;
  try {
    nameEnFilled = await enrichMissingNameEn(sb);
  } catch {
    /* 야후 장애 시 스킵 — 다음날 재시도 */
  }
  return { ok: true, computed: payload.length, basDd: base.basDd, nameEnFilled };
}

// name_en IS NULL인 종목만 야후 longName/shortName으로 채움 (증분 · 기존값 절대 불변).
// 매일 kr-perf 크론이 스냅샷 upsert 후 호출 — 신규 상장이 다음날 자동으로 영문명 획득.
// 백필은 scripts/enrich_kr_names.ts로 완료(2766/2772) — 이 함수는 정상운영(신규분)만 담당.
export async function enrichMissingNameEn(
  sb: ReturnType<typeof createAdminClient>
): Promise<number> {
  const { data } = await sb
    .from("kr_stock_snapshot")
    .select("symbol, market")
    .is("name_en", null)
    .range(0, 999); // 증분 대상은 보통 한 자릿수 — 1000이면 충분(전종목 백필 아님)
  const list = (data ?? []) as { symbol: string; market: string }[];
  if (list.length === 0) return 0;

  const ysym = (r: { symbol: string; market: string }) => r.symbol + krYahooSuffix(r.market); // 공용 헬퍼(STEP 836 §1)
  const codeByY = new Map(list.map((r) => [ysym(r), r.symbol]));
  const yss = [...codeByY.keys()];

  let saved = 0;
  for (let i = 0; i < yss.length; i += 100) {
    const grp = yss.slice(i, i + 100);
    try {
      const qs = (await yf.quote(grp)) as Array<{
        symbol?: string;
        longName?: string;
        shortName?: string;
      }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const code = codeByY.get(q.symbol ?? "");
        const en = (q.longName || q.shortName || "").trim();
        if (!code || !en) continue;
        // .is("name_en", null) 이중 가드 — 기존값은 어떤 경우에도 안 덮는다.
        const { error } = await sb
          .from("kr_stock_snapshot")
          .update({ name_en: en })
          .eq("symbol", code)
          .is("name_en", null);
        if (!error) saved++;
      }
    } catch {
      /* 청크 실패 스킵 — 다음날 크론이 자연 재시도 */
    }
  }
  return saved;
}
