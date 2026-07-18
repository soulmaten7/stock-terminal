// US 유니버스 월간 재생성 — Nasdaq Trader 공식 심볼 디렉토리 → data/us_symbols.json (STEP 754).
// 정책: 주식만 재생성(신규상장 편입·상폐 제거) · 기존 etf 항목은 보존(큐레이션 성격).
// 실행: npx tsx scripts/refresh_us_symbols.ts   (GitHub Action 월 1회 + workflow_dispatch)
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "data", "us_symbols.json");
type Row = { sym: string; name: string; type: string };

// 파생·비보통주 제외(보통주/클래스주/ADR만 유니버스에)
const EXCLUDE_NAME = /(warrant|right(s)?\b|unit(s)?\b|preferred|depositary shs|notes? due|when[- ]issued)/i;

async function fetchTxt(url: string): Promise<string[]> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return (await res.text()).split(/\r?\n/);
}

function parseStocks(lines: string[], cols: { sym: number; name: number; etf: number; test: number }): Row[] {
  const out: Row[] = [];
  for (const line of lines.slice(1)) {
    const f = line.split("|");
    if (f.length < 5) continue; // 푸터("File Creation Time…")·빈 줄
    const rawSym = (f[cols.sym] ?? "").trim();
    const name = (f[cols.name] ?? "").trim();
    if (!rawSym || !name) continue;
    if ((f[cols.test] ?? "").trim() === "Y") continue;         // 테스트 종목 제외
    if ((f[cols.etf] ?? "").trim() === "Y") continue;          // ETF 제외(기존 etf 목록 보존 정책)
    if (/[$^=~]/.test(rawSym)) continue;                        // 우선주·특수 심볼 제외
    if (EXCLUDE_NAME.test(name)) continue;                      // 워런트·라이트·유닛 등 제외
    const sym = rawSym.replace(/\./g, "-").toUpperCase();       // 야후 표기(BRK.B → BRK-B)
    out.push({ sym, name, type: "stock" });
  }
  return out;
}

(async () => {
  // nasdaqlisted: 0 Symbol · 1 Security Name · 3 Test Issue · 6 ETF
  const nasdaq = parseStocks(await fetchTxt("https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt"), { sym: 0, name: 1, test: 3, etf: 6 });
  // otherlisted: 0 ACT Symbol · 1 Security Name · 4 ETF · 6 Test Issue
  const other = parseStocks(await fetchTxt("https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt"), { sym: 0, name: 1, test: 6, etf: 4 });

  const bySym = new Map<string, Row>();
  for (const r of [...nasdaq, ...other]) if (!bySym.has(r.sym)) bySym.set(r.sym, r);
  const stocks = [...bySym.values()].sort((a, b) => a.sym.localeCompare(b.sym));

  // ⛔ 안전 가드 — 부분 응답/포맷 변경으로 유니버스가 반토막 나는 것 방지(조용한 축소 금지)
  if (stocks.length < 4000) throw new Error(`too few stocks: ${stocks.length} (source partial/format changed?)`);

  const prev = JSON.parse(fs.readFileSync(OUT, "utf8")) as Row[];
  const prevStocks = prev.filter((r) => r.type === "stock");
  const etfs = prev.filter((r) => r.type !== "stock"); // etf 등 비주식 항목 전부 보존

  const prevSet = new Set(prevStocks.map((r) => r.sym));
  const nextSet = new Set(stocks.map((r) => r.sym));
  const added = stocks.filter((r) => !prevSet.has(r.sym)).map((r) => r.sym);
  const removed = prevStocks.filter((r) => !nextSet.has(r.sym)).map((r) => r.sym);

  const next = [...stocks, ...etfs];
  fs.writeFileSync(OUT, JSON.stringify(next));
  console.log(`stocks ${prevStocks.length} -> ${stocks.length} (+${added.length} / -${removed.length}) · etf 보존 ${etfs.length}`);
  if (added.length) console.log("added:", added.slice(0, 30).join(","), added.length > 30 ? "…" : "");
  if (removed.length) console.log("removed:", removed.slice(0, 30).join(","), removed.length > 30 ? "…" : "");
})();
