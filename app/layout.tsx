import type { ReactNode } from 'react';

// 통과용 루트 레이아웃.
// 실제 <html>·<body>·폰트·프로바이더(NextIntl/Auth)·Analytics는 app/[locale]/layout.tsx가 담당한다.
// (locale에 따라 <html lang>이 달라져야 하므로 [locale] 아래에 있어야 함)
// 이 파일이 필요한 이유: 루트 세그먼트에 not-found.tsx가 있으면 Next가 루트 레이아웃을 요구한다.
// 루트 not-found는 스스로 <html>을 렌더하므로 여기서 감싸지 않는다.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
