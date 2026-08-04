// 🔴 899 §2 — lossMaking(영업적자) 판정 규칙을 한 곳으로 모은다. 856부터 components/RevDcfSection.tsx와
//   app/api/revdcf/batch/route.ts가 각자 operatingMargin <= 0을 따로 구현하고 있었다 — 지금은 규칙이 같아
//   화면 간 불일치가 없지만(899 §0 재확인), 둘 중 하나만 바뀌면 그 순간 불일치가 생긴다. 계산(engine·
//   compute·drivers)과 무관한 표시 규칙이라 여기 둔다.
export function isLossMaking(operatingMargin: number | null | undefined): boolean {
  return operatingMargin != null && operatingMargin <= 0;
}
