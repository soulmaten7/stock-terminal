// KR 종목명 로케일 선택 — 오늘·탐색 공용(중복 구현 금지·STEP 770 §3). 순수 함수, 클라이언트 안전.
export function pickKrName(loc: 'ko' | 'en', nameKo: string | null | undefined, nameEn: string | null | undefined, fallback: string): string {
  if (loc === 'en') return nameEn || nameKo || fallback;
  return nameKo || fallback;
}
