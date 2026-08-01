// STEP 854 — 역DCF 노출 피처 플래그 (기본 OFF · 서버 사이드).
// 🔴 NEXT_PUBLIC_ 접두어 금지 — Vercel 빌드캐시 재사용 시 인라인 실패 함정(CLAUDE.md). 서버 env만.
// 🔴 켜는 것은 장은태 육안 검증·승인 후. 없으면 꺼진 것으로 취급.
export function revdcfEnabled(): boolean {
  return process.env.REVDCF_ENABLED === "true";
}
