// 사업자등록번호 XXX-XX-XXXXX (입력 하이픈 무관 → 표시 통일)
// 원래 lib/utils/format.ts에 있었으나 STEP1035에서 이 기능 삭제 시 유일한 호출자(BusinessClaimClient)와 함께 제거됨.
export function formatBizNo(s: string | null | undefined): string {
  if (!s) return '—';
  const d = String(s).replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  return String(s);
}
