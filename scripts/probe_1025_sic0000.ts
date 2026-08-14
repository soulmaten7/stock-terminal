// STEP 1025 1-4 — STEP1024 자기신고 버그(SIC "0000"을 유효 사업코드로 오계산)의 전수 영향.
// 🔴 읽기 전용. DB 쓰기 0. data/us_symbols.json은 읽기만. 1024와 동일 방법 재사용(재조회 필요 — 1024는 SIC 원시값을
//   mismatch 서브셋만 직렬화해 저장했고 전체 COMMON_SIC(5,134건) 원시값은 남기지 않았다).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import usSymbolsData from "../data/us_symbols.json";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Kind = "CEF_TRUST" | "ROYALTY_TRUST" | "ADR" | "SPAC" | "PREFERRED_LEFTOVER" | "WARRANT_RIGHT_LEFTOVER" | "COMMON";
function classifyByName(name: string): Kind {
  const n = name;
  if (/royalty trust|units? of beneficial interest/i.test(n)) return "ROYALTY_TRUST";
  if (/\b(fund|trust)\b.*(common shares? of beneficial interest|common stock|shares? of beneficial interest)|common shares? of beneficial interest/i.test(n)) return "CEF_TRUST";
  if (/\bfund\b/i.test(n) && /common (stock|shares?)/i.test(n)) return "CEF_TRUST";
  if (/american depositary (shares?|receipts?)|\bADS\b|\bADR\b/i.test(n)) return "ADR";
  if (/acquisition corp|acquisition (i{1,3}|iv|v)\b|blank check/i.test(n) && /ordinary shares?|class [a-z] common/i.test(n)) return "SPAC";
  if (/preferred|depositary shs/i.test(n)) return "PREFERRED_LEFTOVER";
  if (/warrant|\bright(s)?\b/i.test(n)) return "WARRANT_RIGHT_LEFTOVER";
  return "COMMON";
}

type Submission = { sic?: string; sicDescription?: string; entityType?: string };
async function fetchSubmission(cik: number): Promise<Submission | null> {
  const cikStr = String(cik).padStart(10, "0");
  try {
    const r = await fetch(`https://data.sec.gov/submissions/CIK${cikStr}.json`, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    return (await r.json()) as Submission;
  } catch {
    return null;
  }
}

async function main() {
  const sb = createAdminClient();
  type UsSym = { sym: string; name: string; type: string };
  const STOCK = (usSymbolsData as UsSym[]).filter((s) => s.type === "stock");
  console.log("universe:", STOCK.length);

  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
  const cikBySymbol = new Map(cikRows.map((r) => [r.symbol.toUpperCase(), r.cik]));

  let done = 0;
  const zeroSic: { symbol: string; name: string; nameKind: Kind }[] = [];
  let hasSicNonZero = 0, hasSicZero = 0, noSic = 0, noCik = 0, fetchFail = 0;
  for (const s of STOCK) {
    const cik = cikBySymbol.get(s.sym);
    if (!cik) { noCik += 1; continue; }
    const sub = await fetchSubmission(cik);
    if (sub === null) { fetchFail += 1; }
    else {
      const sic = sub.sic && sub.sic.length > 0 ? sub.sic : null;
      if (sic === "0000") { hasSicZero += 1; zeroSic.push({ symbol: s.sym, name: s.name, nameKind: classifyByName(s.name) }); }
      else if (sic != null) hasSicNonZero += 1;
      else noSic += 1;
    }
    done += 1;
    if (done % 500 === 0) console.log(`progress ${done}/${STOCK.length}`);
    await sleep(105);
  }

  console.log("=== 1-4 SIC \"0000\" 전수 결과 ===");
  console.log(JSON.stringify({ total: STOCK.length, noCik, fetchFail, hasSicNonZero, hasSicZero, noSic }));
  console.log("hasSicZero(=이전 STEP1024가 COMMON_SIC으로 오분류) 건수:", hasSicZero);
  console.log("nameKind 분포(0000 대상):");
  const byKind = new Map<Kind, number>();
  for (const z of zeroSic) byKind.set(z.nameKind, (byKind.get(z.nameKind) ?? 0) + 1);
  for (const [k, n] of byKind) console.log(JSON.stringify({ nameKind: k, n }));
  console.log("전수 심볼 목록:", JSON.stringify(zeroSic.map((z) => z.symbol)));
  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });
