// 얇은 서버 래퍼 — 'use client' 페이지는 자기 파일에서 route 세그먼트 설정을 못 한다.
// (page.tsx에 export const dynamic을 써도 Next.js가 무시 → 정적으로 굳어 stale 캐시가 뜬다.)
// 부모 layout(서버 컴포넌트)의 설정은 세그먼트 하위로 전파되므로, 페이지 코드는 건드리지 않고 여기서 강제 동적화.
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
