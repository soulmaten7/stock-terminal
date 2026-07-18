// 중화권(홍콩·상해·심천·ETF) 1주~6개월 수익률 백그라운드 미리계산 → cn_stock_perf 테이블 일괄 저장.
// cn-list가 이 값을 조인해 내려줌(요청 시점 lazy chart 호출 제거). 크론(/api/cron/cn-perf)이 하루 1회 호출.
// jpPerf.ts와 동일 규칙(상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작).
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/cn_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/cn_symbols.json: [{ sym, name, market }] — 전 종목(홍콩·상해·심천·ETF) 대상
type Sym = { sym: string; name: string; market: string };
const ALL_SYMS: string[] = (symbols as Sym[]).map((s) => s.sym);

// daysAgo 거래일 전 종가 대비 수익률(%)
function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

// 동시 호출 제한 — 야후 레이트리밋/타임아웃 방지
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) {
      const cur = idx++;
      out[cur] = await fn(arr[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

// 외부 콜 공통 타임아웃 — 예산 가드(budgetLeft)는 '새 작업 픽'만 막고
// 진행 중인 await는 못 끊는다 → hang 콜 하나가 레인을 잠가 300초 하드리밋행.
// 모든 외부 콜은 개별 타임아웃 필수(STEP 750b).
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

// A주(.SS/.SZ) 일봉 종가+거래대금 — 東方財富(Eastmoney) 무료 kline. Yahoo가 A주 과거시세(chart)를 400으로 차단해 대체.
// secid: 1.=상해(.SS) / 0.=심천(.SZ). klt=101 일봉, fqt=1 전복권.
// fields2=f51(날짜),f53(종가),f57(거래대금·원 단위).
async function eastmoneyBars(secid: string): Promise<{ closes: number[]; lastAmount: number | null }> {
  try {
    const url =
      `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}` +
      `&fields1=f1&fields2=f51,f53,f57&klt=101&fqt=1&end=20500101&lmt=420`;  // 400일 캘린더 ≈ 276거래일 커버
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" },
      signal: AbortSignal.timeout(5000), // STEP 750: hang 소스가 예산을 태우는 속도 축소
    });
    if (!res.ok) return { closes: [], lastAmount: null };
    const j = (await res.json()) as { data?: { klines?: string[] } };
    const klines = j.data?.klines ?? [];
    const closes = klines
      .map((k) => parseFloat(k.split(",")[1]))
      .filter((c) => isFinite(c) && c > 0);
    const lastK = klines[klines.length - 1];
    const rawAmt = lastK ? parseFloat(lastK.split(",")[2]) : NaN;
    return {
      closes,
      lastAmount: isFinite(rawAmt) && rawAmt > 0 ? rawAmt : null,
    };
  } catch {
    return { closes: [], lastAmount: null };
  }
}

type PerfRow = { symbol: string; r1d: number | null; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null; price: number | null; amount: number | null; r1y: number | null };

export async function computeCnPerf(): Promise<{ ok: true; computed: number; attempted: number; slice: string; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const LOOKBACK_DAYS = 400; // 252거래일(1년) 확보용 — 400 캘린더일 ≈ 276 거래일
  const period1 = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // ── STEP 750: 하루 1방(7,098·300초 초과 상습) → 3시간 8분할 슬라이스 ──
  // 파티션 = 실행 시각 기반 결정론(상태 저장 없음). 크론이 늦게 떠도(Vercel 지연) 가장 가까운 슬롯으로 스냅.
  // 하루 8회 × ~890종목 = 전 유니버스 일일 커버. 부분 실패는 그 슬라이스만 다음날 재시도.
  const SLOTS = 8; // vercel.json: 0,3,6,9,12,15,18,21시(UTC)
  const slot = Math.round(new Date().getUTCHours() / 3) % SLOTS;
  const target = ALL_SYMS.filter((_, i) => i % SLOTS === slot);

  // 시간 예산 — 소스가 hang이어도 함수 전체가 죽지 않게. 예산 소진 시 새 심볼을 집지 않고 걷은 것만 저장.
  const startedAt = Date.now();
  const TIME_BUDGET_MS = 220_000; // maxDuration 300초 대비 upsert 여유
  const budgetLeft = () => Date.now() - startedAt < TIME_BUDGET_MS;

  const results = await mapLimit(target, 12, async (sym): Promise<PerfRow | null> => {
    if (!budgetLeft()) return null; // 예산 소진 — 스킵(다음 슬롯/다음날 재시도)
    try {
      let closes: number[];
      let lastVol: number | null = null;
      let eastAmt: number | null = null;

      if (sym.endsWith(".HK")) {
        // 홍콩·ETF → Yahoo chart (정상 동작)
        const ch = await withTimeout(yf.chart(sym, { period1, interval: "1d" }), 5000);
        const bars = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
        closes = bars
          .map((b) => b.close)
          .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
        lastVol = bars[bars.length - 1]?.volume ?? null;
      } else {
        // 상해(.SS)·심천(.SZ) A주 → 東方財富 kline (Yahoo 차단 대체)
        const code = sym.replace(/\.(SS|SZ)$/, "");
        const secid = (sym.endsWith(".SS") ? "1." : "0.") + code;
        const res = await eastmoneyBars(secid);
        closes = res.closes;
        eastAmt = res.lastAmount;
      }
      if (closes.length < 6) return null; // 1주(5거래일)도 못 채우면 스킵
      const price = closes[closes.length - 1];
      const amount =
        eastAmt != null
          ? eastAmt
          : lastVol != null && lastVol > 0
          ? price * lastVol
          : null;
      return {
        symbol: sym,
        r1d: ret(closes, 1),
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        price,
        amount,
      };
    } catch {
      return null;
    }
  });

  const rows = results.filter((r): r is PerfRow => r !== null);
  const at = new Date().toISOString();
  const payload = rows.map((r) => ({ ...r, updated_at: at }));

  const sb = createAdminClient(); // RLS 우회(쓰기)
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("cn_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, attempted: target.length, slice: `${slot + 1}/${SLOTS}`, at };
}
