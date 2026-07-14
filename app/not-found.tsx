import Link from 'next/link';
import './globals.css';

// 전역 404 폴백 — i18n 리라이트가 닿지 않는 경로에서만 렌더된다(/api/알수없음, 확장자 경로 등).
// 사용자가 실제로 보는 404는 app/[locale]/not-found.tsx (헤더·푸터·번역 포함).
// 루트 레이아웃이 통과용이라 여기서 <html>·<body>를 직접 렌더한다.
export default function GlobalNotFound() {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-screen antialiased">
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <p className="text-5xl font-bold text-unjong-primary">404</p>
          <p className="mt-3 text-lg font-semibold text-unjong-primary">페이지를 찾을 수 없습니다</p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-unjong-strong px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            홈으로
          </Link>
        </div>
      </body>
    </html>
  );
}
