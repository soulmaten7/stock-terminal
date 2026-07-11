// 순수 수익률·수치 계산 — 네트워크·DB 의존 0이라 단위 테스트로 지킨다.
// krSnapshot(크론)과 화면이 쓰는 기간수익률(r1w~r1y)의 근간 계산.
// ⚠️ 정책: 값이 커도(대세 상승장) 절대 clamp/가드 하지 않는다 — 진짜 데이터 보존(§docs/LENS_DEV_PLAYBOOK.md #28).

/**
 * 기간 수익률(%) = (현재 / 과거 - 1) * 100.
 * 과거 기준가가 없거나(신규상장 등) 0, 또는 현재가가 0이면 null → 화면에서 '—'.
 */
export function pct(now: number, past: number | undefined | null): number | null {
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}
