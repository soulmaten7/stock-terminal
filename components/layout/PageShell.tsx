import type { ReactNode } from 'react';

// 5면 PC 공용 셸(STEP 796) — 기준 = 오늘 화면 구조(본문 680 + 레일 320 + gap, max-w-1040).
// 레일이 없어도 본문 폭·좌측 선은 동일(본문이 flex-start·max-w-680이라 레일 유무로 안 움직임 = 이번 문제 재발 방지).
// 1280px 기준 본문 좌측 = (1280-1040)/2 + 24(sm:px-6) = 144px — 셸을 쓰는 모든 화면이 같은 좌표에서 시작.
// 모바일(<lg)은 763 풀블리드 규칙: 기본 px-0(오늘·탐색). 단 관심처럼 px-4 모바일을 쓰던 화면은 mobilePadded로 현행 유지(회귀 0).
// 순수 레이아웃(hooks 없음) → 서버 컴포넌트에서도 사용 가능.
export function PageShell({
  children,
  rail,
  mobilePadded = false,
}: {
  children: ReactNode;
  rail?: ReactNode;
  mobilePadded?: boolean;
}) {
  return (
    <div className={`mx-auto max-w-[1040px] py-6 ${mobilePadded ? 'px-4 sm:px-6' : 'sm:px-6'} lg:flex lg:items-start lg:gap-8`}>
      <main className="min-w-0 flex-1 lg:max-w-[680px]">{children}</main>
      {rail ? <aside className="mt-8 hidden lg:mt-0 lg:block lg:w-80 lg:shrink-0">{rail}</aside> : null}
    </div>
  );
}
