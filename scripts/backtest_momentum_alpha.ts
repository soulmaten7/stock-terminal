// 모멘텀 신뢰도 완성 — 거래비용(회전율) + Fama-French 팩터 알파. lib/backtest_stats 공유.
// STEP 525(월별 롱숏·t·샤프) 위에: ① 실제 회전율 → 거래비용 차감 순수익, ② French 팩터에 회귀한 알파(CAPM·FF3·FF4).
// "이 수익이 비용을 견디고, 기존 팩터(시장·규모·가치·모멘텀) 노출을 넘는 순수 초과수익이냐"를 검정.
// French 데이터는 STEP 526 명령서가 data/ff/ 에 미리 내려받음(무료). ⚠️ 생존편향 잔존은 여전(무료 데이터 한계).
// npx tsx scripts/backtest_momentum_alpha.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { momentum121 } from "../lib/momentum";
import { mean, stdev, tStat, sharpe, annualizedMean, annualizedVol, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 500;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_STOCKS = 20;
const COST_BPS = [10, 30]; // 일방 거래비용 가정(민감도) — 회전율×비용으로 순수익 차감

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

async function monthlyCloses(sym: string): Promise<Record<number, number>> {
  const ch = await yf.chart(sym, { period1: new Date("2013-01-01"), interval: "1d" });
  const last: Record<number, { t: number; c: number }> = {};
  for (const q of ch.quotes ?? []) {
    if (typeof q.close !== "number" || (q.close as number) <= 0) continue;
    const d = new Date(q.date); const k = monthKey(d); const t = d.getTime();
    if (!last[k] || t > last[k].t) last[k] = { t, c: q.close as number };
  }
  const out: Record<number, number> = {};
  for (const k in last) out[Number(k)] = last[Number(k)].c;
  return out;
}

// French CSV(월간) 로드 — data/ff/ 에서 Factors·Momentum 파일 자동 탐색. YYYYMM → monthKey.
function loadFrench(): Record<number, { mktrf: number; smb: number; hml: number; rf: number; mom?: number }> | null {
  const dir = path.join(process.cwd(), "data", "ff");
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const facF = files.find((f) => /factors/i.test(f) && /\.csv$/i.test(f));
  const momF = files.find((f) => /momentum/i.test(f) && /\.csv$/i.test(f));
  if (!facF) return null;
  const out: Record<number, { mktrf: number; smb: number; hml: number; rf: number; mom?: number }> = {};
  for (const line of fs.readFileSync(path.join(dir, facF), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d{6})\s*,(.+)$/);
    if (!m) continue;
    const ym = Number(m[1]); const yr = Math.floor(ym / 100), mo = ym % 100;
    if (mo < 1 || mo > 12) continue;
    const v = m[2].split(",").map((x) => parseFloat(x.trim()));
    if (v.length < 4 || v.some((x) => !isFinite(x))) continue;
    out[yr * 12 + (mo - 1)] = { mktrf: v[0], smb: v[1], hml: v[2], rf: v[3] };
  }
  if (momF) {
    for (const line of fs.readFileSync(path.join(dir, momF), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*(\d{6})\s*,\s*(-?\d+\.?\d*)\s*$/);
      if (!m) continue;
      const ym = Number(m[1]); const yr = Math.floor(ym / 100), mo = ym % 100;
      const key = yr * 12 + (mo - 1);
      if (out[key]) out[key].mom = parseFloat(m[2]);
    }
  }
  return Object.keys(out).length ? out : null;
}

async function run() {
  const data: Record<string, Record<number, number>> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (s) => { try { const d = await monthlyCloses(s); if (Object.keys(d).length) { data[s] = d; ok++; } } catch { /* skip */ } });

  let minM = Infinity, maxM = -Infinity;
  for (const s in data) for (const k in data[s]) { const n = Number(k); if (n < minM) minM = n; if (n > maxM) maxM = n; }

  // 매월: 형성월 m(말)에 12-1 모멘텀 3분위 → 1개월 보유(수익=달 m+1) 롱숏. 회전율 위해 분위 멤버십 보관.
  const lsSeries: { earnKey: number; ls: number }[] = [];
  const topMembers: string[][] = [], botMembers: string[][] = [];
  const hiArr: number[] = [], loArr: number[] = [];
  for (let m = minM + 12; m + 1 <= maxM; m++) {
    const obs: { sym: string; mom: number; ret: number }[] = [];
    for (const s in data) {
      const M = data[s];
      const mom = momentum121(M[m - 12] ?? null, M[m - 1] ?? null);
      const pE = M[m], pX = M[m + 1];
      if (mom == null || pE == null || pX == null || pE < 5) continue;
      obs.push({ sym: s, mom, ret: (pX / pE - 1) * 100 });
    }
    if (obs.length < MIN_STOCKS) continue;
    obs.sort((a, b) => a.mom - b.mom);
    const n = obs.length, t = Math.floor(n / 3);
    const bot = obs.slice(0, t), top = obs.slice(n - t);
    const hm = mean(top.map((o) => o.ret)), lm = mean(bot.map((o) => o.ret));
    hiArr.push(hm); loArr.push(lm);
    lsSeries.push({ earnKey: m + 1, ls: hm - lm });
    topMembers.push(top.map((o) => o.sym)); botMembers.push(bot.map((o) => o.sym));
  }

  const ls = lsSeries.map((x) => x.ls);
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  console.log(`\n[모멘텀 신뢰도 완성 · 거래비용 + French 알파]`);
  console.log(`종목 ${ok}/${UNIVERSE.length} · 유효 리밸런스 ${ls.length}개월`);
  console.log(`\n── 총수익(gross) ──`);
  console.log(`롱숏 연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}`);

  // 회전율(월평균, 일방) — 직전 분위 대비 교체 비율
  const turn = (mem: string[][]) => {
    const rates: number[] = [];
    for (let i = 1; i < mem.length; i++) {
      const prev = new Set(mem[i - 1]); const cur = mem[i];
      if (!cur.length) continue;
      const changed = cur.filter((s) => !prev.has(s)).length;
      rates.push(changed / cur.length);
    }
    return mean(rates);
  };
  const tTop = turn(topMembers), tBot = turn(botMembers), tTot = tTop + tBot;
  console.log(`\n── 거래비용(회전율) ──`);
  console.log(`월평균 일방 회전율: 롱 ${pct(tTop * 100)} · 숏 ${pct(tBot * 100)} · 합 ${pct(tTot * 100)}`);
  for (const bps of COST_BPS) {
    const dragAnn = tTot * (bps / 100) * 12; // 월 회전율×비용(%)×12
    console.log(`순수익 @${bps}bps(일방): 연 ${pct(annualizedMean(ls) - dragAnn)} (비용 −${dragAnn.toFixed(2)}%/년)`);
  }

  // French 알파
  const ff = loadFrench();
  if (!ff) {
    console.log(`\n── French 알파 ── data/ff/ CSV 없음 → 건너뜀(STEP 526 명령서로 내려받기).`);
  } else {
    const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [], mom: number[] = [];
    let haveMom = true;
    for (const row of lsSeries) {
      const f = ff[row.earnKey];
      if (!f) continue;
      y.push(row.ls); mkt.push(f.mktrf); smb.push(f.smb); hml.push(f.hml);
      if (f.mom == null) haveMom = false; else mom.push(f.mom);
    }
    console.log(`\n── 팩터 알파(월 회귀, 정렬 ${y.length}개월) ── 알파=기존 팩터 넘는 초과수익(연율·t값)`);
    const capm = ols(y, [mkt]);
    console.log(`CAPM  알파 ${pct(capm.coef[0] * 12)} · t=${num(capm.t[0])}  | βMkt ${num(capm.coef[1])}`);
    const ff3 = ols(y, [mkt, smb, hml]);
    console.log(`FF3   알파 ${pct(ff3.coef[0] * 12)} · t=${num(ff3.t[0])}  | βMkt ${num(ff3.coef[1])} βSMB ${num(ff3.coef[2])} βHML ${num(ff3.coef[3])}`);
    if (haveMom && mom.length === y.length) {
      const ff4 = ols(y, [mkt, smb, hml, mom]);
      console.log(`FF4(+Mom) 알파 ${pct(ff4.coef[0] * 12)} · t=${num(ff4.t[0])}  | βMom ${num(ff4.coef[4])}  ← βMom↑·알파↓면 "우리 모멘텀=학계 모멘텀"(정상)`);
    }
  }

  console.log(`\n※ 생존편향 잔존(현존 종목만)·표본 N=${N}·동일가중. gross는 부풀려짐 — net·알파가 실질. 논문급 '방법론'이지 CRSP급 '데이터'는 아님.`);
}
run();
