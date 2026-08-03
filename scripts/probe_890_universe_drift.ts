// STEP 890 — DoD 4 전제 확인: 유니버스가 매일 움직인다. 읽기 전용 실측.
// 금지: revdcf_results·us_market_cap 쓰기 · data/us_symbols.json 수정 · .github/workflows 수정 · 크론 수동 실행.
// 실행: npx tsx scripts/probe_890_universe_drift.ts
//
// §2: data/us_symbols.json 최근 8개 자동갱신 커밋을 git show로 그대로 읽어(체크아웃 없이) 총량·stock 전용량을 재검산.
//     같은 파일이 exchange(거래소) 필드를 갖는지 스키마 확인 — 866/867의 "거래소 상장 N=2,857"이 이 파일에서
//     파생 가능한지 판정하는 핵심 근거.
// §3: us_market_cap·revdcf_results의 as_of 분포를 DB에서 직접 읽어(읽기 전용) 갱신 주기를 실측.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";

type Row = { sym: string; name: string; type: string };

const COMMITS: { hash: string; date: string }[] = [
  { hash: "98f1265", date: "2026-08-03" },
  { hash: "12e2e99", date: "2026-08-01" },
  { hash: "e0c6020", date: "2026-07-31" },
  { hash: "0655d0e", date: "2026-07-30" },
  { hash: "20c007f", date: "2026-07-29" },
  { hash: "dcd6e6d", date: "2026-07-28" },
  { hash: "9f955ca", date: "2026-07-27" },
  { hash: "bf01660", date: "2026-07-25" },
];

function readSnapshot(hash: string): Row[] {
  // 🔴 체크아웃하지 않는다 — git show로 blob만 읽는다(작업트리 불변).
  const raw = execSync(`git show ${hash}:data/us_symbols.json`, { maxBuffer: 1024 * 1024 * 64 }).toString("utf8");
  return JSON.parse(raw) as Row[];
}

(async () => {
  // ── §2 — 커밋별 스냅샷 재검산 + 스키마 확인(exchange 필드 존재 여부) ──
  const snapshots = COMMITS.map(({ hash, date }) => {
    const rows = readSnapshot(hash);
    const stocks = rows.filter((r) => r.type === "stock");
    const etfs = rows.filter((r) => r.type !== "stock");
    const sampleKeys = rows.length ? Object.keys(rows[0]).sort() : [];
    return { hash, date, total: rows.length, stocks: stocks.length, etf: etfs.length, fields: sampleKeys };
  });

  const hasExchangeField = snapshots.some((s) => s.fields.includes("exchange"));

  // ── §3 — DB as_of 분포(읽기 전용) ──
  // 🔴 PostgREST 기본 페이지 상한(1000행) 함정 — .range()로 전량 페이지네이션 없이 읽으면 조용히 잘린다(플레이북 선례).
  async function readAllAsOf(table: string): Promise<string[]> {
    const out: string[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await sb.from(table).select("as_of").range(from, from + 999);
      const c = (data ?? []) as { as_of: string }[];
      out.push(...c.map((r) => r.as_of));
      if (c.length < 1000) break;
    }
    return out;
  }
  const sb = createAdminClient();
  const mcapAsOf = await readAllAsOf("us_market_cap");
  const mcapDist = new Map<string, number>();
  for (const d of mcapAsOf) mcapDist.set(d, (mcapDist.get(d) ?? 0) + 1);

  const revAsOf = await readAllAsOf("revdcf_results");
  const revDist = new Map<string, number>();
  for (const d of revAsOf) revDist.set(d, (revDist.get(d) ?? 0) + 1);

  // ── §3 — revdcf 크론의 유니버스가 us_symbols.json/us_market_cap 심볼 집합과 실제로 겹치는 정도(코드 경로 확인용 · 판정 아님) ──
  const latestSnapshotSyms = new Set(snapshots[0] ? readSnapshot(snapshots[0].hash).filter((r) => r.type === "stock").map((r) => r.sym) : []);
  const revSymbols = (await sb.from("revdcf_results").select("symbol").eq("as_of", [...revDist.keys()].sort().pop() ?? "").then((r) => r.data ?? [])) as { symbol: string | null }[];
  const revSymSet = new Set(revSymbols.map((r) => r.symbol).filter((s): s is string => !!s));
  const overlap = [...revSymSet].filter((s) => latestSnapshotSyms.has(s)).length;

  const out = {
    generatedAt: "2026-08-03 (STEP 890, git show 재실행 결과)",
    section2_snapshotRecount: snapshots,
    section2_hasExchangeFieldInAnySnapshot: hasExchangeField,
    section2_note:
      "us_symbols.json 레코드 스키마는 {sym,name,type}뿐 — exchange 필드가 없다. 866/867의 '거래소 상장 N=2,857'은 이 파일에서 재현 불가능(파생 불가) — 별도 SEC 소스(company_tickers_exchange/sec_reporting_issuers)에서 온 일회성 스냅샷.",
    section3_usMarketCap_asOfDistribution: [...mcapDist.entries()].sort(),
    section3_revdcfResults_asOfDistribution: [...revDist.entries()].sort(),
    section3_revdcfUniverse_vs_latestUsSymbolsSnapshot_overlap: {
      revdcfUniverseSize: revSymSet.size,
      latestSnapshotStockCount: latestSnapshotSyms.size,
      overlapCount: overlap,
      note: "revdcf_results.symbol과 최신 us_symbols.json stock 심볼의 교집합 크기 — 참고용(cron이 이 파일을 읽지 않는다는 코드 사실은 grep으로 별도 확인, 이 숫자는 우연한 교집합 크기일 뿐 인과관계 아님).",
    },
  };

  writeFileSync("docs/probe_890_universe_drift.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
