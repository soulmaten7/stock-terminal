// STEP 938 — damodaran_industry 조회를 한 곳으로 모은다.
// 규칙 5-2(y=f(x)): 값이 아니라 식을 만든다 — 출처·반환필드를 인자로 받고, 반환에 출처를 동봉한다.
// 🔴 이 STEP은 source="damodaran" · field="industryGroup" 한 조합만 구현한다. 다른 조합(SEC·나스닥·primary_sector)은 939 이후.
import type { SupabaseClient } from "@supabase/supabase-js";
// STEP 940 — Q0 「2-of-2 합의제」 3순위 SIC 재료. 939가 보존한 스냅샷(재취득 없이 그대로 참조).
// 🔴 날짜가 박힌 파일명 — 재취득 시 새 좌표로 교체(939 관행: registry.ts에 좌표, 값은 여기 안 박음).
import missing219 from "../data/sources/sec/sec_sic_missing219_20260808.json";

export type SectorMap = {
  byTicker: Map<string, string>;
  rows: number;
  source: "damodaran";
};

export async function fetchSectorMap(
  sb: SupabaseClient,
  opts: { field: "industryGroup"; source: "damodaran" }
): Promise<SectorMap> {
  const rows: { ticker_norm: string; industry_group: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group").eq("is_us_listed", true).range(f, f + 999);
    const c = (data ?? []) as typeof rows;
    rows.push(...c);
    if (c.length < 1000) break;
  }
  const byTicker = new Map(rows.map((r) => [r.ticker_norm, r.industry_group]));
  return { byTicker, rows: rows.length, source: opts.source };
}

// ────────────────────────────────────────────────────────────────
// STEP 940 — sector 모드: Q0 「2-of-2 합의제」 0~4순위 해석기.
// 🔴 industryGroup 모드(위)와 완전히 분리 — 이 아래는 별도 함수·별도 반환 타입, 기존 동작에 영향 없음.
// ────────────────────────────────────────────────────────────────

export type SectorSource = "spdr" | "damodaran" | "damodaran-sibling" | "consensus";
export type SectorResolution = { sector: string; source: SectorSource; agreed?: boolean };

const norm = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, "");

// 나스닥 12분류 → GICS 11 (939 §940-3 확정 대응). 🔴 Miscellaneous는 매핑하지 않는다(미분류로 흘림).
const NASDAQ_TO_GICS: Record<string, string> = {
  Finance: "Financials",
  "Basic Materials": "Materials",
  Technology: "Information Technology",
  Telecommunications: "Communication Services",
  "Consumer Discretionary": "Consumer Discretionary",
  "Consumer Staples": "Consumer Staples",
  Energy: "Energy",
  "Health Care": "Health Care",
  Industrials: "Industrials",
  "Real Estate": "Real Estate",
  Utilities: "Utilities",
};

const SIC_CONSENSUS_THRESHOLD = 0.7;

async function fetchAll<T>(sb: SupabaseClient, table: string, select: string, eqFilter?: [string, unknown]): Promise<T[]> {
  const rows: T[] = [];
  for (let f = 0; ; f += 1000) {
    let q = sb.from(table).select(select);
    if (eqFilter) q = q.eq(eqFilter[0], eqFilter[1] as never);
    const { data } = await q.range(f, f + 999);
    const c = (data ?? []) as T[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  return rows;
}

async function latestAsOf(sb: SupabaseClient, table: string): Promise<string | null> {
  const { data } = await sb.from(table).select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle();
  return (data as { as_of: string } | null)?.as_of ?? null;
}

/**
 * Q0 「2-of-2 합의제」 — 대상 티커별 섹터를 0~4순위로 해석한다.
 * 🔴 target 심볼 목록은 호출부가 정한다(예: lens_scores US) — 이 함수는 그 목록을 모르는 상태로 재사용 가능해야 한다(규칙 5-2).
 * 반환 Map에 없는 심볼 = 미분류(4순위, source=null과 동치).
 */
export async function resolveSector(
  sb: SupabaseClient,
  targets: string[],
  opts?: { spdrAsOf?: string; nasdaqAsOf?: string; skipTier0?: boolean }
): Promise<Map<string, SectorResolution>> {
  const result = new Map<string, SectorResolution>();
  const remaining = new Set(targets.map(norm));
  const targetNormToOriginal = new Map(targets.map((t) => [norm(t), t]));

  // ── 0순위: SPDR(us_sector_gics, 진짜 GICS) ──────────────────────────────
  // 🔴 skipTier0: 940 §4-2(0순위 제외 채점) 전용 — 1~3순위만 SPDR 정답지로 정확도를 잴 때 쓴다. 기본 동작(false) 불변.
  if (!opts?.skipTier0) {
    const spdrAsOf = opts?.spdrAsOf ?? (await latestAsOf(sb, "us_sector_gics"));
    const gicsRows = spdrAsOf
      ? await fetchAll<{ symbol: string; sector: string }>(sb, "us_sector_gics", "symbol, sector", ["as_of", spdrAsOf])
      : [];
    for (const r of gicsRows) {
      const n = norm(r.symbol);
      if (remaining.has(n)) { result.set(targetNormToOriginal.get(n)!, { sector: r.sector, source: "spdr" }); remaining.delete(n); }
    }
  }

  // ── 1순위: Damodaran 직접(ticker_norm 매칭) ─────────────────────────────
  const damo = await fetchAll<{ ticker_norm: string; primary_sector: string | null; sic_code: string | null }>(
    sb, "damodaran_industry", "ticker_norm, primary_sector, sic_code", ["is_us_listed", true]
  );
  const damoByNorm = new Map(damo.map((r) => [r.ticker_norm, r]));
  for (const n of Array.from(remaining)) {
    const d = damoByNorm.get(n);
    if (d?.primary_sector) { result.set(targetNormToOriginal.get(n)!, { sector: d.primary_sector, source: "damodaran" }); remaining.delete(n); }
  }

  // ── 2순위: 형제 주식클래스 ────────────────────────────────────────────
  // 🔴 940 실측으로 발견·수정: 패턴(마지막 1글자 뗀 뿌리 일치·±1글자)을 구두점 유무와 무관하게 전체
  // 6,937행에 돌리면 무관한 회사끼리 오매칭된다(예: ASML→ASMB[Assembly Biosciences], 전혀 다른 회사·
  // 섹터도 다름 — 940 §④ 원인규명, 35건 중 대부분이 이런 우연 매칭이었다).
  // → (a) 원본 티커에 구두점(.·-)이 있을 때만 뿌리 패턴을 시도한다(BRK-B·MOG-A·HEI-A·WSO-B·UHAL-B·MKC-V처럼
  //   회사가 스스로 클래스를 명시한 경우만 — 구두점 없는 두 티커가 우연히 비슷한 경우와 구분하는 유일한 신호).
  // (b) 구두점이 없는데도 실제로 존재하는 불규칙 쌍(GOOG/GOOGL·FOX/FOXA·NWS/NWSA)은 일반화된 패턴으로
  //   안전하게 구분할 수 없어 — 3사만 사실로 등재한다(회사가 실제로 그렇게 배정한 티커, 규칙 A분류).
  // 🔴 후보 티커(ticker_norm)가 2개 이상이면 임의 선택 금지 — 미분류로 넘긴다.
  const KNOWN_SIBLING_PAIRS: Record<string, string> = {
    GOOG: "GOOGL", GOOGL: "GOOG",
    FOX: "FOXA", FOXA: "FOX",
    NWS: "NWSA", NWSA: "NWS",
  };
  for (const n of Array.from(remaining)) {
    const original = targetNormToOriginal.get(n)!;
    const candidates = new Set<string>();

    if (/[.\-]/.test(original)) {
      const root = n.slice(0, -1);
      for (const d of damo) {
        if (!d.primary_sector) continue;
        const dn = d.ticker_norm;
        if (dn === n) continue;
        const sameRoot = dn.length === n.length && dn.slice(0, -1) === root;
        const nPlus1 = dn.length === n.length + 1 && dn.startsWith(n);
        const nMinus1 = dn.length === n.length - 1 && n.startsWith(dn);
        if (sameRoot || nPlus1 || nMinus1) candidates.add(dn);
      }
    }
    const known = KNOWN_SIBLING_PAIRS[n];
    if (known && damoByNorm.get(known)?.primary_sector) candidates.add(known);

    if (candidates.size === 1) {
      const only = damoByNorm.get(Array.from(candidates)[0])!;
      result.set(original, { sector: only.primary_sector!, source: "damodaran-sibling" });
      remaining.delete(n);
    }
  }

  // ── 3순위: 나스닥 ∩ SEC SIC 「합의」 ─────────────────────────────────────
  if (remaining.size > 0) {
    // SIC코드별 최빈 섹터(Damodaran 분포에서 유도, sic_code='0'은 결측 placeholder라 제외)
    const sicCount = new Map<string, Map<string, number>>();
    for (const d of damo) {
      if (!d.sic_code || d.sic_code === "0" || !d.primary_sector) continue;
      if (!sicCount.has(d.sic_code)) sicCount.set(d.sic_code, new Map());
      const m = sicCount.get(d.sic_code)!;
      m.set(d.primary_sector, (m.get(d.primary_sector) ?? 0) + 1);
    }
    const sicMajority = new Map<string, string>(); // sic_code → 섹터(70%↑일 때만)
    for (const [sic, counts] of sicCount) {
      const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
      let top: [string, number] = ["", 0];
      for (const e of counts) if (e[1] > top[1]) top = e;
      if (top[1] / total >= SIC_CONSENSUS_THRESHOLD) sicMajority.set(sic, top[0]);
    }

    const nasdaqAsOf = opts?.nasdaqAsOf ?? (await latestAsOf(sb, "us_sector_nasdaq"));
    const nasdaqRows = nasdaqAsOf
      ? await fetchAll<{ symbol: string; sector: string | null }>(sb, "us_sector_nasdaq", "symbol, sector", ["as_of", nasdaqAsOf])
      : [];
    const nasdaqByNorm = new Map(nasdaqRows.map((r) => [norm(r.symbol), r.sector]));

    const sicBySymbol = new Map((missing219 as { data: { symbol: string; sic: string }[] }).data.map((r) => [norm(r.symbol), r.sic]));

    for (const n of Array.from(remaining)) {
      const nasdaqSector = nasdaqByNorm.get(n);
      const gics1 = nasdaqSector ? NASDAQ_TO_GICS[nasdaqSector] : undefined; // Miscellaneous·미등재 → undefined
      const sic = sicBySymbol.get(n);
      const gics2 = sic ? sicMajority.get(sic) : undefined;
      if (gics1 && gics2 && gics1 === gics2) {
        result.set(targetNormToOriginal.get(n)!, { sector: gics1, source: "consensus", agreed: true });
        remaining.delete(n);
      }
    }
  }

  // ── 4순위: 미분류 — remaining에 남은 것은 Map에 넣지 않는다(부재 = 미분류) ──
  return result;
}
