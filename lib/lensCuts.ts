// 분포 유도 '판정 컷'(lens_cuts) — 시장별 값 분포의 하위30%/상위30%(p30/p70)에서 산출한 컷.
// STEP 805: 렌즈 verdict를 코드 상수 대신 이 컷으로 판정한다(상수는 시장 레벨 차이를 종목 특성으로 오판했음).
// ⚠️ 컷이 없으면 판정하지 않는다(임의 상수 폴백 금지) → state='pending'(화면 "기준 준비 중").
// 제외(고정 표준값): RSI 30/70(technical)·F-Score 3/7 — 학술·업계 표준이라 분포 유도 부적합.
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "./supabase/admin";

export type Cut = { lo: number; hi: number };
export type CutMeta = Cut & { n: number; asOf: string | null };
export type CutMap = Record<string, CutMeta>;

// 분포 유도 컷을 쓰는 렌즈 5종(technical·fscore 제외).
export const CUT_LENSES = ["momentum", "lowvol", "valuation", "quality", "assetgrowth"] as const;

// 방향 — 높을수록 우호(high) / 낮을수록 우호(low). 컷 해석에 반영(STEP 805 §1).
export const CUT_DIR: Record<string, "high" | "low"> = {
  momentum: "high", quality: "high",              // 높을수록 우호
  lowvol: "low", valuation: "low", assetgrowth: "low", // 낮을수록 우호
};

// 렌즈별 3-state 이름 [good, mid, bad] — 방향(CUT_DIR) 기준 우호/중립/비우호.
const CUT_STATES: Record<string, [string, string, string]> = {
  momentum: ["up", "flat", "down"],
  quality: ["high", "mid", "low"],
  lowvol: ["calm", "mid", "jumpy"],
  valuation: ["cheap", "mid", "rich"],
  assetgrowth: ["conservative", "mid", "aggressive"],
};

// 심볼 → 시장 코드(lens_cuts.market). 컷은 KR·US만 산출(선계산 크론 있는 시장) — 그 외는 컷 없음 → pending.
export function marketOf(symbol: string): string {
  const s = (symbol || "").toUpperCase();
  if (/^\d{6}$/.test(s) || /\.(KS|KQ)$/.test(s)) return "KR";
  if (/\.T$/.test(s)) return "JP";
  if (/\.(SS|SZ)$/.test(s)) return "CN";
  if (/\.HK$/.test(s)) return "HK";
  if (/\.L$/.test(s)) return "GB";
  if (/\.VN$/.test(s)) return "VN";
  return "US";
}

// value + cut → state. 방향 반영. value 없으면 null(호출부가 na 처리), cut 없으면 'pending'(기준 준비 중).
// 경계는 기존 상수 판정과 동일 부등호(> hi / < lo) 유지.
export function stateFromCut(lensKey: string, value: number | null, cut: Cut | undefined): string | null {
  if (value == null) return null;
  if (!cut) return "pending";
  const spec = CUT_STATES[lensKey];
  if (!spec) return null;
  const [good, mid, bad] = spec;
  if (CUT_DIR[lensKey] === "high") return value > cut.hi ? good : value < cut.lo ? bad : mid;
  return value < cut.lo ? good : value > cut.hi ? bad : mid; // dir low
}

// 모듈 레벨 TTL 캐시(10분·STEP 806 §4) — 컷은 하루 1회만 바뀌므로 요청마다 DB 조회·admin 클라 신규 생성 낭비 제거.
//   또한 일시 DB 오류 시 마지막 정상 컷을 재사용 → "탐색=강점3 / 상세=기준 준비 중" 갈림(오류를 pending으로 오인) 방지.
const CUTS_TTL_MS = 10 * 60 * 1000;
const cutsCache = new Map<string, { at: number; cuts: CutMap }>();

// 시장 컷 로드(캐시 우선). error는 삼키지 않고 Sentry 캡처 + 캐시 폴백. 캐시도 없고 오류면 throw(호출부가 '일시 오류'로 구분).
export async function loadCuts(market: string, now = 0): Promise<CutMap> {
  const t = now || cacheClock();
  const hit = cutsCache.get(market);
  if (hit && t - hit.at < CUTS_TTL_MS) return hit.cuts;
  const sb = createAdminClient();
  const { data, error } = await sb.from("lens_cuts").select("lens_key,lo,hi,n,as_of").eq("market", market);
  if (error) {
    Sentry.captureException(error, { tags: { pipeline: "lens_cuts_load", market } });
    if (hit) return hit.cuts; // 마지막 정상 컷 재사용(pending 오인 방지)
    throw new Error(`lens_cuts load failed: ${error.message}`); // 캐시도 없으면 '컷 없음'이 아니라 '오류'로 전파
  }
  const out: CutMap = {};
  for (const r of (data ?? []) as { lens_key: string; lo: number; hi: number; n: number; as_of: string | null }[]) {
    out[r.lens_key] = { lo: Number(r.lo), hi: Number(r.hi), n: r.n, asOf: r.as_of };
  }
  cutsCache.set(market, { at: t, cuts: out });
  return out;
}
// Date.now() 래퍼(테스트 주입 여지) — 캐시 만료 판정 전용.
function cacheClock(): number {
  return Date.now();
}
