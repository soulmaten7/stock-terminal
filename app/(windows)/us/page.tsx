import { redirect } from "next/navigation";

// 구 V4/V5 미국주식 셸(잔재) → 새 마켓으로 통합 리다이렉트 (STEP 216)
export default function UsPage() {
  redirect("/market");
}
