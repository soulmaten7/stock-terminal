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

/** 시가총액 = 현재가 × 주식수. 값 없거나 주식수 ≤ 0이면 null. */
export function marketCap(price: number | null | undefined, shares: number | null | undefined): number | null {
  if (!price || !shares || shares <= 0) return null;
  return price * shares;
}

/**
 * PER(주가수익비율) = 시총 / 순이익. 순이익 ≤ 0(적자)이면 null — PER은 의미 없음.
 * 야후가 PER을 안 줄 때(한국 .KS 등) 재무(순이익)로 직접 산출하는 폴백.
 */
export function perFrom(mktCap: number | null, netIncome: number | null | undefined): number | null {
  if (!mktCap || !netIncome || netIncome <= 0) return null;
  return mktCap / netIncome;
}

/** PBR(주가순자산비율) = 시총 / 자기자본. 자기자본 ≤ 0이면 null. 야후 priceToBook 없을 때 폴백. */
export function pbrFrom(mktCap: number | null, equity: number | null | undefined): number | null {
  if (!mktCap || !equity || equity <= 0) return null;
  return mktCap / equity;
}
