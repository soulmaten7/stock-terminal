// 채널 리포트 국가 메타 — 홈 리포트 피드·채널 카드·/reports 목록이 전부 이 목록 하나만 순회한다
// (ORDER_트릴리언국가확장구조_0905). 새 국가 채널을 열 때 여기 항목 하나 + messages/{ko,en}.json의
// Today.countries.{code}.{name,reportsTitle} 블록 하나만 추가하면 되고, 컴포넌트 수정은 없어야 한다.
//
// 🔴 lib/constants/countries.ts(파킹된 Toolbox 전용, ko 단일명·거래소 분류)와 lib/activeMarkets.ts
// (구 모델트랙 종목상세·검색·사이트맵 노출 게이트)는 다른 개념이라 재사용하지 않는다 — 이 파일이
// "채널 리포트 국가"만의 정본이다(ORDER §2 판단 ④).
//
// 텍스트(국가명·섹션 제목)는 여기 두지 않고 messages.test.ts의 파리티·아포스트로피 검증을 그대로
// 받게 i18n 키(Today.countries.{code}.*)로 조회한다(ORDER §2 판단 ②) — 이 파일은 순서·국기·코드만.
export type ReportCountry = {
  code: string;
  flag: string;
  displayOrder: number;
};

export const REPORT_COUNTRIES: ReportCountry[] = [
  { code: "KR", flag: "🇰🇷", displayOrder: 1 },
  { code: "US", flag: "🇺🇸", displayOrder: 2 },
];
