// STEP 1024 — 유니버스(5,976종목)를 SEC SIC 정본으로 재판별. 1021의 이름패턴 분류와 교차검증.
// 🔴 읽기 전용. DB 쓰기 0. data/us_symbols.json은 읽기만(수정 금지). app/**·lib/** 미접촉.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import usSymbolsData from "../data/us_symbols.json";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// === 1021의 이름패턴 분류(재사용, 변경 없이 복사) ===
type Kind = "CEF_TRUST" | "ROYALTY_TRUST" | "ADR" | "SPAC" | "PREFERRED_LEFTOVER" | "WARRANT_RIGHT_LEFTOVER" | "COMMON";
function classifyByName(name: string): { kind: Kind; basis: string } {
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
const NAME_EXCLUDE_CANDIDATE = new Set<Kind>(["CEF_TRUST", "ROYALTY_TRUST", "SPAC"]);

// === SIC 정본 분류(신규) ===
type SicKind = "REIT_6798" | "CEF_FUND_6726" | "SPAC_6770" | "COMMON_SIC" | "판별불가_투자회사" | "판별불가_SIC없음" | "판별불가_CIK없음";
function classifyBySic(sic: string | null, entityType: string | null, hasCik: boolean): SicKind {
  if (!hasCik) return "판별불가_CIK없음";
  if (sic === "6798") return "REIT_6798";
  if (sic === "6726") return "CEF_FUND_6726";
  if (sic === "6770") return "SPAC_6770";
  if (sic && sic.length > 0) return "COMMON_SIC";
  if (entityType && entityType !== "operating") return "판별불가_투자회사";
  return "판별불가_SIC없음";
}
const SIC_EXCLUDE_CANDIDATE = new Set<SicKind>(["CEF_FUND_6726", "SPAC_6770"]);

type Submission = { sic?: string; sicDescription?: string; entityType?: string };
async function fetchSubmission(cik: number): Promise<Submission | null> {
  const cikStr = String(cik).padStart(10, "0");
  try {
    const r = await fetch(`https://data.sec.gov/submissions/CIK${cikStr}.json`, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (r.status === 404) return null;
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
  console.log("cik map rows:", cikRows.length);

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
  console.log("lens_scores US rows(=상위1000 유니버스):", lensRows.length);

  const revdcfAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data?.as_of;
  const revdcfRows: { symbol: string | null }[] = [];
  { const { data } = await sb.from("revdcf_results").select("symbol").eq("as_of", revdcfAsOf); for (const r of (data ?? []) as typeof revdcfRows) revdcfRows.push(r); }
  const revdcfSet = new Set(revdcfRows.filter((r) => r.symbol).map((r) => r.symbol!.toUpperCase()));
  console.log("revdcf_results rows(as_of=" + revdcfAsOf + "):", revdcfRows.length);

  // 야후/조립 커버리지 플래그(§1-4용, 1021과 동일 방법 재사용 — 6분기 frames창, 결과는 참고용 가상값)
  type FrameRow = { cik: number; end: string; val: number };
  async function fetchFrame(ns: string, tag: string, unit: string, period: string): Promise<FrameRow[]> {
    const url = `https://data.sec.gov/api/xbrl/frames/${ns}/${tag}/${unit}/${period}.json`;
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
    if (!r.ok) return [];
    const j = (await r.json()) as { data?: FrameRow[] };
    return j.data ?? [];
  }
  const periods = ["CY2026Q2I", "CY2026Q1I", "CY2025Q4I", "CY2025Q3I", "CY2025Q2I", "CY2025Q1I"];
  const deiByCik = new Map<number, FrameRow>();
  for (const p of periods) { const rows = await fetchFrame("dei", "EntityCommonStockSharesOutstanding", "shares", p); for (const r of rows) { const e = deiByCik.get(r.cik); if (!e || r.end > e.end) deiByCik.set(r.cik, r); } await sleep(200); }
  const gaapByCik = new Map<number, FrameRow>();
  for (const p of periods) { const rows = await fetchFrame("us-gaap", "CommonStockSharesOutstanding", "shares", p); for (const r of rows) { const e = gaapByCik.get(r.cik); if (!e || r.end > e.end) gaapByCik.set(r.cik, r); } await sleep(200); }
  console.log("frames fetch done. dei:", deiByCik.size, "gaap:", gaapByCik.size);

  // === §1-1 SIC 전수 확보 ===
  console.log("=== §1-1 SIC 전수 확보 시작 ===");
  const sicBySymbol = new Map<string, { sic: string | null; sicDesc: string | null; entityType: string | null; fetchFail: boolean }>();
  let done = 0;
  for (const s of STOCK) {
    const cik = cikBySymbol.get(s.sym);
    if (!cik) { sicBySymbol.set(s.sym, { sic: null, sicDesc: null, entityType: null, fetchFail: false }); continue; }
    const sub = await fetchSubmission(cik);
    if (sub === null) { sicBySymbol.set(s.sym, { sic: null, sicDesc: null, entityType: null, fetchFail: true }); }
    else { sicBySymbol.set(s.sym, { sic: sub.sic && sub.sic.length > 0 ? sub.sic : null, sicDesc: sub.sicDescription ?? null, entityType: sub.entityType ?? null, fetchFail: false }); }
    done += 1;
    if (done % 500 === 0) console.log(`progress ${done}/${STOCK.length}`);
    await sleep(105); // 10 req/s 준수(여유 마진)
  }
  console.log("=== §1-1 SIC 확보 완료 ===", done);

  const fetchFailCount = [...sicBySymbol.values()].filter((v) => v.fetchFail).length;
  const noCikCount = STOCK.filter((s) => !cikBySymbol.has(s.sym)).length;
  const hasSicCount = [...sicBySymbol.values()].filter((v) => v.sic != null).length;
  console.log(JSON.stringify({ noCikCount, fetchFailCount, hasSicCount, sicRate: hasSicCount / STOCK.length }));

  // === 통합 행 구성 ===
  type Row = {
    symbol: string; name: string;
    nameKind: Kind; nameBasis: string; nameExclude: boolean;
    sic: string | null; sicDesc: string | null; entityType: string | null; sicKind: SicKind; sicExclude: boolean;
    cik: number | null;
    yahooFresh: boolean; hasShares: boolean; assembled: boolean;
    inLens: boolean; inRevdcf: boolean;
  };
  const rows: Row[] = STOCK.map((s) => {
    const { kind: nameKind, basis: nameBasis } = classifyByName(s.name);
    const cik = cikBySymbol.get(s.sym) ?? null;
    const sicInfo = sicBySymbol.get(s.sym)!;
    const sicKind = classifyBySic(sicInfo.sic, sicInfo.entityType, cik != null);
    const shares = cik ? (deiByCik.get(cik)?.val ?? gaapByCik.get(cik)?.val ?? null) : null;
    const price = priceBySymbol.get(s.sym) ?? null;
    const mc = mcapBySymbol.get(s.sym);
    return {
      symbol: s.sym, name: s.name,
      nameKind, nameBasis, nameExclude: NAME_EXCLUDE_CANDIDATE.has(nameKind),
      sic: sicInfo.sic, sicDesc: sicInfo.sicDesc, entityType: sicInfo.entityType, sicKind, sicExclude: SIC_EXCLUDE_CANDIDATE.has(sicKind),
      cik,
      yahooFresh: !!mc && mc.as_of === latestMcapAsOf,
      hasShares: shares != null,
      assembled: shares != null && price != null,
      inLens: lensSet.has(s.sym), inRevdcf: revdcfSet.has(s.sym),
    };
  });

  console.log("=== 1-2 SIC 기반 종류 분포(전수) ===");
  const sicKinds: SicKind[] = ["COMMON_SIC", "REIT_6798", "CEF_FUND_6726", "SPAC_6770", "판별불가_투자회사", "판별불가_SIC없음", "판별불가_CIK없음"];
  for (const k of sicKinds) {
    const g = rows.filter((r) => r.sicKind === k);
    console.log(JSON.stringify({ sicKind: k, n: g.length, pct: (g.length / rows.length) * 100 }));
  }

  console.log("=== 1-3 교차표: nameKind(1021) x sicKind(1024) ===");
  const nameKinds: Kind[] = ["COMMON", "CEF_TRUST", "ROYALTY_TRUST", "ADR", "SPAC", "PREFERRED_LEFTOVER", "WARRANT_RIGHT_LEFTOVER"];
  for (const nk of nameKinds) {
    for (const sk of sicKinds) {
      const n = rows.filter((r) => r.nameKind === nk && r.sicKind === sk).length;
      if (n > 0) console.log(JSON.stringify({ nameKind: nk, sicKind: sk, n }));
    }
  }

  console.log("=== 1-3 exclude-flag 불일치(nameExclude vs sicExclude) ===");
  const mismatch = rows.filter((r) => r.nameExclude !== r.sicExclude);
  console.log("mismatch total:", mismatch.length);
  console.log(JSON.stringify(mismatch.map((r) => ({ symbol: r.symbol, name: r.name, nameKind: r.nameKind, sicKind: r.sicKind, sic: r.sic, sicDesc: r.sicDesc, entityType: r.entityType, nameExclude: r.nameExclude, sicExclude: r.sicExclude }))));

  console.log("=== 1-3 REIT(6798) 전수 — 1021이 CEF_TRUST로 오분류했던 자리 재검증 ===");
  const reitRows = rows.filter((r) => r.sicKind === "REIT_6798");
  console.log("REIT total:", reitRows.length, "그중 nameKind=CEF_TRUST(1021 오분류 후보):", reitRows.filter((r) => r.nameKind === "CEF_TRUST").length);
  console.log("REIT that were name-excluded:", JSON.stringify(reitRows.filter((r) => r.nameExclude).map((r) => r.symbol)));

  console.log("=== 1-3 lens_scores(상위1000) 내 sicExclude 후보 — 전수 개별 ===");
  const lensExclude = rows.filter((r) => r.inLens && r.sicExclude);
  console.log("count:", lensExclude.length, JSON.stringify(lensExclude.map((r) => ({ symbol: r.symbol, name: r.name, sicKind: r.sicKind, sic: r.sic, sicDesc: r.sicDesc }))));

  console.log("=== 1-3 revdcf_results(604) 내 sicExclude 후보 ===");
  const revdcfExclude = rows.filter((r) => r.inRevdcf && r.sicExclude);
  console.log("count:", revdcfExclude.length, JSON.stringify(revdcfExclude.map((r) => ({ symbol: r.symbol, name: r.name, sicKind: r.sicKind }))));

  console.log("=== 1-4 가상 시나리오(채택 금지) ===");
  function coverage(subset: Row[]) {
    const n = subset.length;
    const yahooOk = subset.filter((r) => r.yahooFresh).length;
    const combinedOk = subset.filter((r) => r.yahooFresh || r.assembled).length;
    return { n, yahoo: (yahooOk / n) * 100, combined: (combinedOk / n) * 100 };
  }
  console.log("현행(전체):", JSON.stringify(coverage(rows)));
  const a = rows.filter((r) => r.sicKind !== "CEF_FUND_6726");
  console.log("(a) SIC 6726만 제외:", JSON.stringify(coverage(a)));
  const b = a.filter((r) => r.sicKind !== "SPAC_6770");
  console.log("(b) (a)+6770(SPAC) 제외:", JSON.stringify(coverage(b)));
  const c = b.filter((r) => r.nameKind !== "PREFERRED_LEFTOVER" && r.nameKind !== "WARRANT_RIGHT_LEFTOVER");
  console.log("(c) (b)+우선주/워런트/유닛/ETN 제외:", JSON.stringify(coverage(c)));

  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });
