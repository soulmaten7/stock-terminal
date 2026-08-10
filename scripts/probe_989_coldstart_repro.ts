// STEP 989 §2 — 3.15.4로 콜드스타트(매 청크마다 crumb 캐시 초기화)를 흉내내 필드 누락이 재현되는지 확인.
// 프로덕션과 동일하게 US 전체 유니버스를 60청크·동시성6으로 돌되, 각 청크 fetch 직전 getCrumbClear()로
// 크럼·쿠키를 지운다 — "매 요청이 콜드스타트처럼 크럼을 새로 받는다"를 흉내내는 것.
// getCrumbClear는 패키지 공개 서브경로(package.json exports "./lib/getCrumb")로 접근 — 내부 해킹 아님.
import YahooFinance from "yahoo-finance2";
import { getCrumbClear } from "yahoo-finance2/lib/getCrumb";
import fs from "fs";
import symbols from "../data/us_symbols.json";

type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// yf._opts.cookieJar는 공개 열거 프로퍼티(클래스 정의에서 enumerable:true) — 내부 전용 아님, getCrumbClear의 공식 인자로 씀.
const cookieJar = (yf as unknown as { _opts: { cookieJar: unknown } })._opts.cookieJar;

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

async function main() {
  const chunks: string[][] = [];
  for (let i = 0; i < STOCK_SYMS.length; i += 100) chunks.push(STOCK_SYMS.slice(i, i + 100));
  console.log(`유니버스 ${STOCK_SYMS.length}, 청크 ${chunks.length}, 청크마다 crumb 초기화(동시성6이라 리셋이 서로 겹칠 수 있음 — 의도된 설계)`);

  const missingBySymbol = new Map<string, boolean>();
  let failedChunks = 0, resetErrors = 0;

  await mapLimit(chunks, 6, async (grp) => {
    try {
      await getCrumbClear(cookieJar as Parameters<typeof getCrumbClear>[0]); // 콜드스타트 흉내 — 이 청크를 쏘기 직전 크럼·쿠키를 지운다
    } catch (e) {
      resetErrors++;
      console.log("getCrumbClear 실패:", e instanceof Error ? e.message : String(e));
    }
    try {
      const qs = (await yf.quote(grp)) as Array<Record<string, unknown>>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const sym = q.symbol as string | undefined;
        if (!sym) continue;
        missingBySymbol.set(sym, !(typeof q.marketCap === "number" && (q.marketCap as number) > 0));
      }
    } catch (e) {
      failedChunks++;
      console.log("청크 실패:", e instanceof Error ? e.message : String(e));
    }
  });

  const responded = missingBySymbol.size;
  const missing = [...missingBySymbol.entries()].filter(([, m]) => m).map(([s]) => s);
  const result = {
    universe: STOCK_SYMS.length, responded, noResponse: STOCK_SYMS.length - responded,
    failedChunks, totalChunks: chunks.length, resetErrors,
    missingCount: missing.length, missingSymbols: missing.slice(0, 50),
  };
  fs.writeFileSync("docs/probe_989_coldstart_output.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main();
