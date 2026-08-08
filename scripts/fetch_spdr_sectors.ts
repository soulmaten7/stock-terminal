// STEP 939 — SPDR 섹터 ETF 11개 holdings → S&P 500 진짜 GICS 섹터 정답지.
// 실행: npx tsx scripts/fetch_spdr_sectors.ts
// 저장: data/sources/spdr/spdr_sector_holdings_{as_of}.json (as_of = xlsx "Holdings: As of ..." 파싱)
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const ETFS: { etf: string; sector: string }[] = [
  { etf: "XLK", sector: "Information Technology" },
  { etf: "XLF", sector: "Financials" },
  { etf: "XLV", sector: "Health Care" },
  { etf: "XLE", sector: "Energy" },
  { etf: "XLI", sector: "Industrials" },
  { etf: "XLY", sector: "Consumer Discretionary" },
  { etf: "XLP", sector: "Consumer Staples" },
  { etf: "XLU", sector: "Utilities" },
  { etf: "XLB", sector: "Materials" },
  { etf: "XLRE", sector: "Real Estate" },
  { etf: "XLC", sector: "Communication Services" },
];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const OUT_DIR = "data/sources/spdr/";

// 엑셀 날짜문자열("As of 06-Aug-2026") → YYYY-MM-DD
function parseAsOf(s: string): string {
  const m = /As of\s+(\d{1,2})-([A-Za-z]{3})-(\d{4})/.exec(s);
  if (!m) return "";
  const months: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  return `${m[3]}-${months[m[2]]}-${m[1].padStart(2, "0")}`;
}

type Row = { ticker: string; name: string; etf: string; sector: string };

async function fetchOne(etf: string, sector: string): Promise<{ asOf: string; rows: Row[]; excluded: Row[] }> {
  const url = `https://www.ssga.com/us/en/intermediary/library-content/products/fund-data/etfs/us/holdings-daily-us-en-${etf.toLowerCase()}.xlsx`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${etf}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as unknown[][];

  // as_of: "Holdings:" | "As of ..." 행에서 파싱
  const asOfRow = sheetRows.find((r) => r[0] === "Holdings:");
  const asOf = asOfRow ? parseAsOf(String(asOfRow[1] ?? "")) : "";

  // 🔴 헤더 위치를 고정 숫자로 박지 않는다 — 첫 열이 "Name"인 행을 찾는다
  const hdrIdx = sheetRows.findIndex((r) => r[0] === "Name");
  if (hdrIdx < 0) throw new Error(`${etf}: 헤더행("Name") 못 찾음`);
  const cols = sheetRows[hdrIdx] as string[];
  const tickerCol = cols.indexOf("Ticker");
  const nameCol = cols.indexOf("Name");

  // 실제 보유종목 블록 = 헤더 다음부터 첫 빈 행 전까지(그 뒤는 각주·면책 문구 텍스트가 이어짐 — 실측 확인)
  let end = hdrIdx + 1;
  while (end < sheetRows.length && sheetRows[end] && sheetRows[end].length > 0) end++;

  const rows: Row[] = [];
  const excluded: Row[] = [];
  for (let i = hdrIdx + 1; i < end; i++) {
    const r = sheetRows[i];
    const ticker = String(r[tickerCol] ?? "").trim();
    const name = String(r[nameCol] ?? "").trim();
    const item: Row = { ticker, name, etf, sector };
    // 필터 규칙(그 외 임의 판단 금지 — 939 §④): 티커가 없거나 "-"인 줄만 제외
    if (!ticker || ticker === "-") excluded.push(item);
    else rows.push(item);
  }
  return { asOf, rows, excluded };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const allRows: Row[] = [];
  const allExcluded: Row[] = [];
  const asOfs: string[] = [];
  const fails: string[] = [];

  for (const { etf, sector } of ETFS) {
    try {
      const { asOf, rows, excluded } = await fetchOne(etf, sector);
      console.log(`  ✓ ${etf} (${sector}): ${rows.length}행 · as_of=${asOf} · 제외 ${excluded.length}건`);
      allRows.push(...rows);
      allExcluded.push(...excluded);
      if (asOf) asOfs.push(asOf);
    } catch (e) {
      fails.push(`${etf}: ${(e as Error).message}`);
      console.error(`  ✗ ${etf}: ${(e as Error).message}`);
    }
  }

  if (fails.length) {
    console.error(`\n🔴 취득 실패 ${fails.length}건 — 멈추고 보고`);
    console.error(fails.join("\n"));
    process.exit(1);
  }

  const uniqAsOf = Array.from(new Set(asOfs));
  if (uniqAsOf.length !== 1) console.warn(`🔴 ETF별 as_of 불일치: ${uniqAsOf.join(", ")}`);
  const asOf = uniqAsOf[0] ?? new Date().toISOString().slice(0, 10);

  const out = {
    _meta: {
      source: "https://www.ssga.com/us/en/intermediary/library-content/products/fund-data/etfs/us/holdings-daily-us-en-{etf}.xlsx",
      acquired: new Date().toISOString().slice(0, 10),
      asOf,
      etfCount: ETFS.length,
      rows: allRows.length,
      note: "S&P 500 섹터 ETF(SPDR Select Sector) 구성종목 = S&P 500 종목의 진짜 GICS 섹터. 11개 전부(Communication Services 포함)라 GICS 11분류 전체 커버. 정답지 용도 — 커버리지 해결책 아님(S&P 500만).",
      excluded: allExcluded,
    },
    data: allRows,
  };
  const file = path.join(OUT_DIR, `spdr_sector_holdings_${asOf}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\n저장: ${file} (${allRows.length}행 · 제외 ${allExcluded.length}건 · as_of=${asOf})`);
}

main();
