// STEP 1024 보충 — lens_scores(상위1000)·revdcf_results(604) 내 entityType!='operating'(진짜 CEF/투자회사 신호) 전수 확인.
// 🔴 읽기 전용. DB 쓰기 0. SIC 6726이 실제로는 0건이라(등록 CEF는 SIC 자체가 없음) entityType이 진짜 신호다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchEntityType(cik: number): Promise<{ sic: string | null; entityType: string | null } | null> {
  const cikStr = String(cik).padStart(10, "0");
  try {
    const r = await fetch(`https://data.sec.gov/submissions/CIK${cikStr}.json`, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { sic?: string; entityType?: string };
    return { sic: j.sic && j.sic.length > 0 ? j.sic : null, entityType: j.entityType ?? null };
  } catch {
    return null;
  }
}

async function main() {
  const sb = createAdminClient();
  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
  const cikBySymbol = new Map(cikRows.map((r) => [r.symbol.toUpperCase(), r.cik]));

  const lensRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(f, f + 999); const c = (data ?? []) as typeof lensRows; lensRows.push(...c); if (c.length < 1000) break; }

  const revdcfAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data?.as_of;
  const revdcfRows: { symbol: string | null }[] = [];
  { const { data } = await sb.from("revdcf_results").select("symbol").eq("as_of", revdcfAsOf); for (const r of (data ?? []) as typeof revdcfRows) revdcfRows.push(r); }

  const lensSet = new Set(lensRows.map((r) => r.symbol.toUpperCase()));
  const revdcfSet = new Set(revdcfRows.filter((r) => r.symbol).map((r) => r.symbol!.toUpperCase()));
  const union = new Set([...lensSet, ...revdcfSet]);
  console.log("lens_scores:", lensSet.size, "revdcf_results:", revdcfSet.size, "union:", union.size);

  const results: { symbol: string; sic: string | null; entityType: string | null; inLens: boolean; inRevdcf: boolean }[] = [];
  let done = 0;
  for (const sym of union) {
    const cik = cikBySymbol.get(sym);
    if (!cik) { results.push({ symbol: sym, sic: null, entityType: null, inLens: lensSet.has(sym), inRevdcf: revdcfSet.has(sym) }); continue; }
    const info = await fetchEntityType(cik);
    results.push({ symbol: sym, sic: info?.sic ?? null, entityType: info?.entityType ?? null, inLens: lensSet.has(sym), inRevdcf: revdcfSet.has(sym) });
    done += 1;
    if (done % 300 === 0) console.log("progress", done, "/", union.size);
    await sleep(105);
  }

  const nonOperating = results.filter((r) => r.entityType && r.entityType !== "operating");
  console.log("=== entityType != operating (진짜 CEF/투자회사 신호) ===");
  console.log("count:", nonOperating.length);
  console.log(JSON.stringify(nonOperating.map((r) => ({ symbol: r.symbol, entityType: r.entityType, inLens: r.inLens, inRevdcf: r.inRevdcf }))));
  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });
