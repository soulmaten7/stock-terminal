// 종목보드 뷰 상태(하위탭·정렬·페이지) 임시 기억 — 렌즈 상세 왕복 시 복원용.
// 모듈 레벨이라 SPA 네비게이션 사이엔 유지 · 전체 새로고침 시 초기화(정상) · 국가 전환 시 clearBoardViews().
export type BoardView = {
  sub?: string;              // 하위탭(stock/etf/etn/reit 등)
  sortKey: string;           // 정렬 키
  sortDir: 'asc' | 'desc';
  page: number;
  market?: string;           // KR 전용: 코스피/코스닥 세그먼트(있으면)
};

const mem = new Map<string, BoardView>();
export const saveBoardView = (country: string, v: BoardView) => { mem.set(country, v); };
export const loadBoardView = (country: string): BoardView | undefined => mem.get(country);
export const clearBoardViews = () => { mem.clear(); };
