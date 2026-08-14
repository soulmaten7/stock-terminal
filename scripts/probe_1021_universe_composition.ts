// STEP 1021 — 커버리지 분모(5,976종목)에 무엇이 들어 있는가. 종류별 분류 + 커버리지 교차표 + 가상 시나리오.
// 🔴 읽기 전용 프로브. DB 쓰기 0. data/us_symbols.json은 읽기만(수정 금지).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import usSymbolsData from "../data/us_symbols.json";
import { readFileSync } from "fs";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

type FrameRow = { accn: string; cik: number; entityName: string; loc: string; end: string; val: number };
type FrameResp = { data?: FrameRow[] };
async function fetchFrame(ns: string, tag: string, unit: string, period: string): Promise<FrameRow[]> {
  const url = `https://data.sec.gov/api/xbrl/frames/${ns}/${tag}/${unit}/${period}.json`;
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) return [];
  const j = (await r.json()) as FrameResp;
  return j.data ?? [];
}

// === 종류 분류(이름 패턴, 교차확인은 나스닥 스냅샷 sector/industry로) ===
type Kind = "CEF_TRUST" | "ROYALTY_TRUST" | "ADR" | "SPAC" | "PREFERRED_LEFTOVER" | "WARRANT_RIGHT_LEFTOVER" | "COMMON";
function classify(name: string): { kind: Kind; basis: string } {
  const n = name;
  if (/royalty trust|units? of beneficial interest/i.test(n)) return { kind: "ROYALTY_TRUST", basis: "이름:royalty trust/units of beneficial interest" };
  if (/\b(fund|trust)\b.*(common shares? of beneficial interest|common stock|shares? of beneficial interest)|common shares? of beneficial interest/i.test(n))
    return { kind: "CEF_TRUST", basis: "이름:Fund/Trust + Beneficial Interest 계열" };
  if (/\bfund\b/i.test(n) && /common (stock|shares?)/i.test(n)) return { kind: "CEF_TRUST", basis: "이름:Fund + Common Stock/Shares" };
  if (/american depositary (shares?|receipts?)|\bADS\b|\bADR\b/i.test(n)) return { kind: "ADR", basis: "이름:American Depositary Shares/ADS/ADR" };
  if (/acquisition corp|acquisition (i{1,3}|iv|v)\b|blank check/i.test(n) && /ordinary shares?|class [a-z] common/i.test(n))
    return { kind: "SPAC", basis: "이름:Acquisition Corp + Ordinary/Class 주식" };
  if (/preferred|depositary shs/i.test(n)) return { kind: "PREFERRED_LEFTOVER", basis: "이름:preferred/depositary shs(필터 누락분)" };
  if (/warrant|\bright(s)?\b/i.test(n)) return { kind: "WARRANT_RIGHT_LEFTOVER", basis: "이름:warrant/right(필터 누락분)" };
  return { kind: "COMMON", basis: "패턴 불일치 → 보통주로 잠정 분류(잔여)" };
}

async function main() {
  const sb = createAdminClient();
  type UsSym = { sym: string; name: string; type: string };
  const STOCK = (usSymbolsData as UsSym[]).filter((s) => s.type === "stock");
  console.log("universe:", STOCK.length);

  // 나스닥 로컬 스냅샷(교차확인용)
  const nasdaqRaw = JSON.parse(readFileSync("data/sources/nasdaq/nasdaq_screener_20260808.json", "utf8")) as { data: { symbol: string; sector: string; industry: string; country: string; marketCap: string }[] };
  const nasdaqBySym = new Map(nasdaqRaw.data.map((r) => [r.symbol, r]));
  console.log("nasdaq snapshot rows:", nasdaqRaw.data.length);

  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
  const cikBySymbol = new Map(cikRows.map((r) => [r.symbol.toUpperCase(), r.cik]));

  const priceRows: { symbol: string; price: number | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_stock_perf").select("symbol, price").range(f, f + 999); const c = (data ?? []) as typeof priceRows; priceRows.push(...c); if (c.length < 1000) break; }
  const priceBySymbol = new Map(priceRows.map((r) => [r.symbol.toUpperCase(), r.price]));

  const mcapRows: { symbol: string; market_cap: number; as_of: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap, as_of").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBySymbol = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), r]));
  const latestMcapAsOf = mcapRows.reduce<string | null>((mx, r) => (mx == null || r.as_of > mx ? r.as_of : mx), null);

  const lensRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(f, f + 999); const c = (data ?? []) as typeof lensRows; lensRows.push(...c); if (c.length < 1000) break; }
  const lensSet = new Set(lensRows.map((r) => r.symbol.toUpperCase()));

  const revdcfRows: { symbol: string }[] = [];
  { const { data } = await sb.from("revdcf_results").select("symbol").eq("as_of", (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data!.as_of); for (const r of (data ?? []) as typeof revdcfRows) revdcfRows.push(r); }
  const revdcfSet = new Set(revdcfRows.filter((r) => r.symbol).map((r) => r.symbol!.toUpperCase()));

  const periods = ["CY2026Q2I", "CY2026Q1I", "CY2025Q4I", "CY2025Q3I", "CY2025Q2I", "CY2025Q1I"];
  const deiByCik = new Map<number, FrameRow>();
  for (const p of periods) { const rows = await fetchFrame("dei", "EntityCommonStockSharesOutstanding", "shares", p); for (const r of rows) { const e = deiByCik.get(r.cik); if (!e || r.end > e.end) deiByCik.set(r.cik, r); } await new Promise((res) => setTimeout(res, 200)); }
  const gaapByCik = new Map<number, FrameRow>();
  for (const p of periods) { const rows = await fetchFrame("us-gaap", "CommonStockSharesOutstanding", "shares", p); for (const r of rows) { const e = gaapByCik.get(r.cik); if (!e || r.end > e.end) gaapByCik.set(r.cik, r); } await new Promise((res) => setTimeout(res, 200)); }

  type Row = { symbol: string; kind: Kind; basis: string; crossCheck: string | null; cik: number | null; yahooFresh: boolean; hasShares: boolean; assembled: boolean; inLens: boolean; inRevdcf: boolean };
  const rows: Row[] = STOCK.map((s) => {
    const { kind, basis } = classify(s.name);
    const nd = nasdaqBySym.get(s.sym);
    const crossCheck = nd ? `${nd.sector}/${nd.industry}` : null;
    const cik = cikBySymbol.get(s.sym) ?? null;
    const shares = cik ? (deiByCik.get(cik)?.val ?? gaapByCik.get(cik)?.val ?? null) : null;
    const price = priceBySymbol.get(s.sym) ?? null;
    const mc = mcapBySymbol.get(s.sym);
    return {
      symbol: s.sym, kind, basis, crossCheck, cik,
      yahooFresh: !!mc && mc.as_of === latestMcapAsOf,
      hasShares: shares != null,
      assembled: shares != null && price != null,
      inLens: lensSet.has(s.sym), inRevdcf: revdcfSet.has(s.sym),
    };
  });

  console.log("=== 1-1 종류별 전수 ===");
  const kinds: Kind[] = ["COMMON", "CEF_TRUST", "ROYALTY_TRUST", "ADR", "SPAC", "PREFERRED_LEFTOVER", "WARRANT_RIGHT_LEFTOVER"];
  for (const k of kinds) {
    const g = rows.filter((r) => r.kind === k);
    console.log(JSON.stringify({ kind: k, n: g.length, pct: (g.length / rows.length) * 100 }));
  }

  console.log("=== 1-2 종류별 x 커버리지 교차표 ===");
  for (const k of kinds) {
    const g = rows.filter((r) => r.kind === k);
    if (g.length === 0) continue;
    const yahooOk = g.filter((r) => r.yahooFresh).length;
    const sharesOk = g.filter((r) => r.hasShares).length;
    const uncovered182 = g.filter((r) => !r.yahooFresh && !r.assembled).length;
    const inLens = g.filter((r) => r.inLens).length;
    const inRevdcf = g.filter((r) => r.inRevdcf).length;
    console.log(JSON.stringify({ kind: k, n: g.length, yahooFreshPct: (yahooOk / g.length) * 100, sharesTagPct: (sharesOk / g.length) * 100, in182: uncovered182, inLensScores: inLens, inRevdcf604: inRevdcf }));
  }

  console.log("=== 1-3 가상 시나리오 ===");
  function coverage(subset: Row[]) {
    const n = subset.length;
    const yahooOk = subset.filter((r) => r.yahooFresh).length;
    const combinedOk = subset.filter((r) => r.yahooFresh || r.assembled).length;
    return { n, yahoo: (yahooOk / n) * 100, combined: (combinedOk / n) * 100 };
  }
  console.log("현행(전체):", JSON.stringify(coverage(rows)));
  const noCefTrust = rows.filter((r) => r.kind !== "CEF_TRUST" && r.kind !== "ROYALTY_TRUST");
  console.log("(a) CEF/신탁 제외:", JSON.stringify(coverage(noCefTrust)));
  const noCefTrustNoDeriv = noCefTrust.filter((r) => r.kind !== "PREFERRED_LEFTOVER" && r.kind !== "WARRANT_RIGHT_LEFTOVER" && r.kind !== "SPAC");
  console.log("(b) (a)+우선주/워런트/SPAC 제외:", JSON.stringify(coverage(noCefTrustNoDeriv)));
  const commonOnly = rows.filter((r) => r.kind === "COMMON");
  console.log("(c) COMMON 잔여만:", JSON.stringify(coverage(commonOnly)));

  console.log("=== 1-4 182건 중 COMMON 분류 + 편입 사례 ===");
  const uncovered = rows.filter((r) => !r.yahooFresh && !r.assembled);
  const uncoveredCommon = uncovered.filter((r) => r.kind === "COMMON");
  console.log(JSON.stringify({ uncoveredTotal: uncovered.length, uncoveredCommon: uncoveredCommon.length, sample: uncoveredCommon.slice(0, 15).map((r) => r.symbol) }));

  console.log("=== CEF/신탁이 lens_scores·revdcf 편입된 사례(발견용) ===");
  const cefInLens = rows.filter((r) => (r.kind === "CEF_TRUST" || r.kind === "ROYALTY_TRUST") && r.inLens);
  const cefInRevdcf = rows.filter((r) => (r.kind === "CEF_TRUST" || r.kind === "ROYALTY_TRUST") && r.inRevdcf);
  console.log(JSON.stringify({ cefInLensCount: cefInLens.length, cefInRevdcfCount: cefInRevdcf.length, revdcfSample: cefInRevdcf.slice(0, 10).map((r) => r.symbol) }));
  console.log("cefInLens symbols:", JSON.stringify(cefInLens.map((r) => r.symbol)));

  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });
