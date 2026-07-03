// 주주환원(Shareholder Yield) 팩터 백테스트 — (배당 + 자사주매입[−발행]) / 시가총액. Meb Faber 2013.
// 고환원(고 yield)이 저환원 대비 이후 우위인지. 연1회(6월) 형성 → 7월~다음6월 월별 롱숏(고−저). point-in-time·$5+.
// ⚠️ 새 데이터: EDGAR 현금흐름표 배당지급·자사주매입·주식발행 태그를 자체 추출(검증 통과 시 lib/edgar.ts로 승격).
//    은행 제외 안 함(배당·자사주는 금융주도 유효 → 퀄리티보다 커버리지 넓음). French는 data/ff 재사용.
// 핵심 검증: 주주환원은 가치(HML)와 상관 → FF3 알파(HML 조정 후)가 살아있어야 "독립 프리미엄". 죽으면 "가치의 재포장".
// npx tsx scripts/backtest_shyield_rigor.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { mean, tStat, sharpe, annualizedMean, annualizedVol, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 400;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_STOCKS = 20;
const COHORTS: number[] = []; for (let y = 2010; y <= 2023; y++) COHORTS.push(y);

// --- EDGAR 자체 추출 (검증용·자급형: production 미변경) ---
const CF_TAGS: Record<string, string[]> = {
  div: ["PaymentsOfDividendsCommonStock", "PaymentsOfDividends"], // 배당지급(현금흐름·유출 양수). 보통주 우선, 없으면 총배당
  repo: ["PaymentsForRepurchaseOfCommonStock", "PaymentsForRepurchaseOfEquity"], // 자사주매입
  issue: ["ProceedsFromIssuanceOfCommonStock"], // 신주발행(순환원 계산 시 차감)
  shares: ["CommonStockSharesOutstanding", "WeightedAverageNumberOfDilutedSharesOutstanding", "WeightedAverageNumberOfSharesOutstandingBasic"],
};
type FactEntry = { form?: string; fp?: string; fy?: number; filed?: string; val: number };
let _cik: Record<string, string> | null = null;
async function cikFor(t: string): Promise<string | null> {
  if (!_cik) {
    const tj = (await (await fetch("https://www.sec.gov/files/company_tickers.json", { headers: UA })).json()) as Record<string, { cik_str: number; ticker: string }>;
    _cik = {}; for (const k in tj) _cik[String(tj[k].ticker).toUpperCase()] = String(tj[k].cik_str).padStart(10, "0");
  }
  return _cik[t.toUpperCase()] ?? null;
}
function annualByFY(facts: Record<string, Record<string, { units?: Record<string, FactEntry[]> }>>, tags: string[]): Record<number, number> | null {
  const ns = facts["us-gaap"] || {};
  for (const tag of tags) {
    const node = ns[tag]; if (!node || !node.units) continue;
    const arr = node.units.USD || node.units.shares || Object.values(node.units)[0] || [];
    const byFy: Record<number, FactEntry> = {};
    for (const e of arr) if (e.form && String(e.form).startsWith("10-K") && e.fp === "FY" && e.fy) { const p = byFy[e.fy]; if (!p || String(e.filed) > String(p.filed)) byFy[e.fy] = e; }
    const fys = Object.keys(byFy);
    if (fys.length) { const o: Record<number, number> = {}; for (const fy of fys) o[Number(fy)] = byFy[Number(fy)].val; return o; }
  }
  return null;
}
type ShyFund = { div: number; repo: number; issue: number; shares: number | null };
async function edgarShy(ticker: string): Promise<Record<number, ShyFund> | null> {
  const cik = await cikFor(ticker); if (!cik) return null;
  let cf: { facts?: Record<string, Record<string, { units?: Record<string, FactEntry[]> }>> };
  try { cf = (await (await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: UA })).json()) as typeof cf; } catch { return null; }
  const facts = cf.facts || {};
  const div = annualByFY(facts, CF_TAGS.div), repo = annualByFY(facts, CF_TAGS.repo), issue = annualByFY(facts, CF_TAGS.issue), sh = annualByFY(facts, CF_TAGS.shares);
  const years = [...new Set([div, repo, issue, sh].filter(Boolean).flatMap((m) => Object.keys(m as Record<number, number>).map(Number)))];
  if (!years.length) return null;
  const out: Record<number, ShyFund> = {};
  for (const fy of years) out[fy] = { div: div?.[fy] ?? 0, repo: repo?.[fy] ?? 0, issue: issue?.[fy] ?? 0, shares: sh?.[fy] ?? null };
  return out;
}

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0; async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
async function monthlyCloses(sym: string): Promise<Record<number, number>> {
  const ch = await yf.chart(sym, { period1: new Date("2010-01-01"), interval: "1d" });
  const last: Record<number, { t: number; c: number }> = {};
  for (const q of ch.quotes ?? []) { if (typeof q.close !== "number" || (q.close as number) <= 0) continue; const d = new Date(q.date); const k = monthKey(d); const t = d.getTime(); if (!last[k] || t > last[k].t) last[k] = { t, c: q.close as number }; }
  const out: Record<number, number> = {}; for (const k in last) out[Number(k)] = last[Number(k)].c; return out;
}
function loadFrench(): Record<number, { mktrf: number; smb: number; hml: number; rf: number }> | null {
  const dir = path.join(process.cwd(), "data", "ff"); if (!fs.existsSync(dir)) return null;
  const facF = fs.readdirSync(dir).find((f) => /factors/i.test(f) && /\.csv$/i.test(f)); if (!facF) return null;
  const out: Record<number, { mktrf: number; smb: number; hml: number; rf: number }> = {};
  for (const line of fs.readFileSync(path.join(dir, facF), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d{6})\s*,(.+)$/); if (!m) continue;
    const ym = Number(m[1]); const yr = Math.floor(ym / 100), mo = ym % 100; if (mo < 1 || mo > 12) continue;
    const v = m[2].split(",").map((x) => parseFloat(x.trim())); if (v.length < 4 || v.some((x) => !isFinite(x))) continue;
    out[yr * 12 + (mo - 1)] = { mktrf: v[0], smb: v[1], hml: v[2], rf: v[3] };
  }
  return Object.keys(out).length ? out : null;
}

async function run() {
  const data: Record<string, { fund: Record<number, ShyFund>; mc: Record<number, number> }> = {};
  let ok = 0, withDiv = 0, withRepo = 0;
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try {
      const fund = await edgarShy(sym); if (!fund) return;
      const mc = await monthlyCloses(sym); if (!Object.keys(mc).length) return;
      data[sym] = { fund, mc }; ok++;
      if (Object.values(fund).some((f) => f.div > 0)) withDiv++;
      if (Object.values(fund).some((f) => f.repo > 0)) withRepo++;
    } catch { /* skip */ }
  });

  const legRet = (syms: string[], h: number): number | null => {
    const rs: number[] = [];
    for (const s of syms) { const a = data[s]?.mc[h - 1], b = data[s]?.mc[h]; if (a != null && b != null && a > 0) rs.push((b / a - 1) * 100); }
    return rs.length ? mean(rs) : null;
  };

  const grossLS: Record<number, number> = {}, netLS: Record<number, number> = {};
  const grossTurn: number[] = []; let prevGH: Set<string> | null = null, prevGL: Set<string> | null = null;

  for (const Y of COHORTS) {
    const f = (Y + 1) * 12 + 5; // Y+1년 6월(FY Y 재무는 그해 공시 완료)
    const cand: { sym: string; gross: number | null; net: number | null }[] = [];
    for (const s in data) {
      const fu = data[s].fund[Y]; if (!fu) continue;
      const pF = data[s].mc[f]; if (pF == null || pF < 5) continue;
      if (fu.shares == null || fu.shares <= 0) continue;
      const mcap = pF * fu.shares; if (!(mcap > 0)) continue;
      const gross = (fu.div + fu.repo) / mcap;         // 총주주환원 = (배당+자사주)/시총
      const net = (fu.div + fu.repo - fu.issue) / mcap; // 순환원 = 발행 차감
      cand.push({ sym: s, gross, net });
    }
    const holdMonths = Array.from({ length: 12 }, (_, i) => f + 1 + i);

    const doMetric = (key: "gross" | "net", store: Record<number, number>, prevH: Set<string> | null, prevL: Set<string> | null, turnH: number[]): [Set<string> | null, Set<string> | null] => {
      const arr = cand.filter((c) => c[key] != null).sort((a, b) => (a[key] as number) - (b[key] as number)); // 오름차순: 앞=저환원
      if (arr.length < MIN_STOCKS) return [prevH, prevL];
      const t = Math.floor(arr.length / 3);
      const lowSyms = arr.slice(0, t).map((c) => c.sym);            // 저환원(SHORT)
      const highSyms = arr.slice(arr.length - t).map((c) => c.sym); // 고환원(LONG)
      if (prevH) turnH.push(highSyms.filter((s) => !prevH.has(s)).length / highSyms.length);
      for (const h of holdMonths) { const hr = legRet(highSyms, h), lr = legRet(lowSyms, h); if (hr != null && lr != null) store[h] = hr - lr; }
      return [new Set(highSyms), new Set(lowSyms)];
    };
    [prevGH, prevGL] = doMetric("gross", grossLS, prevGH, prevGL, grossTurn);
    doMetric("net", netLS, null, null, []);
  }

  const ff = loadFrench();
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  const report = (label: string, store: Record<number, number>, turn?: number[]) => {
    const keys = Object.keys(store).map(Number).sort((a, b) => a - b);
    const ls = keys.map((k) => store[k]);
    console.log(`\n=== ${label} · 월별 롱숏(고−저 환원) ${ls.length}개월 ===`);
    console.log(`연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}`);
    if (turn && turn.length) console.log(`연 회전율(고 leg) ${pct(mean(turn) * 100)} · 순수익@30bps 연 ${pct(annualizedMean(ls) - mean(turn) * 2 * 0.30)}`);
    if (ff) {
      const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
      for (const k of keys) { const fac = ff[k]; if (!fac) continue; y.push(store[k]); mkt.push(fac.mktrf); smb.push(fac.smb); hml.push(fac.hml); }
      const capm = ols(y, [mkt]); const ff3 = ols(y, [mkt, smb, hml]);
      console.log(`CAPM 알파 ${pct(capm.coef[0] * 12)} · t=${num(capm.t[0])}`);
      console.log(`FF3  알파 ${pct(ff3.coef[0] * 12)} · t=${num(ff3.t[0])} | βMkt ${num(ff3.coef[1])} βSMB ${num(ff3.coef[2])} βHML ${num(ff3.coef[3])}`);
    }
  };

  console.log(`\n[주주환원 신뢰도 · 연형성/월수익 롱숏]`);
  console.log(`종목 ${ok}/${UNIVERSE.length}(EDGAR+가격) · 배당지급 태그 ${withDiv} · 자사주 태그 ${withRepo} · 코호트 ${COHORTS[0]}~${COHORTS[COHORTS.length - 1]}`);
  report("총주주환원 (배당+자사주)/시총", grossLS, grossTurn);
  report("순주주환원 (−발행)", netLS);
  console.log(`\n※ 핵심: FF3 알파(HML 조정 후) 살면=독립 프리미엄 / 죽으면=가치 재포장. 생존편향·동일가중 → 수준 과대(방향·유의만). 은행 제외 안 함.`);
}
run();
