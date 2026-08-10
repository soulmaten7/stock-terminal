import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDrivers, type DriverResult } from "@/lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "@/lib/revdcf/compute";
import { runRevDcf, type RevDcfMarket, type RevDcfVerdict } from "@/lib/revdcf/engine";
import { REVDCF_DEFAULT_MAX_YEARS } from "./constants";
import { fetchSectorMap, resolveSector } from "@/lib/sector";
import { computeValuation, VALUATION_SPEC } from "@/lib/valuation";
import { fetchAllRows } from "@/lib/supabasePaging";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "@/lib/sectorRelativeBatch";
import { SECTOR_RELATIVE_SPEC } from "@/lib/sectorRelative";
import { toResolvedRows } from "@/lib/sectorCuts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// STEP 853 §5 — 역DCF 일일 배치 (Vercel 크론). 300s 예산 내 동시성으로 처리·시간 초과분은 다음 실행이 이어받음(resumable).
// 유니버스 = 직전 as_of의 CIK 집합(로컬 파일 의존 없음). 값 코드에 안 박음(damodaran_* DB).
// STEP 947 §4~§5 — 유니버스를 넓혀 us_fundamentals(밸류에이션 분모 캐시)·us_valuation(PER·PBR·PSR·EV/EBITDA)을 같은 크론에서 채운다.
//   🔴 역DCF 계산 대상(revdcf_results)은 그대로 「직전 as_of의 revdcf_results CIK 집합」 — 604는 변하지 않는다.
//   넓어진 부분(us_cik_map ⋈ us_market_cap)은 재무만 수집한다. 처리 순서 = ①역DCF 유니버스 매일 전량 최우선 ②나머지 fetched_at 오래된 순.
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const BUDGET_MS = 270_000;
// 🔴 STEP 893(892 처방 B 적용): us_market_cap 읽기에 신선도 상한. lib/lensPrecompute.ts:142(at10(now-7일))와 같은 7일 기준 —
//   그 파일은 이 STEP 범위 밖(수정 금지)이라 상수를 복제한다. 값을 바꿀 땐 두 자리 모두 확인할 것.
//   근거·대가·재검토조건 = docs/REVDCF_SPEC.md A-12(892 처방 판정서).
const MCAP_TTL_DAYS = 7;

type Universe = { cik: number; symbol: string | null };

// STEP 947 — us_fundamentals 한 행 조립. dr.fundamentals은 skip 경로에도 실려 있다(drivers.ts §2-3).
//   dr.market(debt·비영업자산·주식수)은 ok:true일 때만 존재 — 없으면 null(0으로 채우지 않는다, valuation.ts와 같은 원칙).
function fundamentalsRow(u: Universe, dr: DriverResult, unavailableReason: string | null): Record<string, unknown> | null {
  if (!u.symbol) return null; // us_fundamentals PK가 symbol이라 심볼 없으면 쓸 수 없다(revdcf 유니버스의 과거 레거시 행 한정 가능성)
  const f = dr.fundamentals;
  const market = dr.ok ? dr.market : null;
  return {
    symbol: u.symbol, cik: u.cik,
    fiscal_year: f.fiscalYear,
    net_income: f.netIncome, equity: f.equity, revenue: f.revenue, operating_income: f.operatingIncome, dna: f.dna,
    // STEP 963 — 보통주 장부가·우선주·비지배지분(PBR 재계산 재료). equity는 그대로 총자기자본.
    common_equity: f.commonEquity, preferred_stock: f.preferredStock, minority_interest: f.minorityInterest,
    debt: market ? market.debt : null, non_operating_assets: market ? market.nonOperatingAssets : null, shares: market ? market.shares : null,
    source_tags: f.sourceTags,
    unavailable_reason: unavailableReason,
    fetched_at: new Date().toISOString(),
  };
}

// STEP 947 §5-4 — us_valuation 전량 계산. SEC 호출 0건(us_fundamentals + us_market_cap + us_stock_perf만 읽는다). try/finally로 항상 실행.
async function computeAndSaveValuation(sb: ReturnType<typeof createAdminClient>, asOf: string): Promise<{ saved: number; stalestFetchedAt: string | null }> {
  const fundRows: { symbol: string; cik: number; fiscal_year: number | null; net_income: number | null; equity: number | null; common_equity: number | null; revenue: number | null; operating_income: number | null; dna: number | null; debt: number | null; non_operating_assets: number | null; fetched_at: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_fundamentals").select("symbol,cik,fiscal_year,net_income,equity,common_equity,revenue,operating_income,dna,debt,non_operating_assets,fetched_at").range(f, f + 999); const c = (data ?? []) as typeof fundRows; fundRows.push(...c); if (c.length < 1000) break; }
  if (fundRows.length === 0) return { saved: 0, stalestFetchedAt: null };

  const mcapLatest = (await sb.from("us_market_cap").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const mcapRows: { symbol: string; market_cap: number }[] = [];
  if (mcapLatest) { for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").eq("as_of", mcapLatest.as_of).range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; } }
  const mcapBySym = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), r.market_cap]));

  // 표시용 현재가 — "stock_prices" 테이블은 저장소에 없다(STEP 947 §5-5 원문의 명칭이 정확치 않았음, 직접 확인).
  //   실제로 US 현재가를 들고 있는 테이블은 us_stock_perf.price(us-perf 크론이 채움) — 그걸 읽는다. 계산엔 안 쓴다(표시용).
  const priceRows: { symbol: string; price: number | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_stock_perf").select("symbol, price").range(f, f + 999); const c = (data ?? []) as typeof priceRows; priceRows.push(...c); if (c.length < 1000) break; }
  const priceBySym = new Map(priceRows.map((r) => [r.symbol.toUpperCase(), r.price]));

  const rows = fundRows.map((f) => {
    const marketCap = mcapBySym.get(f.symbol.toUpperCase()) ?? null;
    // STEP 963 — PBR 분모를 보통주 장부가(common_equity)로. equity(총자기자본)는 us_fundamentals에 그대로 남아 대조용으로 쓸 수 있다.
    const v = computeValuation({ marketCap, netIncome: f.net_income, equity: f.common_equity, revenue: f.revenue, operatingIncome: f.operating_income, dna: f.dna, debt: f.debt, nonOperatingAssets: f.non_operating_assets });
    const ageDays = f.fetched_at ? Math.round((Date.parse(asOf) - Date.parse(f.fetched_at)) / 86_400_000) : null;
    return {
      as_of: asOf, symbol: f.symbol, price: priceBySym.get(f.symbol.toUpperCase()) ?? null, market_cap: marketCap,
      per: v.per, pbr: v.pbr, psr: v.psr, ev_ebitda: v.evEbitda, ev: v.ev, ebitda: v.ebitda,
      per_basis: VALUATION_SPEC.per.basis, fundamentals_fiscal_year: f.fiscal_year, fundamentals_age_days: ageDays,
      unavailable: v.unavailable,
    };
  });

  let saved = 0;
  for (let i = 0; i < rows.length; i += 1000) { const batch = rows.slice(i, i + 1000); const { error } = await sb.from("us_valuation").upsert(batch, { onConflict: "as_of,symbol" }); if (!error) saved += batch.length; }
  const stalestFetchedAt = fundRows.reduce<string | null>((min, r) => (min == null || r.fetched_at < min ? r.fetched_at : min), null);
  return { saved, stalestFetchedAt };
}

// STEP 956 §3-3 — 업종 백분위 저장. SEC 호출 0건(us_valuation + us_sector_wide만 읽는다). try/finally로 항상 실행(947 §5-4와 같은 원칙).
// 🔴 STEP 973 — us_sector_wide는 크론이 매일 만드는 표가 아니다(952·955에서 스크립트로 1회 적재, 08-08 1,127행 이후 갱신 없음).
//   as_of 일치로 조인하면 오늘 as_of에 해당 행이 없는 날 전부 NO_SECTOR가 된다(08-09 실제 발생, 1,167/1,167).
//   /api/sector/us(945)가 us_sector_resolved에 쓰는 것과 같은 패턴 — 섹터는 시간이 지나도 거의 안 변하므로 "최신 as_of"를 그대로 쓴다.
//   🔴 신선도 상한(예: N일 이상 지나면 경고)은 이번 STEP에서 의도적으로 두지 않는다 — us_sector_wide 자체가
//   아직 크론화되지 않아 상한을 걸 "정상 갱신 주기"가 없다. 얼마나 오래된 섹터를 썼는지는 sector_as_of로 남긴다.
async function computeAndSaveSectorRelative(sb: ReturnType<typeof createAdminClient>, asOf: string): Promise<{ saved: number; sectorWideAdded: number; sectorWideError: string | null }> {
  const valuationRows = await fetchAllRows<{ symbol: string; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null }>(
    () => sb.from("us_valuation").select("symbol, per, pbr, psr, ev_ebitda").eq("as_of", asOf),
    [{ column: "symbol" }]
  );
  if (valuationRows.length === 0) return { saved: 0, sectorWideAdded: 0, sectorWideError: null };

  const latestSector = (await sb.from("us_sector_wide").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!latestSector) return { saved: 0, sectorWideAdded: 0, sectorWideError: null };
  const sectorAsOf = latestSector.as_of;

  // 🔴 STEP 974 — us_sector_wide 증분 갱신. 방식 ⓐ(장은태 승인): 신규 심볼만 resolveSector에 넣고 기존
  //   sectorAsOf에 그대로 append한다(새 as_of를 만들지 않는다). 기존 심볼은 재계산·재upsert하지 않는다 —
  //   섹터는 저빈도 개념(①-A: Damodaran 연1회·GICS 연1회·SEC SIC 연1회+이벤트, ①-B: SPDR 분기·나스닥 미공개
  //   — `docs/probe_974_step2_search.md`)이라 재계산해도 매일 값이 달라질 이유가 없고, 재upsert 자체가
  //   백분위를 미세하게 흔들 위험만 만든다. 실패해도 백분위 계산(아래)은 그대로 진행 — try/catch로 격리.
  let sectorWideAdded = 0;
  let sectorWideError: string | null = null;
  try {
    const existingSectorSymbols = await fetchAllRows<{ symbol: string }>(
      () => sb.from("us_sector_wide").select("symbol").eq("as_of", sectorAsOf),
      [{ column: "symbol" }]
    );
    const existingSet = new Set(existingSectorSymbols.map((r) => r.symbol));
    const missingSymbols = valuationRows.map((r) => r.symbol).filter((s) => !existingSet.has(s));

    if (missingSymbols.length > 0) {
      const resolved = await resolveSector(sb, missingSymbols); // lib/sector.ts 무변경, 호출만 — 외부 네트워크 호출 0건(4개 Supabase 테이블 read만)
      const newRows = toResolvedRows(sectorAsOf, missingSymbols, resolved); // lib/sectorCuts.ts 무변경, 호출만
      for (let i = 0; i < newRows.length; i += 1000) {
        const batch = newRows.slice(i, i + 1000);
        const { error } = await sb.from("us_sector_wide").upsert(batch, { onConflict: "as_of,symbol" });
        if (error) throw error;
      }
      sectorWideAdded = newRows.length;
    }
  } catch (e) {
    sectorWideAdded = 0;
    sectorWideError = e instanceof Error ? e.message : String(e);
  }

  // 증분 갱신 이후에 읽는다 — 신규 심볼이 포함된 상태로 백분위를 계산한다.
  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector").eq("as_of", sectorAsOf),
    [{ column: "symbol" }]
  );

  const valuations: ValuationInput[] = valuationRows.map((r) => ({ symbol: r.symbol, per: r.per, pbr: r.pbr, psr: r.psr, evEbitda: r.ev_ebitda }));
  const sectors: SectorInput[] = sectorRows.map((r) => ({ symbol: r.symbol, sector: r.sector }));
  const results = computeSectorRelativeBatch(valuations, sectors, SECTOR_RELATIVE_SPEC.minSample);

  const dbRows = results.map((r) => ({
    as_of: asOf, symbol: r.symbol, sector: r.sector, sector_as_of: sectorAsOf,
    per_pct: r.perPct, pbr_pct: r.pbrPct, psr_pct: r.psrPct, ev_ebitda_pct: r.evEbitdaPct,
    per_n: r.perN, pbr_n: r.pbrN, psr_n: r.psrN, ev_ebitda_n: r.evEbitdaN,
    unavailable: r.unavailable, min_sample: r.minSample,
    updated_at: new Date().toISOString(),
  }));

  let saved = 0;
  for (let i = 0; i < dbRows.length; i += 1000) { const batch = dbRows.slice(i, i + 1000); const { error } = await sb.from("us_sector_relative").upsert(batch, { onConflict: "as_of,symbol" }); if (!error) saved += batch.length; }
  return { saved, sectorWideAdded, sectorWideError };
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now();
  const sb = createAdminClient();
  const asOf = new Date().toISOString().slice(0, 10);

  // 유니버스 = 직전(최신) as_of의 CIK — 역DCF 계산 대상은 이 604건 그대로(넓히지 않는다)
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const prevAsOf = latest?.as_of;
  if (!prevAsOf) return NextResponse.json({ error: "no prior universe" }, { status: 400 });
  const univ: Universe[] = [];
  for (let from = 0; ; from += 1000) { const { data } = await sb.from("revdcf_results").select("cik, symbol").eq("as_of", prevAsOf).range(from, from + 999); const c = (data ?? []) as typeof univ; univ.push(...c); if (c.length < 1000) break; }
  const done = new Set<number>();
  if (prevAsOf === asOf) { /* 같은 날 재실행 = 전량 재계산이 아니라 이어받기: 이미 오늘 계산된 것 스킵 불가(덮어쓰기). 다른 날이면 today 스킵셋 사용. */ }
  else { for (let from = 0; ; from += 1000) { const { data } = await sb.from("revdcf_results").select("cik").eq("as_of", asOf).range(from, from + 999); const c = (data ?? []) as { cik: number }[]; for (const r of c) done.add(r.cik); if (c.length < 1000) break; } }
  const todoRevdcf: (Universe & { kind: "revdcf" })[] = univ.filter((u) => !done.has(u.cik)).map((u) => ({ ...u, kind: "revdcf" as const }));

  // 참조 데이터
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rf = +gi.riskfree_rate, erp = +gi.erp, inflation = +gi.expected_inflation, damoAsOf = gi.as_of;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[]).map((b) => [b.industry, b]));
  const { byTicker: indByT } = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
  const mcapRows: { symbol: string; market_cap: number; as_of: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap, as_of").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBy = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), r]));
  const mcapCutoff = new Date(Date.now() - MCAP_TTL_DAYS * 24 * 3600 * 1000).toISOString().slice(0, 10);

  // STEP 947 §4-1 — fundamentalsUniverse = us_cik_map ⋈ us_market_cap(최신 as_of). 역DCF 유니버스와 겹치는 CIK는 제외("나머지"만).
  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
  const cikBySymbol = new Map(cikRows.map((r) => [r.symbol.toUpperCase(), r.cik]));
  const fundamentalsUniverseAll: Universe[] = [];
  for (const [sym, row] of mcapBy) { const cik = cikBySymbol.get(sym); if (cik) fundamentalsUniverseAll.push({ cik, symbol: row.symbol }); }
  const revdcfCikSet = new Set(univ.map((u) => u.cik));
  const restCandidates = fundamentalsUniverseAll.filter((r) => !revdcfCikSet.has(r.cik));

  // §4-2 — "나머지"는 us_fundamentals.fetched_at 오래된 순(한 번도 없으면 최우선).
  const fundFetchedRows: { symbol: string; fetched_at: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_fundamentals").select("symbol, fetched_at").range(f, f + 999); const c = (data ?? []) as typeof fundFetchedRows; fundFetchedRows.push(...c); if (c.length < 1000) break; }
  const fetchedAtBySymbol = new Map(fundFetchedRows.map((r) => [r.symbol, r.fetched_at]));
  const NEVER = "1970-01-01T00:00:00Z";
  const restSorted = [...restCandidates].sort((a, b) => {
    const ta = (a.symbol && fetchedAtBySymbol.get(a.symbol)) ?? NEVER, tb = (b.symbol && fetchedAtBySymbol.get(b.symbol)) ?? NEVER;
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
  const todoRest: (Universe & { kind: "rest" })[] = restSorted.map((u) => ({ ...u, kind: "rest" as const }));
  const todo: ((Universe & { kind: "revdcf" }) | (Universe & { kind: "rest" }))[] = [...todoRevdcf, ...todoRest];

  let lastCall = 0;
  const throttle = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
  const wall = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);
  const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : v.kind === "below_one" ? 0 : v.kind === "over_cap" ? 100 : null);

  // 공통 SEC 취득(throttle+wall) — revdcf·rest 두 경로가 공유.
  async function fetchDrivers(cik: number): Promise<{ dr: DriverResult | null; unavailableReason: string | null }> {
    await throttle();
    const r = await wall(fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) }), 25000);
    if (!r.ok) return { dr: null, unavailableReason: `HTTP_${r.status}` };
    const j = (await wall(r.json(), 20000)) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
    const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
    return { dr, unavailableReason: dr.ok ? null : dr.skipReason };
  }

  async function processOne(u: Universe & { kind: "revdcf" | "rest" }): Promise<{ revdcfRow: Record<string, unknown> | null; fundRow: Record<string, unknown> | null }> {
    const symbol = u.symbol;
    if (u.kind === "rest") {
      // §4-3 "아니면" 분기 — us_fundamentals upsert만. revdcf_results에는 쓰지 않는다.
      try {
        const { dr, unavailableReason } = await fetchDrivers(u.cik);
        if (!dr) return { revdcfRow: null, fundRow: symbol ? { symbol, cik: u.cik, unavailable_reason: unavailableReason, fetched_at: new Date().toISOString() } : null };
        return { revdcfRow: null, fundRow: fundamentalsRow(u, dr, unavailableReason) };
      } catch (e) {
        return { revdcfRow: null, fundRow: symbol ? { symbol, cik: u.cik, unavailable_reason: "EX", fetched_at: new Date().toISOString() } : null };
      }
    }

    // kind === "revdcf" — §4-3 "역DCF 유니버스면" 분기: 지금 하던 일 그대로 + us_fundamentals upsert.
    const base: Record<string, unknown> = { as_of: asOf, cik: u.cik, symbol, verdict: "skipped", flags: {}, skip_reason: null };
    try {
      const { dr, unavailableReason } = await fetchDrivers(u.cik);
      if (!dr) return { revdcfRow: { ...base, skip_reason: unavailableReason }, fundRow: symbol ? { symbol, cik: u.cik, unavailable_reason: unavailableReason, fetched_at: new Date().toISOString() } : null };
      const fundRow = fundamentalsRow(u, dr, unavailableReason);
      if (!dr.ok) return { revdcfRow: { ...base, skip_reason: dr.skipReason, flags: { ...dr.flags, damodaranAsOf: damoAsOf } }, fundRow };
      const ind = symbol ? indByT.get(symbol.toUpperCase()) : undefined; const beta = ind ? betaByInd.get(ind) : undefined; const mcapRow = symbol ? mcapBy.get(symbol.toUpperCase()) : undefined;
      if (!ind || !beta) return { revdcfRow: { ...base, skip_reason: "NO_INDUSTRY", flags: { ...dr.flags, damodaranAsOf: damoAsOf } }, fundRow };
      if (!mcapRow || !(mcapRow.market_cap > 0)) return { revdcfRow: { ...base, skip_reason: "NO_MARKETCAP", flags: { ...dr.flags, damodaranAsOf: damoAsOf } }, fundRow };
      // 🔴 STEP 893 — 시총이 없는 것과 묵은 것은 다른 상태다(888/889 원칙). us_market_cap은 symbol 단일 PK 누적 캐시라
      //   갱신 실패 심볼이 옛 as_of째로 조용히 남는다(891/892 실측 — 892 처방 B). 나이를 flags에 남기고 별도 사유로 분기.
      if (mcapRow.as_of < mcapCutoff) {
        const ageDays = Math.round((Date.parse(asOf) - Date.parse(mcapRow.as_of)) / 86_400_000);
        return { revdcfRow: { ...base, skip_reason: "STALE_MARKETCAP", flags: { ...dr.flags, damodaranAsOf: damoAsOf, marketCapAsOf: mcapRow.as_of, marketCapAgeDays: ageDays } }, fundRow };
      }
      const mcap = mcapRow.market_cap;
      const deRatio = dr.market.debt / mcap;
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
      const sharePrice = mcap / dr.market.shares;
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
      // 🔴 STEP 880: driver 5 ③판정 — 주 판정 = 원전식(marginal). level은 근거 부재로 내림(879).
      if (dr.drivers.fixedCapitalRateMarginal == null)
        return { revdcfRow: { ...base, skip_reason: "NO_MARGINAL_CAPEX", flags: { ...dr.flags, damodaranAsOf: damoAsOf } }, fundRow };
      const drv = { ...dr.drivers, taxRate: usTax, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal };
      // 🔴 STEP 859: 원전 T8 지평 = 25년(PIE C31 LOOKUP D27:AB27). over_cap = "25년 가치 < 주가"(원전 "25+"). 이전 100은 원전 이탈이었음.
      // 🔴 STEP 919(#40): 리터럴 25 3곳을 `REVDCF_DEFAULT_MAX_YEARS`로 통일 — 값은 그대로 25, 화면 문구(overCapExplained)와 이제 한 곳을 공유.
      const sens = computeGapWithSensitivity(drv, market, { maxYears: REVDCF_DEFAULT_MAX_YEARS });
      const eng = runRevDcf(drv, market, { maxYears: REVDCF_DEFAULT_MAX_YEARS });
      let vm: string | null = null, gm: number | null = null;
      if (dr.drivers.fixedCapitalRateMarginal != null) { const m = runRevDcf({ ...drv, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal }, market, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict; vm = m.kind; gm = m.kind === "years" ? m.gap : null; }
      return {
        revdcfRow: {
          ...base, verdict: sens.base.kind, gap_years: sens.base.kind === "years" ? sens.base.gap : null, explained_pct: sens.base.kind === "over_cap" ? sens.base.explainedPct : null,
          gap_wacc_minus1: gnum(sens.waccMinus1), gap_wacc_plus1: gnum(sens.waccPlus1), threshold_margin: eng.thresholdMargin, monotonic: eng.monotonic,
          sales_growth: dr.drivers.salesGrowth, operating_margin: dr.drivers.operatingMargin, starting_margin: dr.drivers.startingMargin,
          tax_rate: usTax, fixed_capital_rate: drv.fixedCapitalRate, working_capital_rate: dr.drivers.workingCapitalRate,
          fixed_capital_rate_level: dr.drivers.fixedCapitalRateLevel, fixed_capital_rate_marginal: dr.drivers.fixedCapitalRateMarginal, verdict_marginal: vm, gap_years_marginal: gm,
          wacc: w.wacc, beta_unlevered: +beta.unlevered_beta_cash_adj, de_ratio: deRatio, debt: dr.market.debt, non_operating_assets: dr.market.nonOperatingAssets, shares: dr.market.shares, share_price: sharePrice,
          flags: { ...dr.flags, industry: ind, inflationUsed: inflation, damodaranAsOf: damoAsOf, marketCap: mcap },
        },
        fundRow,
      };
    } catch (e) { return { revdcfRow: { ...base, skip_reason: "EX", flags: { ex: String((e as Error).message).slice(0, 80) } }, fundRow: symbol ? { symbol, cik: u.cik, unavailable_reason: "EX", fetched_at: new Date().toISOString() } : null }; }
  }

  // 시간 예산 내 동시성 6 워커풀
  let idx = 0, saved = 0, fundamentalsSaved = 0;
  const buffer: Record<string, unknown>[] = [];
  const fundBuffer: Record<string, unknown>[] = [];
  const flush = async () => { if (!buffer.length) return; const batch = buffer.splice(0, buffer.length); const { error } = await sb.from("revdcf_results").upsert(batch, { onConflict: "as_of,cik" }); if (!error) saved += batch.length; };
  const flushFund = async () => { if (!fundBuffer.length) return; const batch = fundBuffer.splice(0, fundBuffer.length); const { error } = await sb.from("us_fundamentals").upsert(batch, { onConflict: "symbol" }); if (!error) fundamentalsSaved += batch.length; };
  async function worker() {
    while (idx < todo.length && Date.now() - t0 < BUDGET_MS) {
      const u = todo[idx++];
      const { revdcfRow, fundRow } = await processOne(u);
      if (revdcfRow) buffer.push(revdcfRow);
      if (fundRow) fundBuffer.push(fundRow);
      if (buffer.length >= 40) await flush();
      if (fundBuffer.length >= 40) await flushFund();
    }
  }

  let valuationSaved = 0, fundamentalsStalest: string | null = null, sectorRelativeSaved = 0;
  let sectorWideAdded = 0, sectorWideError: string | null = null;
  try {
    await Promise.all(Array.from({ length: 6 }, worker));
    await flush();
    await flushFund();
  } finally {
    // §5-4 — 예산이 소진돼 위 루프가 중단됐어도 valuation 계산은 반드시 돈다(SEC 호출 0건).
    const v = await computeAndSaveValuation(sb, asOf);
    valuationSaved = v.saved;
    fundamentalsStalest = v.stalestFetchedAt;
    // STEP 956 §3-3 — us_valuation 계산 직후. 같은 이유로 finally 안(예산 소진과 무관하게 항상 실행).
    const sr = await computeAndSaveSectorRelative(sb, asOf);
    sectorRelativeSaved = sr.saved;
    sectorWideAdded = sr.sectorWideAdded;
    sectorWideError = sr.sectorWideError;
  }

  const finished = idx >= todo.length;
  return NextResponse.json({
    asOf, universe: univ.length, todoAtStart: todo.length, processed: idx, saved, finished, elapsedMs: Date.now() - t0,
    // STEP 947 §4-5
    revdcfUniverse: todoRevdcf.length, fundamentalsUniverse: fundamentalsUniverseAll.length, fundamentalsSaved, fundamentalsStalest, valuationSaved,
    // STEP 956 §3-3
    sectorRelativeSaved,
    // STEP 974 §2 — us_sector_wide 증분 갱신 결과
    sectorWideAdded, sectorWideError,
  });
}
