import { createHash } from "crypto";

// 공시요약(filing_summaries) 캐시 키 — 반드시 검증된 '본문 URL'에서만 파생한다(STEP 793/797).
// 클라가 넘긴 별도 id를 키로 쓰면, 임의 문서를 임의 id로 저장하는 캐시 포이즈닝이 가능해진다.
// URL 해시로 키를 소스에만 묶어 CN/VN/GB를 한 규칙으로 통일. (SSRF 허용목록 검증은 각 라우트가 먼저 수행)
export function urlCacheKey(prefix: string, url: string): string {
  return prefix + createHash("sha1").update(url).digest("hex").slice(0, 24);
}
