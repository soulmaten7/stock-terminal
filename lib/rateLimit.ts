// 무인증 LLM '신규 생성' 라우트 공용 가드(STEP 793). 캐시 히트에는 적용 안 함 —
// 각 라우트가 캐시 미스(= 새 유료 LLM 호출) 직전에만 blockLLM()을 호출한다.
// 서버리스 인스턴스별 in-memory라 분산 환경에서 완벽하진 않으나, 스크립트성 대량 남용과
// 크롤러가 sitemap의 수천 종목을 훑어 심볼당 LLM을 유발하는 통로를 1차 차단한다.
import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

// 알려진 크롤러/봇 — 종목 페이지를 훑을 때 신규 생성을 막고 캐시 히트만 응답하게 한다.
const BOT_RE =
  /bot\b|bot\/|spider|crawler|slurp|googlebot|bingbot|bingpreview|yandexbot|baiduspider|duckduckbot|sogou|exabot|facebookexternalhit|facebot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|gptbot|ccbot|claudebot|bytespider|amazonbot|applebot|headlesschrome|python-requests|curl\/|wget\//i;

export function isBotUA(ua: string | null | undefined): boolean {
  return !!ua && BOT_RE.test(ua);
}

// Vercel은 x-real-ip를 신뢰 클라이언트 IP로 세팅(엣지에서 위조 불가) → 레이트리밋 키 위조 방지(STEP 797 §3).
// x-forwarded-for 첫 요소는 클라가 prepend할 수 있어 후순위 폴백(로컬 dev 등).
export function clientIp(req: Request | NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

type Window = { at: number; n: number };
const minuteMap = new Map<string, Window>();
const hourMap = new Map<string, Window>();
const HARD_CAP = 20000; // 맵당 최대 항목 — 초과 시 오래된 것부터 제거(삽입순 Map)
let lastSweepAt = 0;

// 만료분 청소 — 매 요청 O(n) 순회하던 증폭기 제거(STEP 797 §3): 60초에 1회만 순회 + 하드 상한.
function sweepIfDue(now: number) {
  if (now - lastSweepAt < 60_000) return;
  lastSweepAt = now;
  for (const [map, span] of [[minuteMap, 60_000], [hourMap, 3_600_000]] as const) {
    for (const [k, w] of map) if (now - w.at >= span) map.delete(k);
    if (map.size > HARD_CAP) {
      let excess = map.size - HARD_CAP;
      for (const k of map.keys()) { if (excess-- <= 0) break; map.delete(k); }
    }
  }
}

// 소비 없이 통과 가능 여부만(peek) — 한쪽 창만 소비하고 거부하는 불공정 제거를 위해 먼저 둘 다 검사.
function windowOk(map: Map<string, Window>, key: string, span: number, cap: number, now: number): boolean {
  const w = map.get(key);
  if (!w || now - w.at >= span) return true; // 새 창
  return w.n < cap;
}
function consume(map: Map<string, Window>, key: string, span: number, now: number) {
  let w = map.get(key);
  if (!w || now - w.at >= span) { w = { at: now, n: 0 }; map.set(key, w); }
  w.n++;
}

// 관측성 — 차단 카운터를 주기적으로 1건만 Sentry에 요약(베타 "요약이 안 떠요" 신고 시 게이트 탓인지 판별용).
// ⚠️ IP·키는 절대 로그에 남기지 않는다(개인정보) — 집계 수치만.
let blockCount = 0;
let lastReportAt = 0;
function noteBlock(now: number) {
  blockCount++;
  if (now - lastReportAt >= 300_000) {
    lastReportAt = now;
    Sentry.captureMessage(`[rateLimit] blocked ${blockCount} new-generation requests (rolling 5m window)`, "info");
    blockCount = 0;
  }
}

// IP 기준 신규 생성 허용 여부. 분·시간 두 창을 모두 통과해야 true.
// 상한은 '사람 여유 넉넉 + 스크립트 봉인' 절충 — 종목 페이지 1회 로드가 brief+news-brief 2건을 유발하므로
// 활발한 탐색(분당 여러 새 종목)에도 실사용자는 안 걸리게. 스크립트성 대량 남용은 봇-UA 차단이 1차로 잡는다.
export function allowGeneration(key: string, perMin = 12, perHour = 100): boolean {
  const now = Date.now();
  sweepIfDue(now);
  // 두 창 모두 통과해야 소비(한쪽만 올리고 거부하던 순서 문제 제거).
  if (!windowOk(minuteMap, key, 60_000, perMin, now) || !windowOk(hourMap, key, 3_600_000, perHour, now)) {
    noteBlock(now);
    return false;
  }
  consume(minuteMap, key, 60_000, now);
  consume(hourMap, key, 3_600_000, now);
  return true;
}

// 신규 LLM 생성을 막아야 하면 true — 봇이거나 레이트리밋 초과. 호출부는 429 + 빈 응답으로 조용히 숨긴다.
export function blockLLM(req: NextRequest): boolean {
  if (isBotUA(req.headers.get("user-agent"))) return true;
  return !allowGeneration(`llm:${clientIp(req)}`);
}
