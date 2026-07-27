// 무인증 LLM '신규 생성' 라우트 공용 가드(STEP 793). 캐시 히트에는 적용 안 함 —
// 각 라우트가 캐시 미스(= 새 유료 LLM 호출) 직전에만 blockLLM()을 호출한다.
// 서버리스 인스턴스별 in-memory라 분산 환경에서 완벽하진 않으나, 스크립트성 대량 남용과
// 크롤러가 sitemap의 수천 종목을 훑어 심볼당 LLM을 유발하는 통로를 1차 차단한다.
import type { NextRequest } from "next/server";

// 알려진 크롤러/봇 — 종목 페이지를 훑을 때 신규 생성을 막고 캐시 히트만 응답하게 한다.
const BOT_RE =
  /bot\b|bot\/|spider|crawler|slurp|googlebot|bingbot|bingpreview|yandexbot|baiduspider|duckduckbot|sogou|exabot|facebookexternalhit|facebot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|gptbot|ccbot|claudebot|bytespider|amazonbot|applebot|headlesschrome|python-requests|curl\/|wget\//i;

export function isBotUA(ua: string | null | undefined): boolean {
  return !!ua && BOT_RE.test(ua);
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

type Window = { at: number; n: number };
const minuteMap = new Map<string, Window>();
const hourMap = new Map<string, Window>();

// 맵 무한 성장 방지(장수 인스턴스 대비) — 임계 넘으면 만료분 청소.
function sweep(map: Map<string, Window>, span: number, now: number) {
  if (map.size < 5000) return;
  for (const [k, w] of map) if (now - w.at >= span) map.delete(k);
}

function bump(map: Map<string, Window>, key: string, span: number, cap: number, now: number): boolean {
  let w = map.get(key);
  if (!w || now - w.at >= span) {
    w = { at: now, n: 0 };
    map.set(key, w);
  }
  if (w.n >= cap) return false;
  w.n++;
  return true;
}

// IP 기준 신규 생성 허용 여부. 분·시간 두 창을 모두 통과해야 true.
// 상한은 '사람 여유 넉넉 + 스크립트 봉인' 절충 — 종목 페이지 1회 로드가 brief+news-brief 2건을 유발하므로
// 활발한 탐색(분당 여러 새 종목)에도 실사용자는 안 걸리게. 스크립트성 대량 남용은 봇-UA 차단이 1차로 잡는다.
export function allowGeneration(key: string, perMin = 12, perHour = 100): boolean {
  const now = Date.now();
  sweep(minuteMap, 60_000, now);
  sweep(hourMap, 3_600_000, now);
  if (!bump(minuteMap, key, 60_000, perMin, now)) return false;
  if (!bump(hourMap, key, 3_600_000, perHour, now)) return false;
  return true;
}

// 신규 LLM 생성을 막아야 하면 true — 봇이거나 레이트리밋 초과. 호출부는 429 + 빈 응답으로 조용히 숨긴다.
export function blockLLM(req: NextRequest): boolean {
  if (isBotUA(req.headers.get("user-agent"))) return true;
  return !allowGeneration(`llm:${clientIp(req)}`);
}
