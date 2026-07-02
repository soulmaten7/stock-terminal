// 데이터 감사(diagnostic) — 재검증 전에 "데이터가 충분·정확히 뽑히나"를 넓은 표본으로 측정.
// 실제 어댑터(lib/edgar, lib/fscore) + 야후를 그대로 써서 소형·중형주까지 커버리지/완전성 확인. 변경 없음, 리포트만.
// npx tsx scripts/audit_data.ts
import YahooFinance from "yahoo-finance2";
import { edgarRows } from "../lib/edgar";
import { computeFScore } from "../lib/fscore";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
type Sym = { sym: string; name: string; type: string };

// 넓은 표본: us_symbols(주식)에서 고루 ~120 + 정확성 대조용 초대형주 몇 개 강제 포함.
const stocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const stepN = Math.max(1, Math.floor(stocks.length / 120));
const broad = stocks.filter((_, i) => i % stepN === 0).slice(0, 120);
const FORCE = ["AAPL", "JNJ", "KO"];
const SAMPLE = [...new Set([...FORCE, ...broad])];

const FIELDS = ["totalRevenue", "grossProfit", "netIncome", "totalAssets", "currentAssets", "currentLiabilities", "longTermDebt", "operatingCashFlow", "ordinarySharesNumber"] as const;

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}

let priceGe5y = 0, priceAny = 0;
// 실패 원인 분류: 금융(분류BS 없음=구조상 미적용) / 태그갭(매출·원가 못 뽑음) / 연수부족 / 백테스트가능
const cat = { noEdgar: 0, financial: 0, tagGap: 0, fewYears: 0, backtestable: 0 };
let edgarAny = 0, edgarBacktestable = 0, edgarRowsTotal = 0;
const fieldPop: Record<string, number> = {}; FIELDS.forEach((f) => (fieldPop[f] = 0));
let fieldDenom = 0;
const spot: string[] = [];

async function run() {
  await mapLimit(SAMPLE, 4, async (s) => {
    // 가격(모멘텀·저변동용)
    try {
      const ch = await yf.chart(s, { period1: new Date("2010-01-01"), interval: "1d" });
      const q = (ch.quotes ?? []).filter((x) => typeof x.close === "number" && (x.close as number) > 0);
      if (q.length > 0) priceAny++;
      if (q.length >= 252 * 5) priceGe5y++;
    } catch { /* skip */ }
    // 재무(F-Score용) — 실제 EDGAR 어댑터
    try {
      const rows = await edgarRows(s);
      if (rows.length) { edgarAny++; edgarRowsTotal += rows.length; }
      let bt = 0;
      for (let i = 1; i < rows.length; i++) if (computeFScore([rows[i - 1], rows[i]]).supported) bt++;
      if (bt >= 3) edgarBacktestable++;
      const latest = rows[rows.length - 1];
      if (latest) {
        fieldDenom++;
        for (const f of FIELDS) if ((latest as Record<string, unknown>)[f] != null) fieldPop[f]++;
      }
      // 실패 원인 분류
      if (!rows.length) cat.noEdgar++;
      else {
        const L = rows[rows.length - 1] as Record<string, number | null>;
        const hasCur = L.currentAssets != null && L.currentLiabilities != null;
        const hasRG = L.totalRevenue != null && L.grossProfit != null;
        if (!hasCur) cat.financial++;      // 분류 대차대조표 없음 → 금융/구조상 F-Score 미적용
        else if (!hasRG) cat.tagGap++;     // 매출·원가 태그 못 뽑음 → 데이터 갭(고칠 대상)
        else if (bt < 3) cat.fewYears++;   // 다 있는데 연수 부족
        else cat.backtestable++;
      }
      // 정확성 대조용 spot-check(강제포함 종목)
      if (FORCE.includes(s) && latest) {
        spot.push(`  ${s} FY${(latest as { fy: number }).fy}: rev=${(latest as Record<string, number | null>).totalRevenue} ni=${(latest as Record<string, number | null>).netIncome} assets=${(latest as Record<string, number | null>).totalAssets} cfo=${(latest as Record<string, number | null>).operatingCashFlow} sh=${(latest as Record<string, number | null>).ordinarySharesNumber}`);
      }
    } catch { /* skip */ }
  });

  const pc = (n: number, d: number) => (d ? ((n / d) * 100).toFixed(0) + "%" : "n/a");
  console.log(`\n=== 데이터 감사 (표본 ${SAMPLE.length}종목, us_symbols에서 고루) ===`);
  console.log(`가격: 데이터 있음 ${priceAny} · 5년+ ${priceGe5y} (${pc(priceGe5y, SAMPLE.length)}) → 모멘텀·저변동 백테스트 가능 표본`);
  console.log(`EDGAR: 재무 있음 ${edgarAny} (${pc(edgarAny, SAMPLE.length)}) · 백테스트가능(F-Score 3년+) ${edgarBacktestable} (${pc(edgarBacktestable, SAMPLE.length)}) · 평균 연수 ${edgarAny ? (edgarRowsTotal / edgarAny).toFixed(1) : 0}`);
  console.log(`\nF-Score 9필드 채움률(최신연도, ${fieldDenom}종목 기준):`);
  for (const f of FIELDS) console.log(`  ${f}: ${pc(fieldPop[f], fieldDenom)}`);
  console.log(`\n정확성 대조(강제포함):`);
  spot.forEach((l) => console.log(l));
  const nonFin = cat.tagGap + cat.fewYears + cat.backtestable; // 분류BS 보유(비금융류)
  console.log(`\n실패 원인 분류: EDGAR없음 ${cat.noEdgar} · 금융/구조상미적용 ${cat.financial} · 태그갭(고칠대상) ${cat.tagGap} · 연수부족 ${cat.fewYears} · 백테스트가능 ${cat.backtestable}`);
  console.log(`→ 비금융(분류BS 보유) ${nonFin}종목 중 백테스트가능 ${nonFin ? ((cat.backtestable / nonFin) * 100).toFixed(0) : 0}% ← 이게 진짜 지표. 태그갭이 크면 태그 더 보강, 작으면 데이터 충분.`);
  console.log(`\n판단 힌트: '금융/구조상미적용'은 정상 제외(F-Score 원래 안 됨). '태그갭'만 데이터로 고칠 대상. 가격은 대개 높게(모멘텀·저변동 넓은 검증 가능).`);
}
run();
