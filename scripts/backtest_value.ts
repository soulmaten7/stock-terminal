// 밸류(가치) 팩터 다년 백테스트 — SEC EDGAR(深재무) + 야후(深가격). lib/edgar 재사용.
// 지표: E/P(순이익/시총, =1/PER)·B/M(자기자본/시총, =1/PBR, Fama-French 정통 가치팩터 HML).
// point-in-time: fy=Y 재무 → 다음해 6월말 진입(보고지연 반영) → 1년 보유. 시총=진입가×fy=Y 주식수.
// 3분위: 상위=싼주(고 E/P·고 B/M=value) / 하위=비싼주(glamour). spread=싼−비쌈>0이면 가치 프리미엄.
// ⚠️ F-Score와 달리 은행·보험 제외 안 함 — 밸류는 금융주에도 적용(같은 데이터, 다른 시각: 플레이북 §0-7).
// npx tsx scripts/backtest_value.ts
import YahooFinance from "yahoo-finance2";
import { edgarRows } from "../lib/edgar";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// 넓은 유니버스: us_symbols(주식)에서 고루 ~250 표본(대형+중형+소형). 대형주 편향 제거.
type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 250;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);

const COHORTS = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const HOLD_DAYS = 365;
const MIN_STOCKS = 12; // 코호트당 최소 종목수(3분위 의미 있으려면)

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
function priceOnOrAfter(q: { date: Date; close: number }[], t: Date): number | null {
  for (const p of q) if (p.date.getTime() >= t.getTime() && p.close > 0) return p.close;
  return null;
}

// 코호트별 관측치(지표값 + 이후 수익률). E/P·B/M 별도 랭킹.
type Obs = { v: number; fwd: number };
const epByYear: Record<number, Obs[]> = {};
const bmByYear: Record<number, Obs[]> = {};
for (const y of COHORTS) { epByYear[y] = []; bmByYear[y] = []; }
let tickersOk = 0, epObsN = 0, bmObsN = 0;
// 데이터 커버리지 진단(부족 원인 추적용)
let noEdgar = 0, noEquityAny = 0, noNIAny = 0, noSharesAny = 0;

async function run() {
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try {
      const rows = await edgarRows(sym);
      if (rows.length < 1) { noEdgar++; return; }
      tickersOk++;
      const hasEq = rows.some((r) => r.stockholdersEquity != null);
      const hasNI = rows.some((r) => r.netIncome != null);
      const hasSh = rows.some((r) => r.ordinarySharesNumber != null);
      if (!hasEq) noEquityAny++;
      if (!hasNI) noNIAny++;
      if (!hasSh) noSharesAny++;

      const ch = await yf.chart(sym, { period1: new Date("2010-06-01"), interval: "1d" });
      const q = (ch.quotes ?? [])
        .filter((x) => typeof x.close === "number" && (x.close as number) > 0)
        .map((x) => ({ date: new Date(x.date), close: x.close as number }));
      if (!q.length) return;

      for (const Y of COHORTS) {
        const cur = rows.find((r) => r.fy === Y);
        if (!cur) continue;
        const shares = cur.ordinarySharesNumber;
        if (shares == null || shares <= 0) continue;

        const entry = new Date(Y + 1, 5, 30); // fy=Y 보고 후(다음해 6월말) 진입 → 미래훔쳐보기 방지
        const exit = new Date(entry.getTime() + HOLD_DAYS * 864e5);
        const pE = priceOnOrAfter(q, entry), pX = priceOnOrAfter(q, exit);
        if (pE == null || pX == null || pE < 5) continue; // $5+ = 유동성 프록시(다른 기법과 동일 틀)
        const mktcap = pE * shares;
        if (!(mktcap > 0)) continue;
        const fwd = (pX / pE - 1) * 100;

        // E/P (순이익/시총) — 음수(적자)면 랭킹 하단(비쌈/glamour)으로 자연 정렬. 정통 가치지표.
        if (cur.netIncome != null) { epByYear[Y].push({ v: cur.netIncome / mktcap, fwd }); epObsN++; }
        // B/M (자기자본/시총) — 음수 자기자본은 의미없어 제외. Fama-French HML 정통.
        if (cur.stockholdersEquity != null && cur.stockholdersEquity > 0) { bmByYear[Y].push({ v: cur.stockholdersEquity / mktcap, fwd }); bmObsN++; }
      }
    } catch { /* skip */ }
  });

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const fmt = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + v.toFixed(1) + "%");
  const diff = (a: number | null, b: number | null) => (a == null || b == null ? null : a - b);

  // 지표별 리포트: 코호트마다 3분위(싼/중/비쌈) → pooled. 싼=지표 상위(고 E/P·B/M).
  function report(label: string, byYear: Record<number, Obs[]>) {
    const CHEAP: number[] = [], MID: number[] = [], EXP: number[] = [];
    console.log(`\n=== ${label} — 3분위 이후 12개월 수익률 (싼=${label} 상위 = value) ===`);
    console.log("cohort | 싼(n) | 중(n) | 비쌈(n) | spread(싼−비쌈)");
    for (const y of COHORTS) {
      const obs = byYear[y].slice().sort((a, b) => a.v - b.v); // 오름차순: 앞=저지표(비쌈), 뒤=고지표(싼)
      if (obs.length < MIN_STOCKS) { console.log(`${y} | (표본부족 n=${obs.length})`); continue; }
      const n = obs.length, t = Math.floor(n / 3);
      const exp = obs.slice(0, t).map((o) => o.fwd);        // 하위=저 E/P·B/M=비쌈
      const cheap = obs.slice(n - t).map((o) => o.fwd);     // 상위=고 E/P·B/M=싼
      const mid = obs.slice(t, n - t).map((o) => o.fwd);
      CHEAP.push(...cheap); MID.push(...mid); EXP.push(...exp);
      console.log(`${y} | ${fmt(avg(cheap))} (${cheap.length}) | ${fmt(avg(mid))} (${mid.length}) | ${fmt(avg(exp))} (${exp.length}) | ${fmt(diff(avg(cheap), avg(exp)))}`);
    }
    console.log(`POOLED ${label} | 싼 ${fmt(avg(CHEAP))} (${CHEAP.length}) | 중 ${fmt(avg(MID))} (${MID.length}) | 비쌈 ${fmt(avg(EXP))} (${EXP.length}) | spread(싼−비쌈) ${fmt(diff(avg(CHEAP), avg(EXP)))}`);
  }

  console.log(`\n[데이터 커버리지] 종목 EDGAR성공 ${tickersOk}/${UNIVERSE.length} · EDGAR無 ${noEdgar} · 자기자본태그無 ${noEquityAny} · 순이익無 ${noNIAny} · 주식수無 ${noSharesAny}`);
  console.log(`[관측치] E/P ${epObsN}건 · B/M ${bmObsN}건 ($5+·시총계산가능만)`);
  report("E/P(1/PER)", epByYear);
  report("B/M(1/PBR)", bmByYear);
  console.log("\n※ 생존편향·표본~250·과거≠미래. 가치 프리미엄은 국면따라 장기 침체구간 있음(예: 2017~2020 성장주 우위). 방향성 참고용.");
}
run();
