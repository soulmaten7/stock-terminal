import { redirect } from "next/navigation";

/**
 * Layer 0: 단타창(/scalper) 자동 리다이렉트
 * Layer 1 예정: 사용자 성향 선택 기억 + 시간 기반 동적 리다이렉트
 *   - 첫 방문 → 성향 선택 페이지
 *   - 재방문 → localStorage 기반 본인 창 자동 입장
 *   - 비로그인 → 시간 기반 (장중=단타 / 저녁=장타 / 새벽=미장)
 *
 * 기존 V3 5섹션 홈은 /dashboard 에 보존.
 */
export default function RootPage() {
  redirect("/scalper");
}
