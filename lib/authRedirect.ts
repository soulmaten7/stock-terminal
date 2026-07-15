// OAuth 콜백 복귀 경로 유틸 (순수 함수 — 유닛테스트 대상).
// - safeNextPath: 오픈 리다이렉트 방지. 내부 절대경로("/...")만 허용, //·외부 URL·상대경로는 "/"로.
// - localizePath: as-needed 로케일 프리픽스. en이면 "/en" 접두, ko는 그대로(프리픽스 없음).

export function safeNextPath(nextRaw: string | null | undefined): string {
  const n = nextRaw ?? "/";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export function localizePath(path: string, loc: "ko" | "en"): string {
  if (loc !== "en") return path;
  // 이미 /en 프리픽스면 중복 방지(방어적)
  if (path === "/en" || path.startsWith("/en/") || path.startsWith("/en?")) return path;
  return path === "/" ? "/en" : `/en${path}`;
}
