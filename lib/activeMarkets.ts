// 활성 시장(STEP 799) — "한 시장을 완전히 완성한 뒤 다음으로"(ROADMAP §2-1) 원칙에 따라
// JP·CN(HK 포함)·VN·GB는 제품 표면에서 차단(파킹 — 코드·데이터·라우트는 보존, 진입로만 닫음).
// 검색·관심목록·종목상세·사이트맵이 전부 이 배열 하나만 본다 — 새 시장을 열 땐 여기 한 줄 추가로 끝나야 한다.
// 복원 절차: docs/PARKED_FIELD_SURFACES.md §7 참고.
export const ACTIVE_MARKETS = ["KR", "US"] as const;
export type ActiveCountry = (typeof ACTIVE_MARKETS)[number];

export function isActiveCountry(country: string | null | undefined): boolean {
  if (!country) return false;
  return (ACTIVE_MARKETS as readonly string[]).includes(country.toUpperCase());
}

// 심볼 패턴만으로 시장 판정 — country 필드가 없는 경로(URL의 종목코드 등)용.
// countryOf 계열(StockLensClient·EtfLensClient)과 판정 순서 정합.
export function marketOfSymbol(symbol: string): string {
  if (/^\d{6}(\.(KS|KQ))?$/i.test(symbol)) return "KR";
  if (/\.T$/i.test(symbol)) return "JP";
  if (/\.HK$/i.test(symbol)) return "HK";
  if (/\.(SS|SZ)$/i.test(symbol)) return "CN";
  if (/\.VN$/i.test(symbol)) return "VN";
  if (/\.L$/i.test(symbol)) return "GB";
  return "US";
}

export function isActiveSymbol(symbol: string): boolean {
  return isActiveCountry(marketOfSymbol(symbol));
}
