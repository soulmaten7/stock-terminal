import { redirect } from "next/navigation";

/**
 * Layer 0: 한국주식창(/kr) 자동 리다이렉트
 * STEP 117 예정: 새 홈 (/ = 시장 지표 + 관심 + 핫 이슈 + HOT 토론·채팅).
 *
 * 기존 V3 5섹션 홈은 /dashboard 에 보존.
 */
export default function RootPage() {
  redirect("/kr");
}
